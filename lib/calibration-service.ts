// Calibratge automàtic del vent (sense Supabase).
// Compara cada ~30 min la previsió d'Open-Meteo amb les dades reals de Meteocat
// i manté factors de correcció per direcció (categoria de 8 punts).
//
// Estat persistit a `.calibration-state.json` (com `.meteocat-usage.json`).

import fs from "fs"
import path from "path"
import { getMultiModelForecast } from "./open-meteo-api"
import { getMeteocatCurrentConditions } from "./meteocat-api"

const STATE_PATH = path.join(process.cwd(), ".calibration-state.json")

const RUN_INTERVAL_MS = 60 * 60 * 1000 // cada 60 minuts (alineat amb la freqüència fixa de Meteocat)
const HISTORY_LIMIT = 200
const MIN_PREDICTED_KTS = 2 // ignorar mostres amb previsió molt baixa (sorollós)
const EMA_ALPHA = 0.25 // pes de la nova mostra a la mitjana mòbil
const CONFIDENCE_FULL_AT = 12 // mostres per arribar a confiança 1
const FACTOR_MIN = 0.4
const FACTOR_MAX = 2.5

export type DirectionCategory = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"

const ALL_CATEGORIES: DirectionCategory[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

interface DirectionFactor {
  windSpeedFactor: number
  windGustFactor: number
  sampleCount: number
  lastUpdated: string | null
}

export interface HistoryEntry {
  timestamp: string
  direction: number
  directionCategory: DirectionCategory
  predictedWindSpeed: number
  predictedWindGust: number
  realWindSpeed: number
  realWindGust: number
  windSpeedFactor: number
  windGustFactor: number
  station: string
}

interface CalibrationState {
  lastRun: string | null
  factors: Record<DirectionCategory, DirectionFactor>
  history: HistoryEntry[]
}

function emptyFactor(): DirectionFactor {
  return { windSpeedFactor: 1, windGustFactor: 1, sampleCount: 0, lastUpdated: null }
}

function emptyFactors(): Record<DirectionCategory, DirectionFactor> {
  return ALL_CATEGORIES.reduce((acc, k) => {
    acc[k] = emptyFactor()
    return acc
  }, {} as Record<DirectionCategory, DirectionFactor>)
}

function loadState(): CalibrationState {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"))
      return {
        lastRun: raw.lastRun ?? null,
        factors: { ...emptyFactors(), ...(raw.factors || {}) },
        history: Array.isArray(raw.history) ? raw.history : [],
      }
    }
  } catch (err) {
    console.warn("No s'ha pogut llegir l'estat de calibratge:", err)
  }
  return { lastRun: null, factors: emptyFactors(), history: [] }
}

function saveState(state: CalibrationState) {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
  } catch (err) {
    console.warn("No s'ha pogut escriure l'estat de calibratge:", err)
  }
}

// ---- Utilitats de direcció ----

export function getWindDirectionCategory(degrees: number): DirectionCategory {
  const d = ((degrees % 360) + 360) % 360
  if (d >= 337.5 || d < 22.5) return "N"
  if (d < 67.5) return "NE"
  if (d < 112.5) return "E"
  if (d < 157.5) return "SE"
  if (d < 202.5) return "S"
  if (d < 247.5) return "SW"
  if (d < 292.5) return "W"
  return "NW"
}

export function getWindName(degrees: number): string {
  const names: Record<DirectionCategory, string> = {
    N: "Tramuntana",
    NE: "Gregal",
    E: "Llevant",
    SE: "Xaloc",
    S: "Migjorn",
    SW: "Garbí/Llebeig",
    W: "Ponent",
    NW: "Mestral",
  }
  return names[getWindDirectionCategory(degrees)]
}

// ---- API pública per altres mòduls ----

export type FactorsExport = Record<
  string,
  {
    windSpeedFactor: number
    windGustFactor: number
    confidence: number
    sampleCount: number
    lastUpdated: string | null
  }
>

export async function getCalibrationFactors(): Promise<FactorsExport> {
  const state = loadState()
  const out: FactorsExport = {}
  for (const [k, f] of Object.entries(state.factors)) {
    if (f.sampleCount > 0) {
      out[k] = {
        windSpeedFactor: f.windSpeedFactor,
        windGustFactor: f.windGustFactor,
        confidence: Math.min(1, f.sampleCount / CONFIDENCE_FULL_AT),
        sampleCount: f.sampleCount,
        lastUpdated: f.lastUpdated,
      }
    }
  }
  return out
}

export async function getCalibrationHistory(limit = 30): Promise<HistoryEntry[]> {
  const state = loadState()
  return state.history.slice(0, limit)
}

export async function getCalibrationStatus() {
  const state = loadState()
  return {
    lastRun: state.lastRun,
    nextRunDueAt: state.lastRun
      ? new Date(new Date(state.lastRun).getTime() + RUN_INTERVAL_MS).toISOString()
      : null,
    intervalMinutes: RUN_INTERVAL_MS / 60000,
    totalSamples: Object.values(state.factors).reduce((sum, f) => sum + f.sampleCount, 0),
    factors: await getCalibrationFactors(),
  }
}

