import { NextRequest, NextResponse } from "next/server"
import { 
  saveCalibrationEntry, 
  getCalibrationFactors, 
  getCalibrationHistory 
} from "@/lib/calibration-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Obtenir factors de calibratge i historial
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "factors"
    
    if (type === "history") {
      const history = await getCalibrationHistory(30)
      return NextResponse.json({ history })
    }
    
    const factors = await getCalibrationFactors()
    return NextResponse.json({ factors })
  } catch (error) {
    console.error("Error obtenint calibratge:", error)
    return NextResponse.json(
      { error: "Error obtenint dades de calibratge" },
      { status: 500 }
    )
  }
}

// POST - Afegir nova entrada de calibratge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dades
    const required = [
      "forecastWindSpeed", 
      "forecastWindGust", 
      "forecastDirection",
      "realWindSpeed",
      "realWindGust",
      "realDirection",
      "forecastTimestamp"
    ]
    
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Camp requerit: ${field}` },
          { status: 400 }
        )
      }
    }
    
    await saveCalibrationEntry({
      forecastWindSpeed: Number(body.forecastWindSpeed),
      forecastWindGust: Number(body.forecastWindGust),
      forecastDirection: Number(body.forecastDirection),
      realWindSpeed: Number(body.realWindSpeed),
      realWindGust: Number(body.realWindGust),
      realDirection: Number(body.realDirection),
      forecastTimestamp: body.forecastTimestamp,
      notes: body.notes
    })
    
    // Retornar els nous factors actualitzats
    const factors = await getCalibrationFactors()
    
    return NextResponse.json({ 
      success: true, 
      message: "Dades guardades i factors recalculats",
      factors 
    })
  } catch (error) {
    console.error("Error guardant calibratge:", error)
    return NextResponse.json(
      { error: "Error guardant dades de calibratge" },
      { status: 500 }
    )
  }
}
