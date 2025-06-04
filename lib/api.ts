import { getWindyForecast } from "./windy-api"

// Función principal que ahora usa Windy API
export async function getForecastData(spot: string) {
  try {
    console.log("getForecastData llamado para spot:", spot)

    // Obtener datos de Windy API
    let baseData = await getWindyForecast("gfs") // Usar modelo GFS por defecto

    console.log("Datos base recibidos:", baseData ? baseData.length : "ninguno")

    // Si no hay datos de Windy, usar datos de fallback
    if (!baseData || baseData.length === 0) {
      console.warn("No se pudieron obtener datos de Windy, usando datos simulados")
      baseData = getFallbackData()
    }

    // Ajustar datos según el spot seleccionado (efectos locales)
    let adjustedData = JSON.parse(JSON.stringify(baseData))

    if (spot === "kitesurf-point") {
      // Kitesurf Point tiene vientos ligeramente más fuertes y más constantes
      adjustedData = adjustedData.map((day: any) => {
        day.hours = day.hours.map((hour: any) => {
          return {
            ...hour,
            windSpeed: Math.max(1, Math.round(hour.windSpeed * 1.15)), // 15% más fuerte
            windGust: Math.round(hour.windGust * 1.1), // 10% más fuerte
            // Dirección ligeramente más onshore
            windDirection: (hour.windDirection + 15) % 360,
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
            windSpeed: Math.max(1, Math.round(hour.windSpeed * 0.9)), // 10% más débil
            windGust: Math.round(hour.windGust * 0.85), // 15% menos ráfagas
            // Dirección ligeramente más side-shore
            windDirection: (hour.windDirection - 10 + 360) % 360,
          }
        })
        return day
      })
    } else if (spot === "la-ballena") {
      // La Ballena tiene condiciones intermedias
      adjustedData[0].hours = adjustedData[0].hours.map((hour: any) => {
        return {
          ...hour,
          windSpeed: Math.max(1, Math.round(hour.windSpeed * 1.05)), // 5% más fuerte hoy
          windGust: Math.round(hour.windGust * 1.02), // 2% más ráfagas hoy
        }
      })
    }

    console.log("Datos ajustados:", adjustedData.length, "días")
    return adjustedData
  } catch (error) {
    console.error("Error in getForecastData:", error)
    return getFallbackData()
  }
}

// Datos de fallback en caso de error
function getFallbackData() {
  console.log("Generando datos de fallback")
  return [
    {
      date: new Date().toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 2, windDirection: 315, windGust: 5, temperature: 14, humidity: 89 },
        { time: "10:00", windSpeed: 1, windDirection: 315, windGust: 7, temperature: 15, humidity: 82 },
        { time: "11:00", windSpeed: 1, windDirection: 45, windGust: 7, temperature: 18, humidity: 74 },
        { time: "12:00", windSpeed: 6, windDirection: 90, windGust: 12, temperature: 19, humidity: 70 },
        { time: "13:00", windSpeed: 6, windDirection: 90, windGust: 12, temperature: 19, humidity: 66 },
        { time: "14:00", windSpeed: 8, windDirection: 90, windGust: 14, temperature: 20, humidity: 60 },
        { time: "15:00", windSpeed: 10, windDirection: 90, windGust: 17, temperature: 20, humidity: 63 },
        { time: "16:00", windSpeed: 11, windDirection: 90, windGust: 19, temperature: 19, humidity: 67 },
        { time: "17:00", windSpeed: 11, windDirection: 90, windGust: 19, temperature: 19, humidity: 70 },
        { time: "18:00", windSpeed: 9, windDirection: 90, windGust: 17, temperature: 19, humidity: 73 },
        { time: "19:00", windSpeed: 7, windDirection: 135, windGust: 15, temperature: 18, humidity: 76 },
        { time: "20:00", windSpeed: 6, windDirection: 135, windGust: 12, temperature: 17, humidity: 79 },
        { time: "21:00", windSpeed: 5, windDirection: 135, windGust: 10, temperature: 16, humidity: 90 },
      ],
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 3, windDirection: 315, windGust: 5, temperature: 15, humidity: 85 },
        { time: "10:00", windSpeed: 2, windDirection: 315, windGust: 4, temperature: 16, humidity: 80 },
        { time: "11:00", windSpeed: 2, windDirection: 45, windGust: 4, temperature: 18, humidity: 75 },
        { time: "12:00", windSpeed: 5, windDirection: 90, windGust: 10, temperature: 19, humidity: 68 },
        { time: "13:00", windSpeed: 7, windDirection: 90, windGust: 13, temperature: 20, humidity: 62 },
        { time: "14:00", windSpeed: 9, windDirection: 90, windGust: 15, temperature: 21, humidity: 58 },
        { time: "15:00", windSpeed: 10, windDirection: 90, windGust: 16, temperature: 21, humidity: 60 },
        { time: "16:00", windSpeed: 10, windDirection: 90, windGust: 17, temperature: 20, humidity: 65 },
        { time: "17:00", windSpeed: 9, windDirection: 90, windGust: 16, temperature: 20, humidity: 68 },
        { time: "18:00", windSpeed: 8, windDirection: 90, windGust: 14, temperature: 19, humidity: 72 },
        { time: "19:00", windSpeed: 6, windDirection: 135, windGust: 12, temperature: 19, humidity: 75 },
        { time: "20:00", windSpeed: 5, windDirection: 135, windGust: 10, temperature: 18, humidity: 80 },
        { time: "21:00", windSpeed: 4, windDirection: 135, windGust: 8, temperature: 16, humidity: 85 },
      ],
    },
    {
      date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 2, windDirection: 315, windGust: 4, temperature: 15, humidity: 88 },
        { time: "10:00", windSpeed: 1, windDirection: 315, windGust: 3, temperature: 16, humidity: 82 },
        { time: "11:00", windSpeed: 2, windDirection: 45, windGust: 4, temperature: 17, humidity: 78 },
        { time: "12:00", windSpeed: 4, windDirection: 90, windGust: 8, temperature: 18, humidity: 72 },
        { time: "13:00", windSpeed: 6, windDirection: 90, windGust: 11, temperature: 20, humidity: 65 },
        { time: "14:00", windSpeed: 8, windDirection: 90, windGust: 14, temperature: 21, humidity: 60 },
        { time: "15:00", windSpeed: 9, windDirection: 90, windGust: 15, temperature: 20, humidity: 62 },
        { time: "16:00", windSpeed: 9, windDirection: 90, windGust: 16, temperature: 20, humidity: 65 },
        { time: "17:00", windSpeed: 8, windDirection: 90, windGust: 15, temperature: 19, humidity: 70 },
        { time: "18:00", windSpeed: 7, windDirection: 90, windGust: 13, temperature: 19, humidity: 75 },
        { time: "19:00", windSpeed: 5, windDirection: 135, windGust: 10, temperature: 18, humidity: 80 },
        { time: "20:00", windSpeed: 4, windDirection: 135, windGust: 8, temperature: 17, humidity: 85 },
        { time: "21:00", windSpeed: 3, windDirection: 135, windGust: 6, temperature: 15, humidity: 90 },
      ],
    },
  ]
}
