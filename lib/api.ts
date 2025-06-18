import { getOpenMeteoForecast } from "./open-meteo-api"
import { windCalibration } from "./calibration"

export async function getForecastData(spot: string) {
  try {
    console.log("getForecastData llamado para spot:", spot)

    // Intentar obtener datos reales de Open-Meteo
    let baseData
    try {
      baseData = await getOpenMeteoForecast()
      console.log("Datos reales obtenidos de Open-Meteo")
    } catch (error) {
      console.warn("Error obteniendo datos de Open-Meteo, usando simulados:", error)
      baseData = generateSimulatedData()
    }

    // Ajustar datos según el spot seleccionado (efectos locales)
    let adjustedData = JSON.parse(JSON.stringify(baseData))

    if (spot === "kitesurf-point") {
      // Kitesurf Point tiene vientos ligeramente más fuertes
      adjustedData = adjustedData.map((day: any) => {
        day.hours = day.hours.map((hour: any) => {
          return {
            ...hour,
            windSpeed: Math.max(1, Math.round(hour.windSpeed * 1.15)),
            windGust: Math.round(hour.windGust * 1.1),
            windDirection: (hour.windDirection + 15) % 360,
          }
        })
        return day
      })
    } else if (spot === "can-martinet") {
      // Can Martinet tiene vientos más constantes pero más débiles
      adjustedData = adjustedData.map((day: any) => {
        day.hours = day.hours.map((hour: any) => {
          return {
            ...hour,
            windSpeed: Math.max(1, Math.round(hour.windSpeed * 0.9)),
            windGust: Math.round(hour.windGust * 0.85),
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
          windSpeed: Math.max(1, Math.round(hour.windSpeed * 1.05)),
          windGust: Math.round(hour.windGust * 1.02),
        }
      })
    }

    // Aplicar calibración basada en observaciones de usuarios
    adjustedData = adjustedData.map((day: any) => {
      day.hours = day.hours.map((hour: any) => {
        const calibrated = windCalibration.applyCalibration(
          spot, 
          hour.windSpeed, 
          hour.windDirection
        )
        
        return {
          ...hour,
          windSpeed: calibrated.windSpeed,
          windDirection: calibrated.windDirection,
          // Mantener datos originales para comparación
          originalWindSpeed: hour.windSpeed,
          originalWindDirection: hour.windDirection,
          isCalibrated: true
        }
      })
      return day
    })

    console.log("Datos ajustados y calibrados:", adjustedData.length, "días")
    return adjustedData
  } catch (error) {
    console.error("Error in getForecastData:", error)
    return generateSimulatedData()
  }
}

// Generar datos simulados como fallback
function generateSimulatedData() {
  console.log("Generando datos simulados como fallback")
  const now = new Date()
  const days = []

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    const dateString = date.toISOString().split("T")[0]

    const hours = []

    // Patrón realista de brisa marina
    for (let hour = 9; hour <= 21; hour++) {
      let baseWindSpeed = 2

      // Ciclo diario típico de Sant Pere Pescador
      if (hour >= 11 && hour <= 17) {
        // Brisa marina fuerte durante el día
        baseWindSpeed = 6 + Math.sin(((hour - 11) / 6) * Math.PI) * 6
      } else if (hour >= 9 && hour < 11) {
        // Transición matutina
        baseWindSpeed = 2 + (hour - 9) * 2
      } else if (hour > 17 && hour <= 19) {
        // Brisa vespertina
        baseWindSpeed = 8 - (hour - 17) * 2
      } else {
        // Viento nocturno
        baseWindSpeed = 1 + Math.random() * 2
      }

      // Variación por día
      const dayTrend = dayOffset === 0 ? 1.0 : dayOffset === 1 ? 1.1 : 0.9
      baseWindSpeed *= dayTrend

      // Variación aleatoria
      baseWindSpeed += (Math.random() - 0.5) * 2

      // Dirección típica (Este predominante)
      let windDirection = 90

      if (hour < 12) {
        windDirection = 60 + Math.random() * 30 // NE-E
      } else if (hour >= 12 && hour <= 16) {
        windDirection = 80 + Math.random() * 20 // E
      } else {
        windDirection = 100 + Math.random() * 35 // E-SE
      }

      // Temperatura realista
      let temperature = 14 + (hour - 9) * 0.7
      if (hour > 15) {
        temperature = 19 - (hour - 15) * 0.3
      }
      temperature += dayOffset * 0.5
      temperature += (Math.random() - 0.5) * 1.5

      // Humedad
      const humidity = Math.max(50, Math.min(95, 85 - (temperature - 15) * 2 + Math.random() * 10))

      hours.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        windSpeed: Math.max(1, Math.round(baseWindSpeed)),
        windDirection: Math.round(windDirection) % 360,
        windGust: Math.round(baseWindSpeed * (1.3 + Math.random() * 0.4)),
        temperature: Math.round(temperature),
        humidity: Math.round(humidity),
        isCalibrated: false
      })
    }

    days.push({
      date: dateString,
      hours: hours,
    })
  }

  return days
}