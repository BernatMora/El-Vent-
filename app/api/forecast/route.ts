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
  const requestedSpot = searchParams.get("spot")
  if (requestedSpot && !VALID_SPOTS.has(requestedSpot)) {
    return NextResponse.json(
      { error: "Spot no vàlid" },
      { status: 400 },
    )
  }
  const spot = requestedSpot ?? "kitesurf-point"

  try {
    const data = await fetchForecastDataDirect(spot)

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error a l'API /api/forecast:", error)

    return NextResponse.json(
      { error: "No es poden obtenir dades meteorològiques" },
      { status: 500 },
    )
  }
}
