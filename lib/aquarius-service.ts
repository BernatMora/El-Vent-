// Servei compartit per llegir les imatges del Davis WeatherLink del Camping Aquarius.
// Usat per l'API route /api/aquarius-readings i pel calibratge automàtic.

import sharp from "sharp"

const ENDPOINT = "https://www.campingaquarius.com/rutasTiempos"
const IMG_BASE = "https://www.campingaquarius.com/meteo/img/"
const REFERER = "https://www.campingaquarius.com/la-camara-web"
// Escala real del Davis WeatherLink del Camping Aquàrius: 0–40 km/h
// Sobreescrivible amb AQUARIUS_MAX_KMH si l'escala canvia (auto-escala en vent fort)
const SCALE_MAX_KMH = Number(process.env.AQUARIUS_MAX_KMH ?? 40)

export function getAquariusMaxKmh(): number {
  return SCALE_MAX_KMH
}

// Cache en memòria (60 s) compartida entre la ruta i el calibratge
let memCache: { at: number; data: AquariusReading } | null = null
const CACHE_MS = 60 * 1000

// ---- Detecció de colors ----

function isTeal(r: number, g: number, b: number) {
  return r < 100 && g > 100 && b > 110 && b > r + 30
}
function isOrange(r: number, g: number, b: number) {
  return r > 200 && g > 100 && g < 180 && b < 80
}

// ---- Càrrega d'imatge ----

async function fetchPng(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { Referer: REFERER }, cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status} a ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// ---- Extracció de direcció de la brúixola (c.png) ----
// rMin=0.50, rMax=0.78: evita el text de graus (dins 0.30–0.49) i els marcadors
// cardinals (~0.82) i el marc exterior (~0.88). Sense filtre textBand.

async function extractDirection(buf: Buffer): Promise<number | null> {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  const cx = W / 2, cy = H / 2
  const minR = Math.min(W, H) / 2
  const rMin = minR * 0.50
  const rMax = minR * 0.78
  let bestDist = -1, bestDx = 0, bestDy = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C
      if (!isTeal(data[i], data[i + 1], data[i + 2])) continue
      const dx = x - cx, dy = y - cy
      const dist = Math.hypot(dx, dy)
      if (dist < rMin || dist > rMax) continue
      if (dist > bestDist) { bestDist = dist; bestDx = dx; bestDy = dy }
    }
  }
  if (bestDist < 0) return null
  let deg = Math.atan2(bestDx, -bestDy) * 180 / Math.PI
  if (deg < 0) deg += 360
  return Math.round(deg)
}

// ---- Detecció automàtica de l'escala de l'eix Y ----
// El Davis WeatherLink auto-escala la gràfica (0-20, 0-30, 0-40, 0-60 km/h…).
// Detectem l'escala comptant les transicions de lluminositat entre les bandes
// horitzontals del fons (una banda per cada 10 km/h).
// Retorna el màxim de l'eix Y, o el fallback configurat si la detecció falla.

function detectScaleMax(
  data: Buffer,
  W: number,
  C: number,
  plotLeft: number,
  plotRight: number,
  plotTop: number,
  plotBottom: number,
  fallback: number,
): number {
  const plotH = plotBottom - plotTop

  // Lluminositat mitjana per fila (mostrejant cada 4 columnes, ignorant teal/orange)
  const rowLum: number[] = []
  for (let y = plotTop; y <= plotBottom; y++) {
    let sum = 0, cnt = 0
    for (let x = plotLeft + 2; x <= plotRight - 2; x += 4) {
      const i = (y * W + x) * C
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (isTeal(r, g, b) || isOrange(r, g, b)) continue
      sum += (r + g + b) / 3
      cnt++
    }
    rowLum.push(cnt > 0 ? sum / cnt : 255)
  }

  // Detecta transicions entre bandes: la mitjana dels 3 pixels abans ≠ dels 3 després
  const THRESH = 5
  const rawTrans: number[] = []
  for (let i = 3; i < rowLum.length - 3; i++) {
    const before = (rowLum[i - 1] + rowLum[i - 2] + rowLum[i - 3]) / 3
    const after  = (rowLum[i + 1] + rowLum[i + 2] + rowLum[i + 3]) / 3
    if (Math.abs(before - after) >= THRESH) rawTrans.push(i)
  }

  // Fusiona transicions properes (< 6 px = mateixa línia de quadrícula)
  const gridlines: number[] = []
  let last = -999
  for (const y of rawTrans) {
    if (y - last > 6) gridlines.push(y)
    last = y
  }

  // Elimina transicions de vora (artefactes del límit plot/marge)
  const EDGE = 12
  const inner = gridlines.filter(y => y > EDGE && y < plotH - EDGE)

  // Línies interiors = quadrícules a 10, 20, …, (max-10) km/h
  // max = (count + 1) × 10
  const count = inner.length
  if (count >= 1 && count <= 7) {
    const inferred = (count + 1) * 10
    const valid = [20, 30, 40, 60, 80]
    return valid.reduce((best, s) =>
      Math.abs(s - inferred) < Math.abs(best - inferred) ? s : best
    )
  }

  return fallback
}

