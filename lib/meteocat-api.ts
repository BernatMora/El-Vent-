// --- Control global de consultes Meteocat ---
// Política: à ESTRUCTURA FIXA — totes les peticions compartides per tots els usuaris.
//   - Màxim 750 consultes/mes (límit del pla Meteocat).
//   - Una consulta nova només es fa cada FIXED_INTERVAL_MS (60 min) com a màxim.
//     24 consultes/dia × 30 = 720/mes (marge de seguretat).
//   - L'estat (última consulta + dades + comptador mensual) es persisteix a disk
//     a `.meteocat-usage.json` perquè totes les invocacions serverless el comparteixin.
//   - Si s'arriba al límit mensual o no toca refrescar, es retorna l'última dada
//     cachejada (mai es fa una nova petició fora de l'horari fix).
import fs from 'fs'
import os from 'os'
import path from 'path'

const METEOCAT_LIMIT = 750
const FIXED_INTERVAL_MS = 60 * 60 * 1000 // 1 hora entre consultes
// Consultem 24h/24h amb interval d'1h: 24×30 = 720/mes (sota el límit 750).
// Mantenim DAYTIME_* per a info diagnòstica, però NO bloquegen la consulta.
const DAYTIME_START_HOUR = 8
const DAYTIME_END_HOUR = 21
// A serverless (Netlify/Vercel) `process.cwd()` no és escrivible o no persisteix
// entre invocacions. Usem `/tmp` (escrivible mentre l'instància lambda està viva)
// i caiem a cwd en local. Permet reduir crides Meteocat dins una mateixa instància warm.
function resolveLogPath(): string {
  const fileName = '.meteocat-usage.json'
  const candidates = [
    process.env.METEOCAT_CACHE_DIR,
    process.env.NETLIFY ? os.tmpdir() : null,
    process.env.VERCEL ? os.tmpdir() : null,
    process.cwd(),
    os.tmpdir(),
  ].filter(Boolean) as string[]
  for (const dir of candidates) {
    try {
      fs.accessSync(dir, fs.constants.W_OK)
      return path.join(dir, fileName)
    } catch {}
  }
  return path.join(os.tmpdir(), fileName)
}
const METEOCAT_LOG_PATH = resolveLogPath()

interface UsageLog {
  // Comptador per mes (YYYY-MM): nombre de cicles de refresc realitzats
  months: Record<string, { count: number }>
  // Últim refresc realitzat
  lastFetchAt: number | null
  // Última dada obtinguda (cache global compartit entre invocacions)
  lastReading: MeteocatCurrentConditions | null
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function readUsageLog(): UsageLog {
  try {
    if (fs.existsSync(METEOCAT_LOG_PATH)) {
      const raw = JSON.parse(fs.readFileSync(METEOCAT_LOG_PATH, 'utf8'))
      // Migració des del format antic { 'YYYY-MM': { count, last } }
      if (raw && !raw.months && Object.keys(raw).some(k => /^\d{4}-\d{2}$/.test(k))) {
        const months: Record<string, { count: number }> = {}
        for (const [k, v] of Object.entries<any>(raw)) {
          if (/^\d{4}-\d{2}$/.test(k)) months[k] = { count: v?.count ?? 0 }
        }
        return { months, lastFetchAt: null, lastReading: null }
      }
      return {
        months: raw.months ?? {},
        lastFetchAt: raw.lastFetchAt ?? null,
        lastReading: raw.lastReading ?? null,
      }
    }
  } catch {}
  return { months: {}, lastFetchAt: null, lastReading: null }
}

function writeUsageLog(log: UsageLog) {
  try {
    fs.writeFileSync(METEOCAT_LOG_PATH, JSON.stringify(log, null, 2))
  } catch {}
}

function monthlyCount(log: UsageLog): number {
  return log.months[getMonthKey()]?.count ?? 0
}

function underMonthlyLimit(log: UsageLog): boolean {
  return monthlyCount(log) < METEOCAT_LIMIT
}

function isDaytime(date = new Date()): boolean {
  // Hora local Europe/Madrid (Netlify executa en UTC, cal convertir-ho)
  const localHour = Number(
    new Intl.DateTimeFormat('ca-ES', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Europe/Madrid',
    }).format(date),
  )
  return localHour >= DAYTIME_START_HOUR && localHour <= DAYTIME_END_HOUR
}

