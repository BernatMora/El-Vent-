import { NextResponse } from "next/server"
import sharp from "sharp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ENDPOINT = "https://www.campingaquarius.com/rutasTiempos"
const IMG_BASE = "https://www.campingaquarius.com/meteo/img/"
const REFERER = "https://www.campingaquarius.com/la-camara-web"

// Escala assumida del gràfic Wind Speed (eix Y màxim, en km/h).
// Davis auto-escala segons les dades; el valor típic a Sant Pere és 20–30.
// Es pot sobreescriure amb la variable d'entorn AQUARIUS_MAX_KMH.
const ASSUMED_MAX_KMH = Number(process.env.AQUARIUS_MAX_KMH || 20)

// Cache en memòria per instància (60 s)
let cache: { at: number; data: any } | null = null
const CACHE_MS = 60 * 1000

// Reconeixem els colors de les corbes / fletxa de Davis WeatherLink
function isTeal(r: number, g: number, b: number) {
  return r < 100 && g > 100 && b > 110 && b > r + 30
}
function isOrange(r: number, g: number, b: number) {
  return r > 200 && g > 100 && g < 180 && b < 80
}

async function fetchPng(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { Referer: REFERER }, cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status} a ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// Extreu direcció en graus meteorològics de la imatge de la brúixola (c.png)
async function extractDirection(buf: Buffer): Promise<number | null> {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  const cx = W / 2, cy = H / 2
  const minR = Math.min(W, H) / 2
  const rMin = minR * 0.30
  const rMax = minR * 0.65
  let bestDist = -1, bestDx = 0, bestDy = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (!isTeal(r, g, b)) continue
      const dx = x - cx, dy = y - cy
      const dist = Math.hypot(dx, dy)
      if (dist < rMin || dist > rMax) continue
      // Excloem la zona on hi ha el text "<deg>°" (banda central-inferior)
      const inTextBand = dy > minR * 0.20 && Math.abs(dx) < minR * 0.45
      if (inTextBand) continue
      if (dist > bestDist) { bestDist = dist; bestDx = dx; bestDy = dy }
    }
  }
  if (bestDist < 0) return null
  let deg = Math.atan2(bestDx, -bestDy) * 180 / Math.PI
  if (deg < 0) deg += 360
  return Math.round(deg)
}

// Extreu velocitat i ratxa instantànies del gràfic (b.png) usant la columna més
// dreta amb dades. La conversió és aproximada perquè depèn de l'escala Y.
async function extractWind(buf: Buffer): Promise<{
  speedKmh: number | null
  gustKmh: number | null
  speedKnots: number | null
  gustKnots: number | null
  assumedMaxKmh: number
}> {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  // Caixa del plot calibrada empíricament sobre 500x180
  const plotLeft = Math.round(W * 0.06)
  const plotRight = Math.round(W * 0.985)
  const plotTop = Math.round(H * 0.08)
  const plotBottom = Math.round(H * 0.81)

  let speedY: number | null = null
  let gustY: number | null = null
  for (let x = plotRight; x >= plotLeft && (speedY === null || gustY === null); x--) {
    const tealYs: number[] = []
    const orangeYs: number[] = []
    for (let y = plotTop; y <= plotBottom; y++) {
      const i = (y * W + x) * C
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (speedY === null && isTeal(r, g, b)) tealYs.push(y)
      if (gustY === null && isOrange(r, g, b)) orangeYs.push(y)
    }
    if (speedY === null && tealYs.length) {
      speedY = tealYs.reduce((a, b) => a + b, 0) / tealYs.length
    }
    if (gustY === null && orangeYs.length) {
      gustY = orangeYs.reduce((a, b) => a + b, 0) / orangeYs.length
    }
  }

  const yToKmh = (y: number | null) => {
    if (y === null) return null
    return Math.max(0, ASSUMED_MAX_KMH * (plotBottom - y) / (plotBottom - plotTop))
  }
  const sKmh = yToKmh(speedY)
  const gKmh = yToKmh(gustY)
  return {
    speedKmh: sKmh !== null ? Number(sKmh.toFixed(1)) : null,
    gustKmh: gKmh !== null ? Number(gKmh.toFixed(1)) : null,
    speedKnots: sKmh !== null ? Math.round(sKmh / 1.852) : null,
    gustKnots: gKmh !== null ? Math.round(gKmh / 1.852) : null,
    assumedMaxKmh: ASSUMED_MAX_KMH,
  }
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < CACHE_MS) {
      return NextResponse.json(cache.data, {
        status: 200,
        headers: { "Cache-Control": "public, max-age=60" },
      })
    }

    // 1) Obtenir el timestamp actual (i les URLs de les imatges)
    const r = await fetch(ENDPOINT, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ElVent/1.0)",
        "X-Requested-With": "XMLHttpRequest",
        Referer: REFERER,
        Accept: "*/*",
      },
      cache: "no-store",
    })
    if (!r.ok) {
      return NextResponse.json({ error: `HTTP ${r.status} a rutasTiempos` }, { status: 502 })
    }
    const text = (await r.text()).trim()
    const files = text.split(",").map(s => s.trim()).filter(s => /^[a-z]\d+\.png$/i.test(s))
    if (files.length < 3) {
      return NextResponse.json({ error: "Resposta inesperada", raw: text.slice(0, 200) }, { status: 502 })
    }
    const tsMatch = files[0].match(/^[a-z](\d+)\.png$/)
    const ts = tsMatch ? Number(tsMatch[1]) : null
    const bUrl = `${IMG_BASE}${files[0]}`  // wind speed/gust chart
    const cUrl = `${IMG_BASE}${files[1]}`  // wind direction compass (índex 1, NO 2)

    // 2) Descarregar i analitzar en paral·lel
    const [bBuf, cBuf] = await Promise.all([fetchPng(bUrl), fetchPng(cUrl)])
    const [direction, wind] = await Promise.all([
      extractDirection(cBuf),
      extractWind(bBuf),
    ])

    const payload = {
      source: "Camping Aquàrius (Davis WeatherLink)",
      timestamp: ts ? new Date(ts * 1000).toISOString() : null,
      cachedAt: new Date().toISOString(),
      windDirection: direction, // graus meteorològics (0=N)
      windSpeedKmh: wind.speedKmh,
      windGustKmh: wind.gustKmh,
      windSpeed: wind.speedKnots, // nusos
      windGust: wind.gustKnots,   // nusos
      assumedMaxKmh: wind.assumedMaxKmh,
      isApproximate: true,
      note:
        "Direcció: precisa (extreta de la fletxa). Velocitat: aprox., depèn de l'escala del gràfic (configurable amb AQUARIUS_MAX_KMH).",
      images: {
        speedChart: bUrl,
        direction: cUrl,
      },
    }

    cache = { at: Date.now(), data: payload }
    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "public, max-age=60" },
    })
  } catch (err: any) {
    console.error("Error /api/aquarius-readings:", err)
    return NextResponse.json(
      { error: err?.message || "Error analitzant imatges del camping" },
      { status: 500 },
    )
  }
}
