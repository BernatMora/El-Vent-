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

export function useCurrentReadings(refreshMs = 60000) {
  const [data, setData] = useState<StationReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      const reading = await fetchMeteocatCurrent()
      setData(reading)
    } catch (e: any) {
      setError(e?.message || "Error carregant dades")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, refreshMs)
    const onVisibility = () => {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs])

  return { data, loading, error, refresh: load }
}
