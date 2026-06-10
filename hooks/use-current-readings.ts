"use client"

import { useEffect, useState } from "react"

export interface StationReading {
  windSpeed: number | null
  windGust: number | null
  windDirection: number | null
  windSpeedKmh: number | null
  windGustKmh: number | null
  timestamp: string | null
  stationName: string
  stationCode?: string
  source: string
  isMeteocat: boolean
}

async function fetchMeteocatCurrent(): Promise<StationReading | null> {
  const pref = typeof window !== "undefined" ? localStorage.getItem("preferredWindSource") || "auto" : "auto"
  if (pref === "aquarius") return null

  try {
    const cur = await fetch("/api/current")
    if (!cur.ok) return null
    const curJson = await cur.json()
    const c = curJson.current
    if (!c || !c.isReal) return null
    if (curJson.stationCode !== "U2" && !String(curJson.source || "").includes("Meteocat")) return null

    return {
      windSpeed: c.windSpeed ?? null,
      windGust: c.windGust ?? null,
      windDirection: c.windDirection ?? null,
      windSpeedKmh: c.windSpeed != null ? Math.round(c.windSpeed * 1.852) : null,
      windGustKmh: c.windGust != null ? Math.round(c.windGust * 1.852) : null,
      timestamp: c.lastUpdate ?? new Date().toISOString(),
      stationName: curJson.station || c.stationName || "Sant Pere Pescador",
      stationCode: curJson.stationCode || c.stationCode,
      source: curJson.source || "Meteocat",
      isMeteocat: true,
    }
  } catch {
    return null
  }
}

// Module-level shared state per refresh interval — evita duplicar peticions
const sharedState = new Map<number, {
  data: StationReading | null
  loading: boolean
  error: string | null
  listeners: Set<() => void>
  lastFetch: number
  inflight: Promise<void> | null
}>()

function getOrCreateShared(refreshMs: number) {
  let s = sharedState.get(refreshMs)
  if (!s) {
    s = { data: null, loading: true, error: null, listeners: new Set(), lastFetch: 0, inflight: null }
    sharedState.set(refreshMs, s)
  }
  return s
}

export function useCurrentReadings(refreshMs = 60000) {
  const shared = getOrCreateShared(refreshMs)
  const [data, setData] = useState<StationReading | null>(shared.data)
  const [loading, setLoading] = useState(shared.loading)
  const [error, setError] = useState<string | null>(shared.error)

  const notify = () => {
    for (const cb of shared.listeners) cb()
  }

  const load = async () => {
    if (shared.inflight) return shared.inflight
    shared.inflight = (async () => {
      shared.loading = true
      notify()
      try {
        const reading = await fetchMeteocatCurrent()
        shared.data = reading
        shared.error = null
      } catch (e: any) {
        shared.error = e?.message || "Error carregant dades"
      } finally {
        shared.loading = false
        shared.inflight = null
        shared.lastFetch = Date.now()
        notify()
      }
    })()
    return shared.inflight
  }

  useEffect(() => {
    const update = () => {
      setData(shared.data)
      setLoading(shared.loading)
      setError(shared.error)
    }
    shared.listeners.add(update)
    update()

    if (Date.now() - shared.lastFetch > refreshMs) {
      load()
    }

    const interval = setInterval(() => {
      if (Date.now() - shared.lastFetch >= refreshMs) load()
    }, refreshMs)

    const onVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - shared.lastFetch >= refreshMs) load()
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      shared.listeners.delete(update)
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs])

  return { data, loading, error, refresh: load }
}
