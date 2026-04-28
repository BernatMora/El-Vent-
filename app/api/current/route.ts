import { NextResponse } from "next/server"
import { getMultiModelForecast } from "@/lib/open-meteo-api"
import { getMeteocatCurrentConditions } from "@/lib/meteocat-api"
import { getCalibrationFactors, applyCalibration } from "@/lib/calibration-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  // 1) Intentar Meteocat (dades REALS de l'estació de Sant Pere Pescador)
  if (process.env.METEOCAT_API_KEY) {
    try {
      const meteocat = await getMeteocatCurrentConditions()
      if (meteocat) {
        return NextResponse.json({
          current: {
            windSpeed: meteocat.windSpeed,
            windDirection: meteocat.windDirection,
            windGust: meteocat.windGust,
            temperature: meteocat.temperature,
            humidity: meteocat.humidity,
            lastUpdate: meteocat.lastUpdate,
            stationName: meteocat.stationName,
            stationCode: meteocat.stationCode,
            isFallback: meteocat.isFallback,
            isReal: true,
            source: meteocat.source,
          },
          source: meteocat.source,
          station: meteocat.stationName,
          stationCode: meteocat.stationCode,
          isFallback: meteocat.isFallback,
          modelsUsed: 1,
          confidence: 1,
        }, {
          status: 200,
          headers: { "Cache-Control": "public, max-age=300" },
        })
      }
      console.warn("Meteocat no ha retornat dades — fallback a Open-Meteo")
    } catch (err) {
      console.error("Error Meteocat, fallback a Open-Meteo:", err)
    }
  } else {
    console.warn("METEOCAT_API_KEY no configurada — usant Open-Meteo")
  }

  // 2) Fallback: Open-Meteo multi-model
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
    const isOffHours = currentHour < 9 || currentHour > 21
    
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

    // Aplicar calibratge per direcció a la previsió actual (només si Open-Meteo)
    try {
      const factors = await getCalibrationFactors()
      if (Object.keys(factors).length > 0) {
        const calibrated = applyCalibration(
          currentConditions.windSpeed,
          currentConditions.windGust,
          currentConditions.windDirection,
          factors,
        )
        if (calibrated.calibrated) {
          currentConditions = {
            ...currentConditions,
            originalWindSpeed: currentConditions.windSpeed,
            windSpeed: calibrated.windSpeed,
            windGust: calibrated.windGust,
            isCalibrated: true,
            confidence: calibrated.confidence,
          }
        }
      }
    } catch (calErr) {
      console.warn("No s'ha pogut aplicar calibratge a /api/current:", calErr)
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
        source: currentConditions.source || "Multi-model (AROME, ICON, GFS)",
        isCalibrated: currentConditions.isCalibrated ?? false,
        isOffHours,
        forecastReferenceTime: currentConditions.time,
      },
      source: "Open-Meteo Multi-model",
      station: "Sant Pere Pescador",
      modelsUsed: currentConditions.modelsUsed || 5,
      confidence: currentConditions.confidence || 0.8,
      isOffHours,
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
