"use client"

import { useEffect, useState } from "react"
import { WindForecast } from "@/components/wind-forecast"
import { SessionOverview } from "@/components/session-overview"
import { SeaConditions } from "@/components/sea-conditions"
import { AquariusMeteo } from "@/components/aquarius-meteo"
import { AquariusReadings } from "@/components/aquarius-readings"

export function ClientContent() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

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
      <SessionOverview />

      {/* Anemòmetre de la platja */}
      <div className="mb-3 sm:mb-6">
        <AquariusMeteo />
      </div>

      {/* Previsió */}
      <div className="mb-3 sm:mb-8">
        <WindForecast />
      </div>

      {/* Onades i marees (combinat) */}
      <div className="mb-3 sm:mb-8">
        <SeaConditions />
      </div>
    </>
  )
}
