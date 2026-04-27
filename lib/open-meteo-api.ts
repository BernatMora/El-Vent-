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
      `timezone=Europe/Madrid&forecast_days=7`

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

    return Object.entries(dayGroups).slice(0, 7).map(([date, hours]) => ({
      date,
      hours: hours.sort((a, b) => a.time.localeCompare(b.time)),
    }))
  } catch (error) {
    console.error("❌ Error obtenint dades marines:", error)
    return []
  }
}

// Models disponibles per Catalunya amb els seus pesos (més alt = més confiança)
const WEATHER_MODELS = {
  // AROME de Météo-France - Alta resolució (1.5-2.5km), molt bo per vent costaner
  'meteofrance_arome_france_hd': { weight: 1.0, name: 'AROME HD', resolution: '1.5km' },
  'meteofrance_arome_france': { weight: 0.9, name: 'AROME', resolution: '2.5km' },
  // ICON de DWD - Bona resolució per Europa
  'icon_eu': { weight: 0.8, name: 'ICON EU', resolution: '7km' },
  'icon_seamless': { weight: 0.7, name: 'ICON', resolution: '11km' },
  // GFS de NOAA - Model global de referència  
  'gfs_seamless': { weight: 0.6, name: 'GFS', resolution: '25km' },
}

interface ModelData {
  model: string
  weight: number
  data: any
}

// Funció per obtenir dades de múltiples models i combinar-les
export async function getMultiModelForecast(spot?: string): Promise<any[]> {
  const coords = getSpotCoords(spot)
  const modelNames = Object.keys(WEATHER_MODELS)
  
  console.log(`Obtenint dades de ${modelNames.length} models per ${spot ?? "default"}...`)

  // Consultar tots els models en paral·lel
  const modelPromises = modelNames.map(async (model) => {
    try {
      const url = `${OPEN_METEO_BASE}/forecast?` +
        `latitude=${coords.lat}&longitude=${coords.lon}&` +
        `hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m&` +
        `models=${model}&` +
        `wind_speed_unit=kn&` +
        `timezone=Europe/Madrid&` +
        `forecast_days=7`

      const response = await fetch(url)
      if (!response.ok) return null
      
      const data = await response.json()
      return {
        model,
        weight: WEATHER_MODELS[model as keyof typeof WEATHER_MODELS].weight,
        data
      } as ModelData
    } catch {
      console.warn(`Model ${model} no disponible`)
      return null
    }
  })

  const results = (await Promise.all(modelPromises)).filter((r): r is ModelData => r !== null)
  
  if (results.length === 0) {
    throw new Error("Cap model meteorològic disponible")
  }

  console.log(`Obtingudes dades de ${results.length} models: ${results.map(r => WEATHER_MODELS[r.model as keyof typeof WEATHER_MODELS].name).join(', ')}`)

  // Combinar dades dels models
  return combineModelData(results)
}

function combineModelData(modelResults: ModelData[]): any[] {
  // Utilitzar el primer model com a estructura base
  const baseModel = modelResults[0]
  if (!baseModel.data.hourly) {
    throw new Error("Dades de model invàlides")
  }

  const { time } = baseModel.data.hourly
  const dayGroups: { [key: string]: any[] } = {}

  time.forEach((timestamp: string, index: number) => {
    const date = new Date(timestamp)
    const hour = date.getHours()
    
    if (hour >= 9 && hour <= 21) {
      const dateKey = timestamp.split('T')[0]
      if (!dayGroups[dateKey]) dayGroups[dateKey] = []

      // Recollir dades de tots els models per aquesta hora
      const windSpeeds: { value: number; weight: number }[] = []
      const windGusts: { value: number; weight: number }[] = []
      const windDirections: { value: number; weight: number }[] = []
      const temperatures: { value: number; weight: number }[] = []
      const modelNames: string[] = []

      for (const result of modelResults) {
        const hourly = result.data.hourly
        if (!hourly.wind_speed_10m?.[index]) continue

        windSpeeds.push({ value: hourly.wind_speed_10m[index], weight: result.weight })
        windGusts.push({ value: hourly.wind_gusts_10m?.[index] ?? hourly.wind_speed_10m[index] * 1.3, weight: result.weight })
        windDirections.push({ value: hourly.wind_direction_10m?.[index] ?? 0, weight: result.weight })
        temperatures.push({ value: hourly.temperature_2m?.[index] ?? 20, weight: result.weight })
        modelNames.push(WEATHER_MODELS[result.model as keyof typeof WEATHER_MODELS].name)
      }

      // Calcular mitjana ponderada
      const avgWindSpeed = weightedAverage(windSpeeds)
      const avgWindGust = weightedAverage(windGusts)
      const avgWindDir = weightedAverageDirection(windDirections)
      const avgTemp = weightedAverage(temperatures)

      // Calcular confiança basada en concordança entre models
      const confidence = calculateConfidence(windSpeeds)

      dayGroups[dateKey].push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        windSpeed: Math.round(avgWindSpeed),
        windDirection: Math.round(avgWindDir),
        windGust: Math.round(Math.max(avgWindGust, avgWindSpeed)),
        temperature: Math.round(avgTemp),
        humidity: 70,
        precipitation: 0,
        source: `Multi-model (${modelNames.slice(0, 3).join(', ')})`,
        confidence: Math.round(confidence * 100) / 100,
        isReal: true,
        modelsUsed: modelNames.length
      })
    }
  })

  return Object.entries(dayGroups)
    .slice(0, 7)
    .map(([date, hours]) => ({
      date,
      hours: hours.sort((a, b) => a.time.localeCompare(b.time))
    }))
}

