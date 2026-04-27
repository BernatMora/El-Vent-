import { NextResponse } from "next/server"
import { getMeteocatCurrentConditions, getMeteocatTodayHistory } from "@/lib/meteocat-api"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeHistory = searchParams.get("history") === "true"

  try {
    console.log("🌡️ API /api/current - Obtenint dades reals de Meteocat...")
    
    // Obtenir condicions actuals
    const currentConditions = await getMeteocatCurrentConditions()
    
    if (!currentConditions) {
      return NextResponse.json(
        { error: "No s'han pogut obtenir les dades de Meteocat. Comproveu la clau API." },
        { status: 503 }
      )
    }

    // Opcionalment incloure històric del dia
    let todayHistory = null
    if (includeHistory) {
      todayHistory = await getMeteocatTodayHistory()
    }

    return NextResponse.json({
      current: currentConditions,
      history: todayHistory,
      source: "Meteocat XEMA",
      station: "Sant Pere Pescador (U2)"
    }, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300", // Cache 5 minuts
      },
    })
  } catch (error) {
    console.error("Error a l'API /api/current:", error)

    return NextResponse.json(
      { error: "No es poden obtenir dades meteorològiques reals" },
      { status: 500 }
    )
  }
}
