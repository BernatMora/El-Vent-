import type { NextRequest } from "next/server"

// Almacenamiento temporal de reportes (en una implementación real usarías Redis o una base de datos)
const userReports: Record<string, any[]> = {
  "la-ballena": [],
  "kitesurf-point": [],
  "can-martinet": [],
}

export async function GET(request: NextRequest) {
  // Obtener el parámetro spot de la URL
  const searchParams = request.nextUrl.searchParams
  const spot = searchParams.get("spot")

  // Validar el spot
  if (!spot || !userReports[spot]) {
    return new Response(JSON.stringify({ error: "Spot no válido" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  // Devolver reportes para el spot solicitado
  return new Response(JSON.stringify(userReports[spot]), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Obtener el parámetro spot de la URL
    const searchParams = request.nextUrl.searchParams
    const spot = searchParams.get("spot")

    // Validar el spot
    if (!spot || !userReports[spot]) {
      return new Response(JSON.stringify({ error: "Spot no válido" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { windSpeed, windDirection, comment, user } = body

    if (!windSpeed || !windDirection) {
      return new Response(JSON.stringify({ error: "Datos de viento requeridos" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    // Crear nuevo reporte
    const newReport = {
      id: Date.now(),
      user: user || "Anónimo",
      time: new Date().toISOString(),
      windSpeed: Number(windSpeed),
      windDirection,
      comment: comment || "",
      spot,
    }

    // Añadir nuevo reporte al principio
    userReports[spot].unshift(newReport)

    // Limitar a los 20 reportes más recientes
    userReports[spot] = userReports[spot].slice(0, 20)

    return new Response(JSON.stringify(newReport), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error procesando solicitud:", error)
    return new Response(
      JSON.stringify({
        error: "Error al procesar el reporte",
        message: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
