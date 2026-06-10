"use client"

import { useEffect, useState } from "react"
import { type ForecastDay, getForecastData } from "@/lib/api"

const SPOT = "sant-pere-pescador"

// Module-level shared state — evita duplicar peticions entre components
let sharedData: ForecastDay[] | null = null
let sharedLoading = true
let sharedError: string | null = null
const listeners = new Set<() => void>()
let lastFetch = 0
let inflight: Promise<void> | null = null

function notify() {
  for (const cb of listeners) cb()
}

async function load(forceRefresh = false) {
  if (inflight && !forceRefresh) return inflight
  inflight = (async () => {
    sharedLoading = true
    notify()
    try {
      const data = await getForecastData(SPOT, { forceRefresh })
      sharedData = data
      sharedError = null
    } catch (e: any) {
      sharedData = null
      sharedError = e?.message || "Error carregant previsió"
    } finally {
      sharedLoading = false
      lastFetch = Date.now()
      inflight = null
      notify()
    }
  })()
  return inflight
}

export function useForecastData(refreshMs = 300000) {
  const [data, setData] = useState<ForecastDay[] | null>(sharedData)
  const [loading, setLoading] = useState(sharedLoading)
  const [error, setError] = useState<string | null>(sharedError)

  useEffect(() => {
    const update = () => {
      setData(sharedData)
      setLoading(sharedLoading)
      setError(sharedError)
    }
    listeners.add(update)
    update()

    const shouldFetch = !sharedData || Date.now() - lastFetch > refreshMs
    if (shouldFetch && !inflight) load()

    const interval = setInterval(() => {
      if (Date.now() - lastFetch >= refreshMs) load()
    }, refreshMs)

    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastFetch >= refreshMs) load()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      listeners.delete(update)
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs])

  return { data, loading, error, refresh: () => load(true) }
}
