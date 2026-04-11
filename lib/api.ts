import { protectedWeatherAPI } from "./protected-api"
import { getOpenMeteoForecast } from "./open-meteo-api"
import { getMeteocatForecast } from "./meteocat-api"
import { enhancedWeatherService } from "./enhanced-api"

export interface ForecastHour {
  time: string
  windSpeed: number
  windDirection: number
  windGust: number
  temperature?: number
  humidity?: number
  pressure?: number
  precipitation?: number
  source?: string
  confidence?: number
  mlConfidence?: number
  mlAdjustmentFactor?: number
  isMLEnhanced?: boolean
  isCalibrated?: boolean
  originalWindSpeed?: number
  originalWindDirection?: number
  isReal?: boolean
}

export interface ForecastDay {
  date: string
  hours: ForecastHour[]
}

export interface ProtectionStats {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  lastReset: number
  hitRate: number
  cacheSize: number
  dailyApiCalls: number
  remainingCalls: number
  isNearLimit: boolean
  isProtected: boolean
  offlineMode: boolean
  costSavings: string
  status: string
  lastUpdate: string
}

type ForecastRequestOptions = {
  forceRefresh?: boolean
}

type ForecastCacheEntry = {
  data: ForecastDay[]
  timestamp: number
}

const pendingForecastRequests = new Map<string, Promise<ForecastDay[]>>()
const memoryForecastCache = new Map<string, ForecastCacheEntry>()
const FORECAST_CACHE_TTL = 60 * 1000

function getStoredForecastKey(spot: string) {
  return `el-vent:forecast:${spot}`
}

function storeForecastInCache(spot: string, data: ForecastDay[]) {
  const entry = { data, timestamp: Date.now() }
  memoryForecastCache.set(spot, entry)

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getStoredForecastKey(spot), JSON.stringify(entry))
    } catch (error) {
      console.warn("⚠️ No s'ha pogut desar la previsió al dispositiu:", error)
    }
  }
}

function getCachedForecast(spot: string): ForecastDay[] | null {
  const inMemory = memoryForecastCache.get(spot)
  if (inMemory && Date.now() - inMemory.timestamp < FORECAST_CACHE_TTL) {
    return inMemory.data
  }

  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(getStoredForecastKey(spot))
    if (!stored) return null

    const parsed = JSON.parse(stored) as ForecastCacheEntry
    if (!parsed?.data || !Array.isArray(parsed.data)) {
      return null
    }

    memoryForecastCache.set(spot, parsed)
    return parsed.data
  } catch (error) {
    console.warn("⚠️ No s'ha pogut recuperar la previsió desada:", error)
    return null
  }
}

export async function fetchForecastDataDirect(spot: string): Promise<ForecastDay[]> {
  try {
    console.log("🌐 Intentant obtenir dades meteorològiques per spot:", spot)

    // Primer intentar dades d'Open-Meteo (prioritat màxima)
    try {
      const realData = await getOpenMeteoForecast(spot)
      console.log("✅ Dades d'Open-Meteo obtingudes:", realData.length, "dies")

      // Intentar enriquir amb dades de Meteocat com a font addicional
      try {
        const meteocatData = await getMeteocatForecast()
        if (meteocatData.length > 0) {
          console.log("📊 Dades addicionals de Meteocat disponibles:", meteocatData.length, "dies")
          // Les dades de Meteocat estan disponibles però Open-Meteo és la font principal
        }
      } catch (meteocatError) {
        console.log("ℹ️ Meteocat no disponible com a font addicional")
      }

      return realData
    } catch (apiError) {
      console.warn("⚠️ Open-Meteo no disponible:", apiError)

      // Si Open-Meteo falla, intentar Meteocat com a alternativa
      try {
        const meteocatData = await getMeteocatForecast()
        if (meteocatData.length > 0) {
          console.log("✅ Utilitzant Meteocat com a font alternativa:", meteocatData.length, "dies")
          return meteocatData
        }
      } catch (meteocatError) {
        console.warn("⚠️ Meteocat tampoc disponible:", meteocatError)
      }

      // Si tot falla, usar sistema protegit
      const protectedData = await protectedWeatherAPI.getForecastData(spot)
      console.log("✅ Dades protegides obtingudes:", protectedData.length, "dies")
      return protectedData
    }

  } catch (error) {
    console.error("❌ Error obtenint dades de previsió:", error)

    // Si tot falla, mostrar error
    throw new Error("No es poden obtenir dades meteorològiques")
  }
}