function weightedAverage(values: { value: number; weight: number }[]): number {
  if (values.length === 0) return 0
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0)
  const weightedSum = values.reduce((sum, v) => sum + v.value * v.weight, 0)
  return weightedSum / totalWeight
}

function weightedAverageDirection(values: { value: number; weight: number }[]): number {
  if (values.length === 0) return 0
  // Per direccions, cal utilitzar components vectorials per evitar problemes amb 0/360
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0)
  let sinSum = 0, cosSum = 0
  for (const v of values) {
    const rad = v.value * Math.PI / 180
    sinSum += Math.sin(rad) * v.weight
    cosSum += Math.cos(rad) * v.weight
  }
  let avgDir = Math.atan2(sinSum / totalWeight, cosSum / totalWeight) * 180 / Math.PI
  if (avgDir < 0) avgDir += 360
  return avgDir
}

function calculateConfidence(values: { value: number; weight: number }[]): number {
  if (values.length < 2) return 0.7
  
  // Calcular desviació estàndard relativa
  const avg = weightedAverage(values)
  if (avg === 0) return 0.8
  
  const variance = values.reduce((sum, v) => sum + Math.pow(v.value - avg, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  const relativeStdDev = stdDev / avg
  
  // Més concordança = més confiança (0.5 a 0.95)
  // Si els models difereixen molt (>30%), baixa confiança
  // Si concorden (<10%), alta confiança
  const confidence = Math.max(0.5, Math.min(0.95, 1 - relativeStdDev * 2))
  return confidence
}

export async function getOpenMeteoForecast(spot?: string): Promise<any[]> {
  const coords = getSpotCoords(spot)

  try {
    console.log(`Obtenint dades d'Open-Meteo per ${spot ?? "default"} (${coords.lat}, ${coords.lon})...`)

    // Intentar primer amb multi-model per millor precisió
    try {
      return await getMultiModelForecast(spot)
    } catch (multiError) {
      console.warn("Multi-model no disponible, utilitzant model per defecte")
    }

    // Fallback a l'endpoint general
    const url = `${OPEN_METEO_BASE}/forecast?` +
      `latitude=${coords.lat}&` +
      `longitude=${coords.lon}&` +
      `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation&` +
      `wind_speed_unit=kn&` +
      `timezone=Europe/Madrid&` +
      `forecast_days=7`

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error HTTP d'Open-Meteo: ${response.status}`)
    }

    const data = await response.json()

    return processOpenMeteoData(data)
  } catch (error) {
    console.error("Error obtenint dades d'Open-Meteo:", error)
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

      const rawWindSpeed = wind_speed_10m[index] ?? 0
      const windSpeed = Math.round(rawWindSpeed)
      // Assegurar que les ràfegues sempre siguin >= al vent sostingut
      const rawGust = wind_gusts_10m[index] ?? rawWindSpeed * 1.3
      // Primer fem el màxim amb els valors sense arrodonir, després arrodonim
      const windGust = Math.round(Math.max(rawGust, rawWindSpeed))

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
    .slice(0, 7) // 7 dies de previsio
    .map(([date, hours]) => ({
      date,
      hours: hours.sort((a, b) => a.time.localeCompare(b.time))
    }))

  console.log("📈 Dades processades:", result.length, "dies")
  return result
}
