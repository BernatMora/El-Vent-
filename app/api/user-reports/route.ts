import type { NextRequest } from "next/server"
import redis, { testRedisConnection } from "@/lib/redis"

// Almacenamiento en memoria para fallback
const memoryReports: Record<string, any[]> = {
  aquarius: [],
  "la-gaviota": [],
}

export async function GET(request: NextRequest) {
  // Obtener el parámetro spot de la URL
  const searchParams = request.nextUrl.searchParams
  const spot = searchParams.get("spot")

  // Validar el spot
  if (!spot || !["aquarius", "la-gaviota"].includes(spot)) {
    return new Response(JSON.stringify({ error: "Spot no válido" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  try {
    // Verificar si Redis está disponible
    const redisConnected = await testRedisConnection()

    if (redisConnected) {
      // Clave para almacenar reportes de usuarios
      const reportsKey = `user_reports_${spot}`

      // Obtener reportes existentes
      try {
        const reports = await redis.get(reportsKey)
        return new Response(JSON.stringify(reports || []), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      } catch (cacheError) {
        console.error("Error al obtener reportes de Redis:", cacheError)
      }
    }

    // Si Redis no está disponible o hay un error, usar memoria
    console.log("Usando reportes en memoria para", spot)
    return new Response(JSON.stringify(memoryReports[spot] || []), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error obteniendo reportes:", error)
    // En caso de error, devolver un array vacío
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener el parámetro spot de la URL
    const searchParams = request.nextUrl.searchParams
    const spot = searchParams.get("spot")

    // Validar el spot
    if (!spot || !["aquarius", "la-gaviota"].includes(spot)) {
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

    // Verificar si Redis está disponible
    const redisConnected = await testRedisConnection()

    if (redisConnected) {
      try {
        // Clave para almacenar reportes de usuarios
        const reportsKey = `user_reports_${spot}`

        // Obtener reportes existentes
        const existingReports = await redis.get(reportsKey)

        // Asegurarse de que existingReports sea un array
        const reports = Array.isArray(existingReports) ? existingReports : []

        // Añadir nuevo reporte al principio
        reports.unshift(newReport)

        // Limitar a los 20 reportes más recientes
        const limitedReports = reports.slice(0, 20)

        // Guardar reportes actualizados
        await redis.set(reportsKey, limitedReports)
        console.log("Reporte guardado en Redis para", spot)
      } catch (cacheError) {
        console.error("Error al guardar reporte en Redis:", cacheError)
      }
    }

    // También guardar en memoria como fallback
    if (!memoryReports[spot]) {
      memoryReports[spot] = []
    }
    memoryReports[spot].unshift(newReport)
    memoryReports[spot] = memoryReports[spot].slice(0, 20)
    console.log("Reporte guardado en memoria para", spot)

    return new Response(JSON.stringify(newReport), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error guardando reporte:", error)
    return new Response(
      JSON.stringify({
        error: "Error guardando reporte de usuario",
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
