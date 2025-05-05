import type { NextRequest } from "next/server"
import { testRedisConnection } from "@/lib/redis"

// Coordenadas precisas de los spots de kitesurf
const SPOT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  aquarius: { lat: 42.177, lon: 3.107 }, // Aquarius - coordenadas convertidas de 4210.62n, 306.420e
  "la-gaviota": { lat: 42.226, lon: 3.119 }, // La Gaviota - coordenadas convertidas de 4213.579n, 307.146e
}

export async function GET(request: NextRequest) {
  // Obtener el parámetro spot de la URL
  const searchParams = request.nextUrl.searchParams
  const spot = searchParams.get("spot")
  const timestamp = searchParams.get("_t") || Date.now().toString()

  // Validar el spot
  if (!spot || !SPOT_COORDINATES[spot]) {
    return new Response(JSON.stringify({ error: "Spot no válido" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  try {
    // Probar la conexión a Redis
    const redisConnected = await testRedisConnection()

    // Verificar si debemos omitir la caché - SIEMPRE omitir caché
    const noCache = true // Forzar siempre a no usar caché

    // Generar datos de fallback con variación aleatoria
    console.log("Generando datos aleatorios para", spot)
    const fallbackData = getFallbackData(spot, timestamp)

    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Data-Source": "fallback",
        "X-Timestamp": timestamp,
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error procesando solicitud:", error)

    // En caso de error general, usar datos de fallback
    const fallbackData = getFallbackData(spot, timestamp)

    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Data-Source": "fallback",
        "X-Timestamp": timestamp,
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }
}

// Función de fallback con datos simulados (mantener como respaldo)
function getFallbackData(spot: string, timestamp: string) {
  // Usar el timestamp como semilla para la generación de datos aleatorios
  const seed = Number.parseInt(timestamp) % 1000

  // Datos base - Valores simulados con viento real y variación aleatoria
  const baseData = [
    {
      date: new Date().toISOString().split("T")[0],
      hours: [
        {
          time: "09:00",
          windSpeed: 7 + (seed % 3),
          windDirection: 90,
          windGust: 12 + (seed % 5),
          temperature: 14.3,
          humidity: 89,
        },
        {
          time: "10:00",
          windSpeed: 9 + (seed % 4),
          windDirection: 90,
          windGust: 15 + (seed % 5),
          temperature: 15.4,
          humidity: 82,
        },
        {
          time: "11:00",
          windSpeed: 11 + (seed % 3),
          windDirection: 90,
          windGust: 18 + (seed % 4),
          temperature: 17.5,
          humidity: 74,
        },
        {
          time: "12:00",
          windSpeed: 13 + (seed % 3),
          windDirection: 90,
          windGust: 20 + (seed % 4),
          temperature: 18.5,
          humidity: 70,
        },
        {
          time: "13:00",
          windSpeed: 14 + (seed % 4),
          windDirection: 90,
          windGust: 22 + (seed % 5),
          temperature: 19.4,
          humidity: 66,
        },
        {
          time: "14:00",
          windSpeed: 14 + (seed % 5),
          windDirection: 90,
          windGust: 24 + (seed % 4),
          temperature: 20.1,
          humidity: 60,
        },
        {
          time: "15:00",
          windSpeed: 14 + (seed % 3),
          windDirection: 90,
          windGust: 23 + (seed % 5),
          temperature: 19.9,
          humidity: 63,
        },
        {
          time: "16:00",
          windSpeed: 13 + (seed % 4),
          windDirection: 90,
          windGust: 21 + (seed % 4),
          temperature: 19.3,
          humidity: 67,
        },
        {
          time: "17:00",
          windSpeed: 11 + (seed % 3),
          windDirection: 90,
          windGust: 18 + (seed % 5),
          temperature: 18.9,
          humidity: 70,
        },
        {
          time: "18:00",
          windSpeed: 9 + (seed % 3),
          windDirection: 90,
          windGust: 15 + (seed % 4),
          temperature: 18.5,
          humidity: 73,
        },
        {
          time: "19:00",
          windSpeed: 7 + (seed % 3),
          windDirection: 90,
          windGust: 12 + (seed % 4),
          temperature: 18.0,
          humidity: 76,
        },
        {
          time: "20:00",
          windSpeed: 6 + (seed % 2),
          windDirection: 90,
          windGust: 9 + (seed % 3),
          temperature: 17.2,
          humidity: 79,
        },
        {
          time: "21:00",
          windSpeed: 4 + (seed % 2),
          windDirection: 90,
          windGust: 6 + (seed % 3),
          temperature: 15.8,
          humidity: 90,
        },
      ],
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      hours: [
        {
          time: "09:00",
          windSpeed: 6 + (seed % 3),
          windDirection: 315,
          windGust: 9 + (seed % 4),
          temperature: 15.0,
          humidity: 85,
        },
        {
          time: "10:00",
          windSpeed: 8 + (seed % 3),
          windDirection: 315,
          windGust: 12 + (seed % 5),
          temperature: 16.2,
          humidity: 80,
        },
        {
          time: "11:00",
          windSpeed: 10 + (seed % 4),
          windDirection: 45,
          windGust: 15 + (seed % 5),
          temperature: 17.8,
          humidity: 75,
        },
        {
          time: "12:00",
          windSpeed: 12 + (seed % 4),
          windDirection: 90,
          windGust: 18 + (seed % 5),
          temperature: 19.0,
          humidity: 68,
        },
        {
          time: "13:00",
          windSpeed: 14 + (seed % 3),
          windDirection: 90,
          windGust: 21 + (seed % 4),
          temperature: 20.2,
          humidity: 62,
        },
        {
          time: "14:00",
          windSpeed: 16 + (seed % 3),
          windDirection: 90,
          windGust: 24 + (seed % 5),
          temperature: 21.0,
          humidity: 58,
        },
        {
          time: "15:00",
          windSpeed: 18 + (seed % 2),
          windDirection: 90,
          windGust: 27 + (seed % 4),
          temperature: 20.8,
          humidity: 60,
        },
        {
          time: "16:00",
          windSpeed: 18 + (seed % 2),
          windDirection: 90,
          windGust: 27 + (seed % 3),
          temperature: 20.0,
          humidity: 65,
        },
        {
          time: "17:00",
          windSpeed: 16 + (seed % 3),
          windDirection: 90,
          windGust: 24 + (seed % 4),
          temperature: 19.5,
          humidity: 68,
        },
        {
          time: "18:00",
          windSpeed: 14 + (seed % 3),
          windDirection: 90,
          windGust: 21 + (seed % 4),
          temperature: 19.0,
          humidity: 72,
        },
        {
          time: "19:00",
          windSpeed: 12 + (seed % 3),
          windDirection: 135,
          windGust: 18 + (seed % 4),
          temperature: 18.5,
          humidity: 75,
        },
        {
          time: "20:00",
          windSpeed: 10 + (seed % 2),
          windDirection: 135,
          windGust: 15 + (seed % 3),
          temperature: 17.5,
          humidity: 80,
        },
        {
          time: "21:00",
          windSpeed: 8 + (seed % 2),
          windDirection: 135,
          windGust: 12 + (seed % 3),
          temperature: 16.0,
          humidity: 85,
        },
      ],
    },
    {
      date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
      hours: [
        {
          time: "09:00",
          windSpeed: 5 + (seed % 3),
          windDirection: 315,
          windGust: 8 + (seed % 4),
          temperature: 14.5,
          humidity: 88,
        },
        {
          time: "10:00",
          windSpeed: 7 + (seed % 3),
          windDirection: 315,
          windGust: 11 + (seed % 4),
          temperature: 15.8,
          humidity: 82,
        },
        {
          time: "11:00",
          windSpeed: 9 + (seed % 4),
          windDirection: 45,
          windGust: 14 + (seed % 5),
          temperature: 17.0,
          humidity: 78,
        },
        {
          time: "12:00",
          windSpeed: 11 + (seed % 4),
          windDirection: 90,
          windGust: 17 + (seed % 5),
          temperature: 18.2,
          humidity: 72,
        },
        {
          time: "13:00",
          windSpeed: 13 + (seed % 3),
          windDirection: 90,
          windGust: 20 + (seed % 4),
          temperature: 19.5,
          humidity: 65,
        },
        {
          time: "14:00",
          windSpeed: 15 + (seed % 3),
          windDirection: 90,
          windGust: 23 + (seed % 4),
          temperature: 20.5,
          humidity: 60,
        },
        {
          time: "15:00",
          windSpeed: 17 + (seed % 2),
          windDirection: 90,
          windGust: 26 + (seed % 3),
          temperature: 20.2,
          humidity: 62,
        },
        {
          time: "16:00",
          windSpeed: 17 + (seed % 2),
          windDirection: 90,
          windGust: 26 + (seed % 3),
          temperature: 19.8,
          humidity: 65,
        },
        {
          time: "17:00",
          windSpeed: 15 + (seed % 3),
          windDirection: 90,
          windGust: 23 + (seed % 4),
          temperature: 19.0,
          humidity: 70,
        },
        {
          time: "18:00",
          windSpeed: 13 + (seed % 3),
          windDirection: 90,
          windGust: 20 + (seed % 4),
          temperature: 18.5,
          humidity: 75,
        },
        {
          time: "19:00",
          windSpeed: 11 + (seed % 3),
          windDirection: 135,
          windGust: 17 + (seed % 4),
          temperature: 17.8,
          humidity: 80,
        },
        {
          time: "20:00",
          windSpeed: 9 + (seed % 2),
          windDirection: 135,
          windGust: 14 + (seed % 3),
          temperature: 16.5,
          humidity: 85,
        },
        {
          time: "21:00",
          windSpeed: 7 + (seed % 2),
          windDirection: 135,
          windGust: 11 + (seed % 3),
          temperature: 15.0,
          humidity: 90,
        },
      ],
    },
  ]

  // Ajustar datos según el spot seleccionado
  let adjustedData = JSON.parse(JSON.stringify(baseData))

  if (spot === "la-gaviota") {
    // La Gaviota tiene vientos ligeramente más fuertes y más constantes
    adjustedData = adjustedData.map((day: any) => {
      day.hours = day.hours.map((hour: any) => {
        return {
          ...hour,
          windSpeed: hour.windSpeed === 0 ? 0 : Math.max(1, Math.round(hour.windSpeed * 1.15)),
          windGust: hour.windGust === 0 ? 0 : Math.round(hour.windGust * 1.1),
          windDirection: hour.windSpeed === 0 ? 0 : (hour.windDirection + 15) % 360,
        }
      })
      return day
    })
  } else if (spot === "aquarius") {
    // Aquarius tiene vientos ligeramente más débiles pero más constantes
    adjustedData = adjustedData.map((day: any) => {
      day.hours = day.hours.map((hour: any) => {
        return {
          ...hour,
          windSpeed: hour.windSpeed === 0 ? 0 : Math.max(1, Math.round(hour.windSpeed * 0.9)),
          windGust: hour.windGust === 0 ? 0 : Math.round(hour.windGust * 0.85),
          windDirection: hour.windSpeed === 0 ? 0 : (hour.windDirection - 10 + 360) % 360,
        }
      })
      return day
    })
  }

  return adjustedData
}
