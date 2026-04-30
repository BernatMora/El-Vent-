import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SOURCE_URL = "https://www.campingaquarius.com/la-camara-web"
const IMG_REGEX = /https:\/\/www\.campingaquarius\.com\/meteo\/img\/[a-z]\d+\.png/gi

// Cache en memòria (per instància serverless) — 5 min
let cache: { at: number; urls: string[] } | null = null
const CACHE_MS = 5 * 60 * 1000

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < CACHE_MS && cache.urls.length > 0) {
      return NextResponse.json(
        { urls: cache.urls, source: SOURCE_URL, cachedAt: new Date(cache.at).toISOString() },
        { status: 200, headers: { "Cache-Control": "public, max-age=300" } },
      )
    }

    const res = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ElVentBot/1.0; +https://elvent.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `HTTP ${res.status}`, urls: cache?.urls ?? [] },
        { status: 502 },
      )
    }

    const html = await res.text()
    const matches = Array.from(new Set(html.match(IMG_REGEX) ?? []))

    if (matches.length === 0) {
      return NextResponse.json(
        { error: "No s'han trobat imatges meteo", urls: cache?.urls ?? [] },
        { status: 502 },
      )
    }

    cache = { at: Date.now(), urls: matches }

    return NextResponse.json(
      { urls: matches, source: SOURCE_URL, cachedAt: new Date(cache.at).toISOString() },
      { status: 200, headers: { "Cache-Control": "public, max-age=300" } },
    )
  } catch (err) {
    console.error("Error /api/aquarius-meteo:", err)
    return NextResponse.json(
      { error: "Error obtenint dades del camping", urls: cache?.urls ?? [] },
      { status: 500 },
    )
  }
}
