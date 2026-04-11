"use client"

import { useEffect, useState } from "react"
import { MapPin, Wind, Navigation, Waves } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { type ForecastDay, getForecastData } from "@/lib/api"
import { SPOT_COORDINATES } from "@/lib/spot-coordinates"
import { useSpotStore } from "@/lib/store"
import { getWindDirectionName } from "@/lib/utils"

const MIN_RIDEABLE_WIND = 12

const SPOT_LABELS: Record<string, string> = {
  "kitesurf-point": "Kitesurf Point",
  "la-ballena": "La Ballena",
  "can-martinet": "Can Martinet",
  "la-rubina": "La Rubina",
}

// Posicions relatives dels spots al mapa (a la franja de platja)
const SPOT_POSITIONS: Record<string, { x: number; y: number }> = {
  "la-rubina": { x: 62, y: 15 },
  "can-martinet": { x: 58, y: 38 },
  "kitesurf-point": { x: 60, y: 60 },
  "la-ballena": { x: 56, y: 82 },
}

type SpotSummary = {
  spot: string
  label: string
  avgWind: number
  maxWind: number
  avgDirection: number
  rideableHours: number
  bestWindow: string
  quality: "excellent" | "good" | "fair" | "poor"
}

function getQuality(avgWind: number, rideableHours: number): SpotSummary["quality"] {
  if (avgWind >= 15 && rideableHours >= 4) return "excellent"
  if (avgWind >= 12 && rideableHours >= 3) return "good"
  if (avgWind >= 10 && rideableHours >= 2) return "fair"
  return "poor"
}

function getQualityColor(quality: SpotSummary["quality"]) {
  switch (quality) {
    case "excellent": return "bg-green-500"
    case "good": return "bg-emerald-400"
    case "fair": return "bg-amber-400"
    case "poor": return "bg-slate-300"
  }
}

function getQualityBorder(quality: SpotSummary["quality"]) {
  switch (quality) {
    case "excellent": return "border-green-500 ring-green-200"
    case "good": return "border-emerald-400 ring-emerald-200"
    case "fair": return "border-amber-400 ring-amber-200"
    case "poor": return "border-slate-300 ring-slate-200"
  }
}

