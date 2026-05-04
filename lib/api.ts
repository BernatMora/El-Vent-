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
  try {
    return await getOpenMeteoForecast(spot)
  } catch (err) {
    console.warn("⚠️ Open-Meteo no disponible, usant fallback simulat:", err)
    return generateSimulatedData()
  }
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

// ---- Fallback simulat (si Open-Meteo falla) ----

function generateSimulatedData(): ForecastDay[] {
  const days: ForecastDay[] = []
  const now = new Date()

  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const date = new Date(now.getTime() + dayOffset * 86_400_000)
    const dateStr = date.toISOString().split("T")[0]
    const hours: ForecastHour[] = []

    for (let h = 9; h <= 21; h++) {
      let speed = 2
      if (h >= 11 && h <= 17) speed = 6 + Math.sin(((h - 11) / 6) * Math.PI) * 6
      else if (h >= 9 && h < 11) speed = 2 + (h - 9) * 2
      else if (h > 17 && h <= 19) speed = 8 - (h - 17) * 2
      speed *= dayOffset === 1 ? 1.1 : dayOffset === 2 ? 0.9 : 1.0
      speed += (Math.random() - 0.5) * 2
      speed = Math.max(1, Math.round(speed))

      hours.push({
        time: `${h.toString().padStart(2, "0")}:00`,
        windSpeed: speed,
        windDirection: Math.round(75 + Math.random() * 30) % 360,
        windGust: Math.round(Math.max(speed * 1.3, speed + 2)),
        temperature: Math.round(14 + (h - 9) * 0.5 + dayOffset * 0.5),
        source: "Simulat",
      })
    }

    days.push({ date: dateStr, hours })
  }
  return days
}
