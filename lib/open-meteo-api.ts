// API gratuita Open-Meteo para datos meteorológicos reales
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1"

// Coordenadas de Sant Pere Pescador
const SANT_PERE_COORDS = {
  lat: 42.1833,
  lon: 3.0833,
}

export async function getOpenMeteoForecast(): Promise<any[]> {
  try {
    console.log("Obteniendo datos de Open-Meteo...")

    const url = `${OPEN_METEO_BASE}/forecast?` +
      `latitude=${SANT_PERE_COORDS.lat}&` +
      `longitude=${SANT_PERE_COORDS.lon}&` +
      `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&` +
      `wind_speed_unit=kn&` +
      `timezone=Europe/Madrid&` +
      `forecast_days=3`

    console.log("URL de Open-Meteo:", url)

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const data = await response.json()
    console.log("Datos recibidos de Open-Meteo:", data)

    return processOpenMeteoData(data)
  } catch (error) {
    console.error("Error obteniendo datos de Open-Meteo:", error)
    throw error
  }
}

function processOpenMeteoData(data: any): any[] {
  if (!data.hourly) {
    throw new Error("Datos de Open-Meteo inválidos")
  }

  const { time, temperature_2m, relative_humidity_2m, wind_speed_10m, wind_direction_10m, wind_gusts_10m } = data.hourly

  // Agrupar por días
  const dayGroups: { [key: string]: any[] } = {}

  time.forEach((timestamp: string, index: number) => {
    const date = new Date(timestamp)
    const hour = date.getHours()
    
    // Solo incluir horas de navegación (9:00 - 21:00)
    if (hour >= 9 && hour <= 21) {
      const dateKey = timestamp.split('T')[0]
      
      if (!dayGroups[dateKey]) {
        dayGroups[dateKey] = []
      }

      dayGroups[dateKey].push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        windSpeed: Math.round(wind_speed_10m[index] || 0),
        windDirection: Math.round(wind_direction_10m[index] || 0),
        windGust: Math.round(wind_gusts_10m[index] || wind_speed_10m[index] * 1.3),
        temperature: Math.round(temperature_2m[index] || 20),
        humidity: Math.round(relative_humidity_2m[index] || 70),
      })
    }
  })

  // Convertir a formato esperado
  const result = Object.entries(dayGroups)
    .slice(0, 3) // Solo 3 días
    .map(([date, hours]) => ({
      date,
      hours: hours.sort((a, b) => a.time.localeCompare(b.time))
    }))

  console.log("Datos procesados:", result.length, "días")
  return result
}