function summarize(spot: string, data: ForecastDay[]): SpotSummary | null {
  if (!data[0]?.hours?.length) return null
  const hours = data[0].hours
  const avg = Math.round(hours.reduce((s, h) => s + h.windSpeed, 0) / hours.length)
  const max = Math.max(...hours.map((h) => h.windSpeed))
  const avgDir = Math.round(hours.reduce((s, h) => s + h.windDirection, 0) / hours.length)
  const rideable = hours.filter((h) => h.windSpeed >= MIN_RIDEABLE_WIND)
  const bestWindow = rideable.length > 0
    ? `${rideable[0].time}-${rideable[rideable.length - 1].time}`
    : "-"

  return {
    spot,
    label: SPOT_LABELS[spot] ?? spot,
    avgWind: avg,
    maxWind: max,
    avgDirection: avgDir,
    rideableHours: rideable.length,
    bestWindow,
    quality: getQuality(avg, rideable.length)
  }
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-orange-600" />
            Mapa de spots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (summaries.length === 0) return null

  const bestSpot = summaries[0]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-orange-600" />
            On fa millor vent avui?
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
              Excellent
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              Bo
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
              Just
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
              Fluix
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mapa visual */}
        <div className="relative mb-4 h-56 overflow-hidden rounded-xl sm:h-72">
          {/* Fons: Terra (verd) */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-200 via-green-100 to-amber-100"></div>
          
          {/* Platja (sorra) - franja diagonal */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="50%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fcd34d" />
              </linearGradient>
            </defs>
            {/* Franja de platja */}
            <path
              d="M 60 0 Q 55 20, 58 40 Q 62 60, 58 80 Q 55 95, 52 100 L 68 100 Q 72 80, 70 60 Q 68 40, 72 20 Q 75 5, 76 0 Z"
              fill="url(#sandGradient)"
            />
          </svg>
          
          {/* Mar (blau) */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M 68 0 Q 72 20, 70 40 Q 68 60, 72 80 Q 75 95, 72 100 L 100 100 L 100 0 Z"
              fill="url(#seaGradient)"
            />
            {/* Onades */}
            <path
              d="M 70 15 Q 75 12, 80 15 Q 85 18, 90 15"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
              strokeOpacity="0.6"
            />
            <path
              d="M 72 35 Q 77 32, 82 35 Q 87 38, 92 35"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
              strokeOpacity="0.5"
            />
            <path
              d="M 70 55 Q 75 52, 80 55 Q 85 58, 90 55"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
              strokeOpacity="0.6"
            />
            <path
              d="M 73 75 Q 78 72, 83 75 Q 88 78, 93 75"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
              strokeOpacity="0.5"
            />
          </svg>
          
          {/* Etiquetes */}
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-blue-500/80 px-2 py-1 text-[10px] font-medium text-white shadow-sm">
            <Waves className="h-3 w-3" />
            Mar Mediterrani
          </div>
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm">
            <Navigation className="h-3 w-3" />
            Nord
          </div>
          <div className="absolute bottom-3 left-3 rounded-full bg-green-600/80 px-2 py-1 text-[10px] font-medium text-white shadow-sm">
            Sant Pere Pescador
          </div>

          {/* Spots */}
          {summaries.map((s) => {
            const pos = SPOT_POSITIONS[s.spot] || { x: 50, y: 50 }
            const isSelected = s.spot === selectedSpot
            const isBest = s.spot === bestSpot.spot

            return (
              <button
                key={s.spot}
                onClick={() => setSelectedSpot(s.spot)}
                className={`absolute flex flex-col items-center transition-all duration-200 hover:scale-110 hover:z-10 ${
                  isSelected ? "z-10 scale-110" : ""
                }`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
              >
                {/* Cercle principal */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-all sm:h-12 sm:w-12 ${
                    getQualityColor(s.quality)
                  } ${isSelected ? "ring-4 " + getQualityBorder(s.quality) : ""}`}
                >
                  <div className="text-center">
                    <div className="text-xs font-bold text-white sm:text-sm">{s.avgWind}</div>
                    <div className="text-[8px] text-white/80 sm:text-[10px]">kn</div>
                  </div>
                </div>
                {/* Etiqueta */}
                <div
                  className={`mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm sm:text-xs ${
                    isSelected
                      ? "bg-sky-600 text-white"
                      : "bg-white/90 text-slate-700"
                  }`}
                >
                  {s.label}
                  {isBest && !isSelected && (
                    <span className="ml-1 text-amber-500">*</span>
                  )}
                </div>
                {/* Fletxa direccio vent */}
                <div
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm sm:h-6 sm:w-6"
                  style={{ transform: `rotate(${s.avgDirection}deg)` }}
                >
                  <Navigation className="h-3 w-3 text-slate-600 sm:h-4 sm:w-4" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Detalls del spot seleccionat o millor */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getQualityColor(bestSpot.quality)}`}></div>
              <span className="font-semibold text-slate-900">{bestSpot.label}</span>
              <Badge className="bg-amber-500 text-[10px] text-white">Millor avui</Badge>
            </div>
            <div className="text-sm text-slate-600">
              {getWindDirectionName(bestSpot.avgDirection)}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <div className="font-bold text-blue-600">{bestSpot.avgWind} kn</div>
              <div className="text-[10px] text-slate-500">Mitjana</div>
            </div>
            <div>
              <div className="font-bold text-slate-700">{bestSpot.maxWind} kn</div>
              <div className="text-[10px] text-slate-500">Maxim</div>
            </div>
            <div>
              <div className="font-bold text-emerald-600">{bestSpot.rideableHours}h</div>
              <div className="text-[10px] text-slate-500">Navegables</div>
            </div>
            <div>
              <div className="font-bold text-slate-700">{bestSpot.bestWindow}</div>
              <div className="text-[10px] text-slate-500">Millor hora</div>
            </div>
          </div>
        </div>

        {/* Llista compacta dels altres spots */}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {summaries.slice(1).map((s) => {
            const isSelected = s.spot === selectedSpot
            return (
              <button
                key={s.spot}
                onClick={() => setSelectedSpot(s.spot)}
                className={`flex items-center justify-between rounded-lg border p-2 text-left transition-all hover:bg-slate-50 ${
                  isSelected ? "border-sky-400 bg-sky-50" : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${getQualityColor(s.quality)}`}></div>
                  <span className="text-sm font-medium text-slate-700">{s.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-blue-600">{s.avgWind} kn</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">{s.rideableHours}h</span>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
