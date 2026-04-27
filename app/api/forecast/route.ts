import { NextResponse } from "next/server"
import { fetchForecastDataDirect } from "@/lib/api"
import { VALID_SPOTS } from "@/lib/spot-coordinates"
import { getCalibrationFactors, applyCalibration } from "@/lib/calibration-service"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedSpot = searchParams.get("spot")
  const skipCalibration = searchParams.get("raw") === "true"
  
  if (requestedSpot && !VALID_SPOTS.has(requestedSpot)) {
    return NextResponse.json(
      { error: "Spot no vàlid" },
      { status: 400 },
    )
  }
  const spot = requestedSpot ?? "kitesurf-point"

  try {
    const data = await fetchForecastDataDirect(spot)
    
    // Aplicar calibratge si hi ha factors disponibles
    let calibrationApplied = false
    if (!skipCalibration && data.forecast) {
      try {
        const factors = await getCalibrationFactors()
        
        if (Object.keys(factors).length > 0) {
          // Aplicar calibratge a cada hora de cada dia
          for (const day of data.forecast) {
            if (day.hours) {
              for (const hour of day.hours) {
                const calibrated = applyCalibration(
                  hour.windSpeed,
                  hour.windGust,
                  hour.windDirection,
                  factors
                )
                
                if (calibrated.calibrated) {
                  hour.windSpeedOriginal = hour.windSpeed
                  hour.windGustOriginal = hour.windGust
                  hour.windSpeed = calibrated.windSpeed
                  hour.windGust = calibrated.windGust
                  hour.calibrated = true
                  hour.calibrationConfidence = calibrated.confidence
                  calibrationApplied = true
                }
              }
            }
          }
        }
      } catch (calibrationError) {
        console.warn("No s'ha pogut aplicar calibratge:", calibrationError)
      }
    }

    return NextResponse.json({
      ...data,
      calibrationApplied
    }, {
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