function shouldRefresh(log: UsageLog): boolean {
  if (!underMonthlyLimit(log)) return false
  // Permetem consultes 24h/24h: l'usuari pot mirar condicions a qualsevol hora.
  // El límit ve donat per FIXED_INTERVAL_MS (1h) → 720/mes < 750.
  if (!log.lastFetchAt) return true
  return Date.now() - log.lastFetchAt >= FIXED_INTERVAL_MS
}

function registerFetch(log: UsageLog, reading: MeteocatCurrentConditions | null) {
  const key = getMonthKey()
  if (!log.months[key]) log.months[key] = { count: 0 }
  log.months[key].count++
  log.lastFetchAt = Date.now()
  if (reading) log.lastReading = reading
  writeUsageLog(log)
}

export function getMeteocatUsage() {
  const log = readUsageLog()
  const used = monthlyCount(log)
  return {
    monthlyLimit: METEOCAT_LIMIT,
    monthlyUsed: used,
    monthlyRemaining: Math.max(0, METEOCAT_LIMIT - used),
    lastFetchAt: log.lastFetchAt ? new Date(log.lastFetchAt).toISOString() : null,
    nextFetchAt: log.lastFetchAt
      ? new Date(log.lastFetchAt + FIXED_INTERVAL_MS).toISOString()
      : null,
    intervalMinutes: FIXED_INTERVAL_MS / 60000,
    daytimeWindow: `${DAYTIME_START_HOUR}:00–${DAYTIME_END_HOUR}:00`,
    isDaytime: isDaytime(),
  }
}
// API Meteocat XEMA - Dades reals de l'estació de Sant Pere Pescador
// Documentació: https://apidocs.meteocat.gencat.cat/documentacio/dades-mesurades/

const METEOCAT_BASE = "https://api.meteo.cat/xema/v1"

// Codis de variables Meteocat (oficials)
const VARIABLE_CODES = {
  WIND_SPEED_10M: 30,      // Velocitat del vent a 10m (m/s)
  WIND_DIRECTION_10M: 31,  // Direcció del vent a 10m (°)
  WIND_GUST_10M: 50,       // Ratxa màxima del vent a 10m (m/s)
  TEMPERATURE: 32,         // Temperatura (°C)
  HUMIDITY: 33,            // Humitat relativa (%)
}

// Estacions per ordre de prioritat (la primera és la del spot, la resta fallbacks propers)
// U2 = Sant Pere Pescador (3m, dins del spot)
// W2 = Torroella de Fluvià (7m, ~4 km O)
// W3 = Ventalló (4m, ~5 km SO)
// D4 = Roses (23m, ~10 km NE)
const STATION_CHAIN = [
  { code: "U2", name: "Sant Pere Pescador" },
  { code: "W2", name: "Torroella de Fluvià" },
  { code: "W3", name: "Ventalló" },
  { code: "D4", name: "Roses" },
] as const

// Mantenir constant per compatibilitat amb codi existent
const STATION_CODE = STATION_CHAIN[0].code

export interface MeteocatCurrentConditions {
  windSpeed: number        // en nusos
  windDirection: number    // en graus
  windGust: number         // en nusos
  temperature: number      // en °C
  humidity: number         // en %
  lastUpdate: string
  stationName: string
  stationCode: string
  isFallback: boolean      // true si no és l'estació primària (U2)
  isReal: true
  source: "Meteocat XEMA"
}

export interface MeteocatReading {
  time: string
  windSpeed: number
  windDirection: number
  windGust: number
  temperature: number
  humidity: number
  isReal: true
  source: "Meteocat XEMA"
}

// Convertir m/s a nusos
function msToKnots(ms: number): number {
  return Math.round(ms * 1.94384)
}

// Headers amb API key
function getHeaders(): HeadersInit {
  const apiKey = process.env.METEOCAT_API_KEY
  if (!apiKey) {
    throw new Error("METEOCAT_API_KEY no configurada")
  }
  return {
    "X-Api-Key": apiKey,
    "Accept": "application/json"
  }
}

