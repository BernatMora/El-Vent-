import { NextResponse } from "next/server"
import { getAquariusReading } from "@/lib/aquarius-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const reading = await getAquariusReading()
    const payload = {
      source: "Camping Aquàrius (Davis WeatherLink)",
      timestamp: reading.timestamp ? new Date(reading.timestamp * 1000).toISOString() : null,
      cachedAt: new Date().toISOString(),
      windDirection: reading.windDirection,
      windSpeedKmh: reading.windSpeedKmh,
      windGustKmh: reading.windGustKmh,
      windSpeed: reading.windSpeed,
      windGust: reading.windGust,
      assumedMaxKmh: reading.maxKmhUsed,
      isApproximate: reading.isApproximate,
      note: reading.note,
      images: reading.images,
    }
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
