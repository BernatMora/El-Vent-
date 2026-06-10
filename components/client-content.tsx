"use client"

import { useEffect, useRef, useState } from "react"
import { WindForecast } from "@/components/wind-forecast"
import { SessionOverview } from "@/components/session-overview"
import { SeaConditions } from "@/components/sea-conditions"
import { AquariusMeteo } from "@/components/aquarius-meteo"
import { AquariusReadings } from "@/components/aquarius-readings"
import { getForecastData } from "@/lib/api"

const SPOT = "sant-pere-pescador"
const AUTO_REFRESH_MS = 5 * 60 * 1000 // 5 minuts

export function ClientContent() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)
  const inFlightRef = useRef(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Refresc automàtic silenciós: en muntar, en tornar a la pestanya i cada 5 min
  useEffect(() => {
    if (!isHydrated) return

    const refresh = async () => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      try {
        const data = await getForecastData(SPOT, { forceRefresh: true })
        if (data && data.length > 0) {
          setRefreshKey((prev) => prev + 1)
        }
      } catch (error) {
        console.error("Error actualitzant dades meteorològiques:", error)
      } finally {
        inFlightRef.current = false
      }
    }

    refresh()
    const interval = setInterval(refresh, AUTO_REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [isHydrated])

  if (!isHydrated) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        </div>
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    )
  }

  return (
    <>
      {/* A la platja ara — primer vistaso */}
      <div className="mb-3 sm:mb-6">
        <AquariusReadings />
      </div>

      {/* Semàfor de sessió */}
      <SessionOverview key={`session-${refreshKey}`} />

      {/* Anemòmetre de la platja */}
      <div className="mb-3 sm:mb-6">
        <AquariusMeteo />
      </div>

      {/* Previsió */}
      <div className="mb-3 sm:mb-8">
        <WindForecast key={`forecast-${refreshKey}`} />
      </div>

      {/* Onades i marees (combinat) */}
      <div className="mb-3 sm:mb-8">
        <SeaConditions key={`sea-${refreshKey}`} />
      </div>
    </>
  )
}