// Obtenir les últimes lectures d'una variable per una estació concreta
async function getLatestReadingFromStation(stationCode: string, variableCode: number): Promise<{ value: number; time: string } | null> {
  try {
    const url = `${METEOCAT_BASE}/variables/mesurades/${variableCode}/ultimes?codiEstacio=${stationCode}`

    const response = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 300 } // Cache 5 minuts
    })

    if (!response.ok) {
      console.error(`Meteocat ${stationCode} var ${variableCode}: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.lectures && data.lectures.length > 0) {
      const lastReading = data.lectures[data.lectures.length - 1]
      return {
        value: lastReading.valor,
        time: lastReading.data
      }
    }

    return null
  } catch (error) {
    console.error(`Error obtenint ${stationCode} var ${variableCode}:`, error)
    return null
  }
}

// Versió legacy (estació per defecte) — mantinguda per compatibilitat
async function getLatestReading(variableCode: number): Promise<{ value: number; time: string } | null> {
  return getLatestReadingFromStation(STATION_CODE, variableCode)
}

// Obtenir totes les dades d'un dia per una estació
async function getDayReadings(date: Date): Promise<any | null> {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  try {
    const url = `${METEOCAT_BASE}/estacions/mesurades/${STATION_CODE}/${year}/${month}/${day}`
    
    const response = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      console.error(`Error Meteocat dia: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error obtenint dades del dia:", error)
    return null
  }
}

// Obtenir condicions actuals — política d'horari fix global
// (1 consulta cada FIXED_INTERVAL_MS, màxim METEOCAT_LIMIT/mes, compartit per tothom)
let inflight: Promise<MeteocatCurrentConditions | null> | null = null

export async function getMeteocatCurrentConditions(): Promise<MeteocatCurrentConditions | null> {
  const log = readUsageLog()

  // 1) Si encara no toca refrescar, retornem l'última dada cachejada (de disc)
  if (!shouldRefresh(log)) {
    if (!underMonthlyLimit(log)) {
      console.warn(
        `[Meteocat] Límit mensual ${METEOCAT_LIMIT} assolit (${monthlyCount(log)}), servint cache`,
      )
    }
    return log.lastReading
  }

  // 2) Coalescència de peticions concurrents en aquesta instància
  if (inflight) return inflight

  inflight = (async () => {
    try {
      // Re-llegim per si una altra instància ha refrescat just ara
      const fresh = readUsageLog()
      if (!shouldRefresh(fresh)) return fresh.lastReading

      // Marquem l'intent abans de la crida per evitar que altres invocacions concurrents
      // (en serverless) facin la mateixa petició.
      fresh.lastFetchAt = Date.now()
      writeUsageLog(fresh)

      const result = await fetchMeteocatCurrentConditions()
      // Sumem 1 al comptador mensual encara que falli (per evitar bucles agressius)
      const after = readUsageLog()
      registerFetch(after, result ?? after.lastReading)
      return result ?? after.lastReading
    } finally {
      inflight = null
    }
  })()

  return inflight
}

async function fetchMeteocatCurrentConditions(): Promise<MeteocatCurrentConditions | null> {
  console.log(`🌡️ Obtenint dades reals de Meteocat (cadena: ${STATION_CHAIN.map(s => s.code).join(" → ")})...`)

  for (let i = 0; i < STATION_CHAIN.length; i++) {
    const station = STATION_CHAIN[i]
    const isFallback = i > 0

    try {
      const [windSpeed, windDirection, windGust, temperature, humidity] = await Promise.all([
        getLatestReadingFromStation(station.code, VARIABLE_CODES.WIND_SPEED_10M),
        getLatestReadingFromStation(station.code, VARIABLE_CODES.WIND_DIRECTION_10M),
        getLatestReadingFromStation(station.code, VARIABLE_CODES.WIND_GUST_10M),
        getLatestReadingFromStation(station.code, VARIABLE_CODES.TEMPERATURE),
        getLatestReadingFromStation(station.code, VARIABLE_CODES.HUMIDITY),
      ])

      if (!windSpeed) {
        console.warn(`⚠️ Estació ${station.code} (${station.name}) sense dades de vent — provant següent`)
        continue
      }

      // Validar que la lectura sigui recent (< 90 min)
      const readingAge = Date.now() - new Date(windSpeed.time).getTime()
      if (readingAge > 90 * 60 * 1000) {
        console.warn(`⚠️ Estació ${station.code} obsoleta (${Math.round(readingAge / 60000)} min) — provant següent`)
        continue
      }

      const windSpeedKnots = msToKnots(windSpeed.value)
      const windGustKnots = windGust ? msToKnots(windGust.value) : Math.round(windSpeedKnots * 1.3)

      const result: MeteocatCurrentConditions = {
        windSpeed: windSpeedKnots,
        windDirection: Math.round(windDirection?.value ?? 0),
        windGust: Math.max(windGustKnots, windSpeedKnots),
        temperature: Math.round(temperature?.value ?? 20),
        humidity: Math.round(humidity?.value ?? 70),
        lastUpdate: windSpeed.time,
        stationName: station.name,
        stationCode: station.code,
        isFallback,
        isReal: true,
        source: "Meteocat XEMA"
      }

      const prefix = isFallback ? `🔄 FALLBACK ${station.code}` : `✅ ${station.code}`
      console.log(`${prefix} (${station.name}): ${result.windSpeed} kts, ràfega ${result.windGust} kts, dir ${result.windDirection}°`)

      return result
    } catch (error) {
      console.error(`Error a estació ${station.code}:`, error)
    }
  }

  console.error("❌ Cap estació de la cadena Meteocat retorna dades vàlides")
  return null
}