export function applyCalibration(
  windSpeed: number,
  windGust: number,
  direction: number,
  factors: FactorsExport,
): { windSpeed: number; windGust: number; calibrated: boolean; confidence: number } {
  const cat = getWindDirectionCategory(direction)
  const f = factors[cat]
  if (!f || f.confidence < 0.2) {
    return { windSpeed, windGust, calibrated: false, confidence: 0 }
  }
  const adjustedSpeed = Math.max(0, Math.round(windSpeed * f.windSpeedFactor))
  const adjustedGust = Math.max(0, Math.round(windGust * f.windGustFactor))
  return {
    windSpeed: adjustedSpeed,
    windGust: Math.max(adjustedGust, adjustedSpeed),
    calibrated: true,
    confidence: f.confidence,
  }
}

// ---- Auto-calibratge ----

function clamp(x: number, min = FACTOR_MIN, max = FACTOR_MAX) {
  if (!Number.isFinite(x)) return 1
  return Math.max(min, Math.min(max, x))
}

let inflight: Promise<{ ran: boolean; reason?: string }> | null = null

/**
 * Executa una passada de calibratge si han passat ≥30 min des de l'última.
 * Idempotent i segur en concurrència. Pensat per cridar-se amb `void`
 * a les rutes /api/current i /api/forecast.
 */
export async function runAutoCalibrationIfDue(
  force = false,
): Promise<{ ran: boolean; reason?: string }> {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const state = loadState()
      const now = Date.now()
      if (!force && state.lastRun) {
        const since = now - new Date(state.lastRun).getTime()
        if (since < RUN_INTERVAL_MS) return { ran: false, reason: "too-soon" }
      }

      // Marquem l'inici aviat per evitar curses entre processos
      state.lastRun = new Date(now).toISOString()
      saveState(state)

      // 1) Dades reals (Meteocat)
      const real = await getMeteocatCurrentConditions().catch(() => null)
      if (!real) return { ran: false, reason: "no-meteocat" }

      // 2) Previsió per a l'hora actual (Open-Meteo multi-model)
      let forecast: any[] = []
      try {
        forecast = await getMultiModelForecast("kitesurf-point")
      } catch {
        return { ran: false, reason: "no-forecast" }
      }
      if (!forecast || forecast.length === 0) return { ran: false, reason: "no-forecast" }

      const today = forecast[0]
      const currentHour = new Date().getHours()
      let predicted: any = null
      let bestDiff = 99
      for (const h of today.hours || []) {
        const hourNum = h.hour ?? parseInt(String(h.time || "0").split(":")[0])
        const diff = Math.abs(hourNum - currentHour)
        if (diff < bestDiff) {
          bestDiff = diff
          predicted = h
        }
      }
      if (!predicted) return { ran: false, reason: "no-hour" }

      const predSpeed = Number(predicted.windSpeed) || 0
      const predGust = Number(predicted.windGust) || 0
      if (predSpeed < MIN_PREDICTED_KTS) {
        return { ran: false, reason: "predicted-too-low" }
      }

      const direction = real.windDirection ?? predicted.windDirection ?? 0
      const cat = getWindDirectionCategory(direction)
      const sFactor = clamp(real.windSpeed / predSpeed)
      const gFactor = clamp(predGust > 0 ? real.windGust / predGust : sFactor)

      const cur = state.factors[cat]
      const alpha = cur.sampleCount === 0 ? 1 : EMA_ALPHA
      state.factors[cat] = {
        windSpeedFactor: +(cur.windSpeedFactor * (1 - alpha) + sFactor * alpha).toFixed(3),
        windGustFactor: +(cur.windGustFactor * (1 - alpha) + gFactor * alpha).toFixed(3),
        sampleCount: cur.sampleCount + 1,
        lastUpdated: new Date().toISOString(),
      }

      state.history.unshift({
        timestamp: new Date().toISOString(),
        direction,
        directionCategory: cat,
        predictedWindSpeed: predSpeed,
        predictedWindGust: predGust,
        realWindSpeed: real.windSpeed,
        realWindGust: real.windGust,
        windSpeedFactor: +sFactor.toFixed(3),
        windGustFactor: +gFactor.toFixed(3),
        station: real.stationName,
      })
      state.history = state.history.slice(0, HISTORY_LIMIT)

      saveState(state)

      console.log(
        `✅ Auto-calibratge ${cat}: sF=${sFactor.toFixed(2)} gF=${gFactor.toFixed(2)} ` +
          `(real ${real.windSpeed} kts vs previst ${predSpeed} kts)`,
      )
      return { ran: true }
    } catch (err) {
      console.error("Error en calibratge automàtic:", err)
      return { ran: false, reason: "error" }
    } finally {
      // s'allibera el flag al sortir; loadState() la propera vegada llegeix l'estat actualitzat
      inflight = null
    }
  })()
  return inflight
}
