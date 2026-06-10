import { getOpenMeteoForecast } from "./open-meteo-api"

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
  isCalibrated?: boolean
  originalWindSpeed?: number
}

export interface ForecastDay {
  date: string
  hours: ForecastHour[]
}

const pendingRequests = new Map<string, Promise<ForecastDay[]>>()
const memCache = new Map<string, { data: ForecastDay[]; at: number }>()
const MEM_TTL = 60 * 1000       // 1 min en memòria
const LS_TTL = 30 * 60 * 1000  // 30 min en localStorage

function lsKey(spot: string) {
  return `el-vent:forecast:${spot}`
}

function saveToCache(spot: string, data: ForecastDay[]) {
  const entry = { data, at: Date.now() }
  memCache.set(spot, entry)
  if (typeof window !== "undefined") {
    try { localStorage.setItem(lsKey(spot), JSON.stringify(entry)) } catch {}
  }
}

function getFromCache(spot: string): ForecastDay[] | null {
  const mem = memCache.get(spot)
  if (mem && Date.now() - mem.at < MEM_TTL) return mem.data
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(lsKey(spot))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data: ForecastDay[]; at: number }
    if (!parsed?.data || !Array.isArray(parsed.data)) return null
    if (Date.now() - parsed.at > LS_TTL) return null
    memCache.set(spot, parsed)
    return parsed.data
  } catch { return null }
}

// Cridat des de la ruta /api/forecast (costat servidor)
export async function fetchForecastDataDirect(spot: string): Promise<ForecastDay[]> {
  return getOpenMeteoForecast(spot)
}

// Cridat des dels components (costat client) → passa per /api/forecast
export async function getForecastData(
  spot: string,
  options: { forceRefresh?: boolean } = {},
): Promise<ForecastDay[]> {
  if (typeof window !== "undefined") {
    if (!options.forceRefresh) {
      const cached = getFromCache(spot)
      if (cached) return cached
      const pending = pendingRequests.get(spot)
      if (pending) return pending
    }

    const req = (async () => {
      try {
        const res = await fetch(`/api/forecast?spot=${encodeURIComponent(spot)}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as ForecastDay[]
        saveToCache(spot, data)
        return data
      } catch (err) {
        const cached = getFromCache(spot)
        if (cached) {
          console.warn("⚠️ Error de xarxa, usant previsió guardada:", err)
          return cached
        }
        throw new Error("No es poden obtenir dades meteorològiques")
      } finally {
        pendingRequests.delete(spot)
      }
    })()

    pendingRequests.set(spot, req)
    return req
  }

  return fetchForecastDataDirect(spot)
}
