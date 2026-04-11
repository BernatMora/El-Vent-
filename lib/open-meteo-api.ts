// API gratuïta Open-Meteo per dades meteorològiques reals
import { getSpotCoords } from './spot-coordinates'

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1"

// --- Marine / Wave data ---
export interface MarineHour {
  time: string
  waveHeight: number
  wavePeriod: number
  waveDirection: number
}

export interface MarineDay {
  date: string
  hours: MarineHour[]
}

export async function getMarineForecast(spot?: string): Promise<MarineDay[]> {
  const coords = getSpotCoords(spot)

  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?` +
      `latitude=${coords.lat}&longitude=${coords.lon}&` +
      `hourly=wave_height,wave_period,wave_direction&` +
      `timezone=Europe/Madrid&forecast_days=3`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Marine API error: ${response.status}`)

    const data = await response.json()
    if (!data.hourly) throw new Error("Dades marines invàlides")

    const { time, wave_height, wave_period, wave_direction } = data.hourly
    const dayGroups: Record<string, MarineHour[]> = {}

    time.forEach((timestamp: string, i: number) => {
      const date = new Date(timestamp)
      const hour = date.getHours()
      if (hour >= 9 && hour <= 21) {
        const dateKey = timestamp.split('T')[0]
        if (!dayGroups[dateKey]) dayGroups[dateKey] = []
        dayGroups[dateKey].push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          waveHeight: Math.round((wave_height[i] ?? 0) * 10) / 10,
          wavePeriod: Math.round(wave_period[i] ?? 0),
          waveDirection: Math.round(wave_direction[i] ?? 0),
        })
      }
    })

    return Object.entries(dayGroups).slice(0, 3).map(([date, hours]) => ({
      date,
      hours: hours.sort((a, b) => a.time.localeCompare(b.time)),
    }))
  } catch (error) {
    console.error("❌ Error obtenint dades marines:", error)
    return []
  }
}

export async function getOpenMeteoForecast(spot?: string): Promise<any[]> {
  const coords = getSpotCoords(spot)

  try {
    console.log(`🌐 Obtenint dades d'Open-Meteo (GFS) per ${spot ?? "default"} (${coords.lat}, ${coords.lon})...`)

    // Usem l'endpoint GFS per coincidir amb el model que usa Windguru
    const url = `${OPEN_METEO_BASE}/gfs?` +
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

      const windSpeed = Math.round(wind_speed_10m[index] ?? 0)
      // Assegurar que les ràfegues sempre siguin >= al vent sostingut
      const rawGust = wind_gusts_10m[index] ?? (wind_speed_10m[index] ?? 0) * 1.3
      const windGust = Math.round(Math.max(rawGust, windSpeed))

      dayGroups[dateKey].push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        windSpeed,
        windDirection: Math.round(wind_direction_10m[index] ?? 0),
        windGust,
        temperature: Math.round(temperature_2m[index] ?? 20),
        humidity: Math.round(relative_humidity_2m[index] ?? 70),
        precipitation: precipitation ? Math.round((precipitation[index] ?? 0) * 10) / 10 : 0,
        source: "Open-Meteo GFS",
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