// ---- Extracció de velocitat del gràfic (b.png) ----
// Retorna speedFraction (0–1, fracció de l'eix Y) a més dels km/h calculats.
// speedFraction permet calibrar l'escala real sense OCR.

interface WindExtraction {
  speedKmh: number | null
  gustKmh: number | null
  speedKnots: number | null
  gustKnots: number | null
  speedFraction: number | null
  gustFraction: number | null
  detectedMaxKmh: number
}

async function extractWind(buf: Buffer, fallbackMaxKmh: number): Promise<WindExtraction> {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  const plotLeft = Math.round(W * 0.06)
  const plotRight = Math.round(W * 0.985)
  const plotTop = Math.round(H * 0.08)
  const plotBottom = Math.round(H * 0.81)
  const plotH = plotBottom - plotTop

  const maxKmh = detectScaleMax(data, W, C, plotLeft, plotRight, plotTop, plotBottom, fallbackMaxKmh)

  type Col = { x: number; speedYs: number[]; gustYs: number[] }
  const columns: Col[] = []

  for (let x = plotLeft; x <= plotRight; x++) {
    const speedYs: number[] = []
    const gustYs: number[] = []
    for (let y = plotTop; y <= plotBottom; y++) {
      const i = (y * W + x) * C
      if (isTeal(data[i], data[i + 1], data[i + 2])) speedYs.push(y)
      if (isOrange(data[i], data[i + 1], data[i + 2])) gustYs.push(y)
    }
    if (speedYs.length || gustYs.length) columns.push({ x, speedYs, gustYs })
  }

  // Busca el color de vent i ratxa per separat: la línia de ratxa (orange)
  // pot avançar uns píxels més a la dreta que la de vent (teal), i viceversa.
  const sorted = columns.sort((a, b) => b.x - a.x)
  const speedCol = sorted.find((c) => c.speedYs.length > 0)
  const gustCol  = sorted.find((c) => c.gustYs.length > 0)

  const avg = (ys: number[]) => ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null
  const speedY = speedCol ? avg(speedCol.speedYs) : null
  const gustY  = gustCol  ? avg(gustCol.gustYs)   : null

  const toFraction = (y: number | null) =>
    y !== null ? Math.max(0, Math.min(1, (plotBottom - y) / plotH)) : null

  const sFrac = toFraction(speedY)
  const gFrac = toFraction(gustY)

  const toKmh = (f: number | null) => f !== null ? +(maxKmh * f).toFixed(1) : null
  const sKmh = toKmh(sFrac)
  const gKmh = toKmh(gFrac)

  return {
    speedKmh: sKmh,
    gustKmh: gKmh,
    speedKnots: sKmh !== null ? Math.round(sKmh / 1.852) : null,
    gustKnots: gKmh !== null ? Math.round(gKmh / 1.852) : null,
    speedFraction: sFrac,
    gustFraction: gFrac,
    detectedMaxKmh: maxKmh,
  }
}

// ---- Interfície pública ----

export interface AquariusReading {
  timestamp: number | null
  windDirection: number | null
  windSpeedKmh: number | null
  windGustKmh: number | null
  windSpeed: number | null   // nusos
  windGust: number | null    // nusos
  speedFraction: number | null
  gustFraction: number | null
  maxKmhUsed: number
  isApproximate: boolean
  note: string
  images: { speedChart: string; direction: string }
}

export async function getAquariusReading(forceRefresh = false): Promise<AquariusReading> {
  if (!forceRefresh && memCache && Date.now() - memCache.at < CACHE_MS) {
    return memCache.data
  }

  const maxKmh = getAquariusMaxKmh()

  const r = await fetch(ENDPOINT, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ElVent/1.0)",
      "X-Requested-With": "XMLHttpRequest",
      Referer: REFERER,
      Accept: "*/*",
    },
    cache: "no-store",
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} a rutasTiempos`)

  const text = (await r.text()).trim()
  const files = text.split(",").map((s) => s.trim()).filter((s) => /^[a-z]\d+\.png$/i.test(s))
  if (files.length < 2) throw new Error(`Resposta inesperada: ${text.slice(0, 100)}`)

  const tsMatch = files[0].match(/^[a-z](\d+)\.png$/)
  const ts = tsMatch ? Number(tsMatch[1]) : null
  const bUrl = `${IMG_BASE}${files[0]}`
  const cUrl = `${IMG_BASE}${files[1]}`

  const [bBuf, cBuf] = await Promise.all([fetchPng(bUrl), fetchPng(cUrl)])
  const [direction, wind] = await Promise.all([extractDirection(cBuf), extractWind(bBuf, maxKmh)])

  const reading: AquariusReading = {
    timestamp: ts,
    windDirection: direction,
    windSpeedKmh: wind.speedKmh,
    windGustKmh: wind.gustKmh,
    windSpeed: wind.speedKnots,
    windGust: wind.gustKnots,
    speedFraction: wind.speedFraction,
    gustFraction: wind.gustFraction,
    maxKmhUsed: wind.detectedMaxKmh,
    isApproximate: true,
    note: `Velocitat: aprox. (escala detectada ${wind.detectedMaxKmh} km/h). Direcció: fiable.`,
    images: { speedChart: bUrl, direction: cUrl },
  }

  memCache = { at: Date.now(), data: reading }
  return reading
}
