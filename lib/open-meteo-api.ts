// API gratuïta Open-Meteo per dades meteorològiques reals
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1"

// Coordenades per spot
const SPOT_COORDS: Record<string, { lat: number; lon: number }> = {
  "kitesurf-point": { lat: 42.1833, lon: 3.0833 },
  "la-ballena":     { lat: 42.1830, lon: 3.0835 },
  "can-martinet":   { lat: 42.1825, lon: 3.0840 },
  "la-rubina":      { lat: 42.1900, lon: 3.1200 },
}

const DEFAULT_COORDS = SPOT_COORDS["kitesurf-point"]

export async function getOpenMeteoForecast(spot?: string): Promise<any[]> {
  const coords = (spot && SPOT_COORDS[spot]) || DEFAULT_COORDS

  try {
    console.log(`🌐 Obtenint dades d'Open-Meteo per ${spot ?? "default"} (${coords.lat}, ${coords.lon})...`)

    const url = `${OPEN_METEO_BASE}/forecast?` +
      `latitude=${coords.lat}&` +
      `longitude=${coords.lon}&` +
      `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation&` +
      `wind_speed_unit=kn&` +
      `timezone=Europe/Madrid&` +
      `forecast_days=3`

    console.log("🔗 URL d'Open-Meteo:", url)

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error HTTP d'Open-Meteo: ${response.status}`)
    }

    const data = await response.json()
    console.log("📊 Dades rebudes d'Open-Meteo:", data)

    return processOpenMeteoData(data)
  } catch (error) {
    console.error("❌ Error obtenint dades d'Open-Meteo:", error)
    throw error
  }
}

function processOpenMeteoData(data: any): any[] {
  if (!data.hourly) {
    throw new Error("Dades d'Open-Meteo invàlides")
  }

  const { 
    time, 
    temperature_2m, 
    relative_humidity_2m, 
    wind_speed_10m, 
    wind_direction_10m, 
    wind_gusts_10m,
    precipitation 
  } = data.hourly

  // Agrupar per dies
  const dayGroups: { [key: string]: any[] } = {}

  time.forEach((timestamp: string, index: number) => {
    const date = new Date(timestamp)
    const hour = date.getHours()
    
    // Només incloure hores de navegació (9:00 - 21:00)
    if (hour >= 9 && hour <= 21) {
      const dateKey = timestamp.split('T')[0]
      
      if (!dayGroups[dateKey]) {
        dayGroups[dateKey] = []
      }

      dayGroups[dateKey].push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        windSpeed: Math.round(wind_speed_10m[index] ?? 0),
        windDirection: Math.round(wind_direction_10m[index] ?? 0),
        windGust: Math.round(wind_gusts_10m[index] ?? (wind_speed_10m[index] ?? 0) * 1.3),
        temperature: Math.round(temperature_2m[index] ?? 20),
        humidity: Math.round(relative_humidity_2m[index] ?? 70),
        precipitation: precipitation ? Math.round((precipitation[index] ?? 0) * 10) / 10 : 0,
        source: "Open-Meteo (Real)",
        confidence: 0.9,
        isReal: true
      })
    }
  })

  // Convertir a format esperat
  const result = Object.entries(dayGroups)
    .slice(0, 3) // Només 3 dies
    .map(([date, hours]) => ({
      date,
      hours: hours.sort((a, b) => a.time.localeCompare(b.time))
    }))

  console.log("📈 Dades processades:", result.length, "dies")
  return result
}