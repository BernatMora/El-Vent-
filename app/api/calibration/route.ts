import { NextRequest, NextResponse } from "next/server"
import {
  getCalibrationFactors,
  getCalibrationHistory,
  getCalibrationStatus,
  runAutoCalibrationIfDue,
} from "@/lib/calibration-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET ?type=factors|history|status
// Per defecte retorna l'estat complet (factors + metadades).
export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") || "status"

    if (type === "history") {
      const history = await getCalibrationHistory(50)
      return NextResponse.json({ history })
    }

    if (type === "factors") {
      const factors = await getCalibrationFactors()
      return NextResponse.json({ factors })
    }

    const status = await getCalibrationStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error obtenint calibratge:", error)
    return NextResponse.json(
      { error: "Error obtenint dades de calibratge" },
      { status: 500 },
    )
  }
}

// POST força una nova passada de calibratge (?force=1 salta el rate-limit de 30 min)
export async function POST(request: NextRequest) {
  try {
    const force = request.nextUrl.searchParams.get("force") === "1"
    const result = await runAutoCalibrationIfDue(force)
    const status = await getCalibrationStatus()
    return NextResponse.json({ ...result, status })
  } catch (error) {
    console.error("Error executant calibratge:", error)
    return NextResponse.json(
      { error: "Error executant calibratge" },
      { status: 500 },
    )
  }
}