export async function getForecastData(spot: string, options: ForecastRequestOptions = {}): Promise<ForecastDay[]> {
  if (typeof window !== "undefined") {
    const { forceRefresh = false } = options

    if (!forceRefresh) {
      const cachedData = getCachedForecast(spot)
      if (cachedData) {
        return cachedData
      }

      const pendingRequest = pendingForecastRequests.get(spot)
      if (pendingRequest) {
        return pendingRequest
      }
    }

    const requestPromise = (async () => {
      try {
        const response = await fetch(`/api/forecast?spot=${encodeURIComponent(spot)}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("No es poden obtenir dades meteorològiques")
        }

        const data = (await response.json()) as ForecastDay[]
        storeForecastInCache(spot, data)
        return data
      } catch (error) {
        const cachedData = getCachedForecast(spot)
        if (cachedData) {
          console.warn("⚠️ Sense connexió o error temporal. Mostrant l'última previsió desada.", error)
          return cachedData
        }

        throw new Error("No es poden obtenir dades meteorològiques")
      } finally {
        pendingForecastRequests.delete(spot)
      }
    })()

    pendingForecastRequests.set(spot, requestPromise)
    return requestPromise
  }

  return fetchForecastDataDirect(spot)
}

// Funció per afegir observacions d'usuaris al sistema ML
export function addUserObservation(spot: string, observation: {
  reportedWindSpeed: number
  reportedDirection: number
  modelWindSpeed: number
  modelWindDirection: number
}) {
  enhancedWeatherService.addUserObservation(spot, {
    ...observation,
    temperature: 20, // Valors per defecte
    humidity: 70,
    pressure: 1013
  })
}

// Obtenir estadístiques del sistema millorat
export function getProtectionStats(): ProtectionStats {
  return protectedWeatherAPI.getProtectionStats()
}

// Mantenir la funció de fallback
function generateSimulatedData() {
  console.log("Generant dades simulades com a fallback")
  const now = new Date()
  const days = []

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    const dateString = date.toISOString().split("T")[0]
    const hours = []

    for (let hour = 9; hour <= 21; hour++) {
      let baseWindSpeed = 2

      if (hour >= 11 && hour <= 17) {
        baseWindSpeed = 6 + Math.sin(((hour - 11) / 6) * Math.PI) * 6
      } else if (hour >= 9 && hour < 11) {
        baseWindSpeed = 2 + (hour - 9) * 2
      } else if (hour > 17 && hour <= 19) {
        baseWindSpeed = 8 - (hour - 17) * 2
      } else {
        baseWindSpeed = 1 + Math.random() * 2
      }

      const dayTrend = dayOffset === 0 ? 1.0 : dayOffset === 1 ? 1.1 : 0.9
      baseWindSpeed *= dayTrend
      baseWindSpeed += (Math.random() - 0.5) * 2

      let windDirection = 90
      if (hour < 12) {
        windDirection = 60 + Math.random() * 30
      } else if (hour >= 12 && hour <= 16) {
        windDirection = 80 + Math.random() * 20
      } else {
        windDirection = 100 + Math.random() * 35
      }

      let temperature = 14 + (hour - 9) * 0.7
      if (hour > 15) {
        temperature = 19 - (hour - 15) * 0.3
      }
      temperature += dayOffset * 0.5
      temperature += (Math.random() - 0.5) * 1.5

      const humidity = Math.max(50, Math.min(95, 85 - (temperature - 15) * 2 + Math.random() * 10))

      const roundedWindSpeed = Math.max(1, Math.round(baseWindSpeed))
      // Assegurar que les ràfegues sempre siguin >= al vent sostingut
      const windGust = Math.round(Math.max(baseWindSpeed * (1.3 + Math.random() * 0.4), baseWindSpeed))

      hours.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        windSpeed: roundedWindSpeed,
        windDirection: Math.round(windDirection) % 360,
        windGust,
        temperature: Math.round(temperature),
        humidity: Math.round(humidity),
        isCalibrated: false,
        source: "Simulat"
      })
    }

    days.push({
      date: dateString,
      hours: hours,
    })
  }

  return days
}
