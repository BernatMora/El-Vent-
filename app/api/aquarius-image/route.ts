import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_HOST = "www.campingaquarius.com"
const ALLOWED_PREFIX = "/meteo/img/"
const REFERER = "https://www.campingaquarius.com/la-camara-web"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const imageUrl = url.searchParams.get("img")
    if (!imageUrl) {
      return NextResponse.json({ error: "Falta el paràmetre img" }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(imageUrl)
    } catch {
      return NextResponse.json({ error: "URL d'imatge no vàlida" }, { status: 400 })
    }

    if (parsed.host !== ALLOWED_HOST || !parsed.pathname.startsWith(ALLOWED_PREFIX)) {
      return NextResponse.json({ error: "URL d'imatge no autoritzada" }, { status: 400 })
    }

    const res = await fetch(imageUrl, {
      headers: {
        Referer: REFERER,
        "User-Agent": "Mozilla/5.0 (compatible; ElVent/1.0)",
        Accept: "image/png,image/*,*/*",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `HTTP ${res.status} obtenint la imatge Aquarius` },
        { status: 502 },
      )
    }

    const contentType = res.headers.get("content-type") || "image/png"
    const body = await res.arrayBuffer()

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60",
      },
    })
  } catch (err) {
    console.error("Error /api/aquarius-image:", err)
    return NextResponse.json(
      { error: "Error obtenint la imatge Aquarius" },
      { status: 500 },
    )
  }
}
