import { NextResponse } from "next/server"
import { fetchForecastDataDirect } from "@/lib/api"

const VALID_SPOTS = new Set([
  "kitesurf-point",
  "la-ballena",
  "can-martinet",
  "la-rubina",
])

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedSpot = searchParams.get("spot") ?? "kitesurf-point"
  const spot = VALID_SPOTS.has(requestedSpot) ? requestedSpot : "kitesurf-point"

  try {
    const data = await fetchForecastDataDirect(spot)

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("API /api/forecast error:", error)

    return NextResponse.json(
      { error: "No es poden obtenir dades meteorològiques" },
      { status: 500 },
    )
  }
}
