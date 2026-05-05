import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Endpoint del Camping Aquarius que retorna 6 noms CSV
// (ex: "b<ts>.png,c<ts>.png,d<ts>.png,e<ts>.png,f<ts>.png,g<ts>.png")
const ENDPOINT = "https://www.campingaquarius.com/rutasTiempos"
const IMG_BASE = "https://www.campingaquarius.com/meteo/img/"

// Cache en memoria per instancia serverless (60s; la web origen refresca cada 30s)
let cache: { at: number; speedUrl: string; directionUrl: string } | null = null
const CACHE_MS = 60 * 1000

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < CACHE_MS) {
      return NextResponse.json(
        { speedUrl: cache.speedUrl, directionUrl: cache.directionUrl, source: ENDPOINT, cachedAt: new Date(cache.at).toISOString() },
        { status: 200, headers: { "Cache-Control": "public, max-age=60" } },
      )
    }

    const res = await fetch(ENDPOINT, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ElVent/1.0)",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "*/*",
        Referer: "https://www.campingaquarius.com/la-camara-web",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `HTTP ${res.status}`, speedUrl: cache?.speedUrl, directionUrl: cache?.directionUrl },
        { status: 502 },
      )
    }

    const text = (await res.text()).trim()
    const files = text
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[a-z]\d+\.png$/i.test(s))

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Resposta inesperada del camping", raw: text.slice(0, 200), speedUrl: cache?.speedUrl, directionUrl: cache?.directionUrl },
        { status: 502 },
      )
    }

    const speedFile = files.find((f) => /^b\d+\.png$/i.test(f))
    const directionFile = files.find((f) => /^c\d+\.png$/i.test(f))
    const fallbackSpeed = files[0]
    const fallbackDirection = files[1] ?? files[0]

    const speedUrl = `${IMG_BASE}${speedFile ?? fallbackSpeed}`
    const directionUrl = `${IMG_BASE}${directionFile ?? fallbackDirection}`

    cache = { at: Date.now(), speedUrl, directionUrl }

    return NextResponse.json(
      { speedUrl, directionUrl, source: ENDPOINT, cachedAt: new Date(cache.at).toISOString() },
      { status: 200, headers: { "Cache-Control": "public, max-age=60" } },
    )
  } catch (err) {
    console.error("Error /api/aquarius-meteo:", err)
    return NextResponse.json(
      { error: "Error obtenint dades del camping", speedUrl: cache?.speedUrl, directionUrl: cache?.directionUrl },
      { status: 500 },
    )
  }
}
