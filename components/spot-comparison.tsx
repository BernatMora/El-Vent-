"use client"

import { useEffect, useState } from "react"
import { MapPin, Wind } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { type ForecastDay, getForecastData } from "@/lib/api"
import { SPOT_COORDINATES } from "@/lib/spot-coordinates"
import { useSpotStore } from "@/lib/store"
import { knotsToKmh } from "@/lib/utils"

const SPOT_LABELS: Record<string, string> = {
  "kitesurf-point": "Kitesurf Point",
  "la-ballena":     "La Ballena",
  "can-martinet":   "Can Martinet",
  "la-rubina":      "La Rubina",
}

type SpotSummary = {
  spot: string
  label: string
  avgWind: number
  maxWind: number
  rideableHours: number
  bestWindow: string
}

function summarize(spot: string, data: ForecastDay[]): SpotSummary | null {
  if (!data[0]?.hours?.length) return null
  const hours = data[0].hours
  const avg = Math.round(hours.reduce((s, h) => s + h.windSpeed, 0) / hours.length)
  const max = Math.max(...hours.map((h) => h.windSpeed))
  const rideable = hours.filter((h) => h.windSpeed >= 10)
  const bestWindow = rideable.length > 0
    ? `${rideable[0].time}–${rideable[rideable.length - 1].time}`
    : "—"

  return { spot, label: SPOT_LABELS[spot] ?? spot, avgWind: avg, maxWind: max, rideableHours: rideable.length, bestWindow }
}

export function SpotComparison() {
  const { selectedSpot, setSelectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<SpotSummary[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const spots = Object.keys(SPOT_COORDINATES)
      const results = await Promise.all(
        spots.map(async (spot) => {
          try {
            const data = await getForecastData(spot)
            return summarize(spot, data)
          } catch {
            return null
          }
        })
      )
      setSummaries(results.filter((r): r is SpotSummary => r !== null).sort((a, b) => b.avgWind - a.avgWind))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5 text-orange-600" />Comparativa spots</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    )
  }

  if (summaries.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-orange-600" />
          Comparativa de spots — Avui
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {summaries.map((s, i) => {
            const isSelected = s.spot === selectedSpot
            const isBest = i === 0
            return (
              <button
                key={s.spot}
                onClick={() => setSelectedSpot(s.spot)}
                className={`relative rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                  isSelected ? "border-sky-400 bg-sky-50 ring-2 ring-sky-300" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {isBest && (
                  <Badge className="absolute -top-2 right-3 bg-amber-500 text-white text-[10px]">Millor avui</Badge>
                )}
                <div className="mb-1 font-semibold text-slate-900">{s.label}</div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Wind className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-medium text-blue-700">{s.avgWind} kn</span>
                    <span className="text-slate-500">mitjana</span>
                  </div>
                  <div className="text-slate-500">Màx {s.maxWind} kn</div>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {s.rideableHours > 0
                    ? `${s.rideableHours}h navegables · ${s.bestWindow}`
                    : "Sense hores navegables"}
                </div>
                {isSelected && <span className="text-[10px] text-sky-600 font-medium">✓ Seleccionat</span>}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