// Obtenir històric del dia actual (per mostrar evolució real)
export async function getMeteocatTodayHistory(): Promise<MeteocatReading[]> {
  console.log(`📊 Obtenint històric real d'avui de Meteocat...`)

  try {
    const today = new Date()
    const dayData = await getDayReadings(today)
    
    if (!dayData || !Array.isArray(dayData) || dayData.length === 0) {
      console.log("No hi ha dades del dia")
      return []
    }

    const stationData = dayData[0]
    if (!stationData.variables) {
      return []
    }

    // Organitzar dades per hora
    const hourlyData: { [time: string]: Partial<MeteocatReading> } = {}

    for (const variable of stationData.variables) {
      const code = variable.codi
      
      for (const lecture of variable.lectures || []) {
        const time = lecture.data
        const lectureDate = new Date(time)
        const hour = lectureDate.getUTCHours() + 2 // UTC a hora local (CEST)
        
        // Només hores de navegació (9:00 - 21:00)
        if (hour < 9 || hour > 21) continue
        
        const hourKey = `${String(hour).padStart(2, '0')}:00`
        
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = {
            time: hourKey,
            isReal: true,
            source: "Meteocat XEMA"
          }
        }

        switch (code) {
          case VARIABLE_CODES.WIND_SPEED_10M:
            hourlyData[hourKey].windSpeed = msToKnots(lecture.valor)
            break
          case VARIABLE_CODES.WIND_DIRECTION_10M:
            hourlyData[hourKey].windDirection = Math.round(lecture.valor)
            break
          case VARIABLE_CODES.WIND_GUST_10M:
            hourlyData[hourKey].windGust = msToKnots(lecture.valor)
            break
          case VARIABLE_CODES.TEMPERATURE:
            hourlyData[hourKey].temperature = Math.round(lecture.valor)
            break
          case VARIABLE_CODES.HUMIDITY:
            hourlyData[hourKey].humidity = Math.round(lecture.valor)
            break
        }
      }
    }

    // Convertir a array i completar dades faltants
    const readings = Object.values(hourlyData)
      .filter(r => r.windSpeed !== undefined)
      .map(r => ({
        time: r.time!,
        windSpeed: r.windSpeed!,
        windDirection: r.windDirection ?? 0,
        windGust: Math.max(r.windGust ?? Math.round(r.windSpeed! * 1.3), r.windSpeed!),
        temperature: r.temperature ?? 20,
        humidity: r.humidity ?? 70,
        isReal: true as const,
        source: "Meteocat XEMA" as const
      }))
      .sort((a, b) => a.time.localeCompare(b.time))

    console.log(`✅ Obtingudes ${readings.length} lectures reals d'avui`)
    
    return readings
  } catch (error) {
    console.error("Error obtenint històric Meteocat:", error)
    return []
  }
}

// Funció legacy per compatibilitat (retorna array buit - usar getMeteocatCurrentConditions)
export async function getMeteocatForecast(): Promise<any[]> {
  console.log("⚠️ getMeteocatForecast() és legacy - usant getMeteocatCurrentConditions()")
  return []
}

// Classe legacy per compatibilitat
export class MeteocatProvider {
  name = "Meteocat XEMA"
  priority = 1

  async getCurrentWeather() {
    return getMeteocatCurrentConditions()
  }

  async isAvailable(): Promise<boolean> {
    // Retornar false directament si no hi ha clau API configurada
    // Això evita fer crides innecessàries a l'API
    const apiKey = process.env.METEOCAT_API_KEY
    if (!apiKey) {
      return false
    }
    
    // Només verificar disponibilitat si tenim clau
    try {
      const url = `${METEOCAT_BASE}/variables/mesurades/${VARIABLE_CODES.WIND_SPEED_10M}/ultimes?codiEstacio=${STATION_CODE}`
      const response = await fetch(url, { headers: getHeaders() })
      return response.ok
    } catch {
      return false
    }
  }
}
