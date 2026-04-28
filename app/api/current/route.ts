import { NextResponse } from "next/server"
import { getMultiModelForecast } from "@/lib/open-meteo-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Obtenir dades multi-model d'Open-Meteo
    const forecast = await getMultiModelForecast("sant-pere-pescador")
    
    if (!forecast || forecast.length === 0) {
      return NextResponse.json(
        { error: "No s'han pogut obtenir les dades meteorologiques" },
        { status: 503 }
      )
    }

    // Agafar l'hora actual o la més propera del dia d'avui
    const today = forecast[0]
    const now = new Date()
    const currentHour = now.getHours()
    
    // Trobar l'hora més propera (les dades van de 9:00 a 21:00)
    let currentConditions = today.hours[0]
    let closestDiff = 24
    
    for (const hour of today.hours) {
      const hourNum = parseInt(hour.time.split(":")[0])
      const diff = Math.abs(hourNum - currentHour)
      if (diff < closestDiff) {
        closestDiff = diff
        currentConditions = hour
      }
    }

    return NextResponse.json({
      current: {
        windSpeed: currentConditions.windSpeed,
        windDirection: currentConditions.windDirection,
        windGust: currentConditions.windGust,
        temperature: currentConditions.temperature,
        humidity: currentConditions.humidity || 70,
        lastUpdate: new Date().toISOString(),
        stationName: "Sant Pere Pescador",
        isReal: false, // No son dades d'estació real, són previsió multi-model
        source: currentConditions.source || "Multi-model (AROME, ICON, GFS)"
      },
      source: "Open-Meteo Multi-model",
      station: "Sant Pere Pescador",
      modelsUsed: currentConditions.modelsUsed || 5,
      confidence: currentConditions.confidence || 0.8
    }, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300", // Cache 5 minuts
      },
    })
  } catch (error) {
    console.error("Error a l'API /api/current:", error)

    return NextResponse.json(
      { error: "No es poden obtenir dades meteorologiques" },
      { status: 500 }
    )
  }
}
