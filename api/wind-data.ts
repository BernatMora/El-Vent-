import type { NextRequest } from "next/server"

// Coordenadas precisas de los spots de kitesurf
const SPOT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "la-ballena": { lat: 42.1777, lon: 3.1257 }, // Sant Pere Pescador
  "kitesurf-point": { lat: 42.183, lon: 3.124 },
  "can-martinet": { lat: 42.172, lon: 3.127 },
}

export async function GET(request: NextRequest) {
  // Obtener el parámetro spot de la URL
  const searchParams = request.nextUrl.searchParams
  const spot = searchParams.get("spot")

  // Validar el spot
  if (!spot || !SPOT_COORDINATES[spot]) {
    return new Response(JSON.stringify({ error: "Spot no válido" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  try {
    // Simulamos la obtención de datos reales
    // En una implementación completa, aquí llamarías a OpenWeatherMap

    // Por ahora, devolvemos datos simulados
    const data = getFallbackData(spot)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error procesando solicitud:", error)
    return new Response(
      JSON.stringify({
        error: "Error al obtener datos de viento",
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

// Función de fallback con datos simulados
function getFallbackData(spot: string) {
  // Datos base - Valores simulados
  const baseData = [
    {
      date: new Date().toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 14.3, humidity: 89 },
        { time: "10:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 15.4, humidity: 82 },
        { time: "11:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 17.5, humidity: 74 },
        { time: "12:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 18.5, humidity: 70 },
        { time: "13:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 19.4, humidity: 66 },
        { time: "14:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 20.1, humidity: 60 },
        { time: "15:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 19.9, humidity: 63 },
        { time: "16:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 19.3, humidity: 67 },
        { time: "17:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 18.9, humidity: 70 },
        { time: "18:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 18.5, humidity: 73 },
        { time: "19:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 18.0, humidity: 76 },
        { time: "20:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 17.2, humidity: 79 },
        { time: "21:00", windSpeed: 0, windDirection: 0, windGust: 0, temperature: 15.8, humidity: 90 },
      ],
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 3, windDirection: 315, windGust: 5, temperature: 15.0, humidity: 85 },
        { time: "10:00", windSpeed: 2, windDirection: 315, windGust: 4, temperature: 16.2, humidity: 80 },
        { time: "11:00", windSpeed: 2, windDirection: 45, windGust: 4, temperature: 17.8, humidity: 75 },
        { time: "12:00", windSpeed: 5, windDirection: 90, windGust: 10, temperature: 19.0, humidity: 68 },
        { time: "13:00", windSpeed: 7, windDirection: 90, windGust: 13, temperature: 20.2, humidity: 62 },
        { time: "14:00", windSpeed: 9, windDirection: 90, windGust: 15, temperature: 21.0, humidity: 58 },
        { time: "15:00", windSpeed: 10, windDirection: 90, windGust: 16, temperature: 20.8, humidity: 60 },
        { time: "16:00", windSpeed: 10, windDirection: 90, windGust: 17, temperature: 20.0, humidity: 65 },
        { time: "17:00", windSpeed: 9, windDirection: 90, windGust: 16, temperature: 19.5, humidity: 68 },
        { time: "18:00", windSpeed: 8, windDirection: 90, windGust: 14, temperature: 19.0, humidity: 72 },
        { time: "19:00", windSpeed: 6, windDirection: 135, windGust: 12, temperature: 18.5, humidity: 75 },
        { time: "20:00", windSpeed: 5, windDirection: 135, windGust: 10, temperature: 17.5, humidity: 80 },
        { time: "21:00", windSpeed: 4, windDirection: 135, windGust: 8, temperature: 16.0, humidity: 85 },
      ],
    },
    {
      date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 2, windDirection: 315, windGust: 4, temperature: 14.5, humidity: 88 },
        { time: "10:00", windSpeed: 1, windDirection: 315, windGust: 3, temperature: 15.8, humidity: 82 },
        { time: "11:00", windSpeed: 2, windDirection: 45, windGust: 4, temperature: 17.0, humidity: 78 },
        { time: "12:00", windSpeed: 4, windDirection: 90, windGust: 8, temperature: 18.2, humidity: 72 },
        { time: "13:00", windSpeed: 6, windDirection: 90, windGust: 11, temperature: 19.5, humidity: 65 },
        { time: "14:00", windSpeed: 8, windDirection: 90, windGust: 14, temperature: 20.5, humidity: 60 },
        { time: "15:00", windSpeed: 9, windDirection: 90, windGust: 15, temperature: 20.2, humidity: 62 },
        { time: "16:00", windSpeed: 9, windDirection: 90, windGust: 16, temperature: 19.8, humidity: 65 },
        { time: "17:00", windSpeed: 8, windDirection: 90, windGust: 15, temperature: 19.0, humidity: 70 },
        { time: "18:00", windSpeed: 7, windDirection: 90, windGust: 13, temperature: 18.5, humidity: 75 },
        { time: "19:00", windSpeed: 5, windDirection: 135, windGust: 10, temperature: 17.8, humidity: 80 },
        { time: "20:00", windSpeed: 4, windDirection: 135, windGust: 8, temperature: 16.5, humidity: 85 },
        { time: "21:00", windSpeed: 3, windDirection: 135, windGust: 6, temperature: 15.0, humidity: 90 },
      ],
    },
  ]

  // Ajustar datos según el spot seleccionado
  let adjustedData = JSON.parse(JSON.stringify(baseData))

  if (spot === "kitesurf-point") {
    // Kitesurf Point tiene vientos ligeramente más fuertes y más constantes
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
  } else if (spot === "can-martinet") {
    // Can Martinet tiene vientos ligeramente más débiles pero más constantes
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
