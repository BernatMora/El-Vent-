"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Wind, AlertTriangle } from "lucide-react"
import { useCurrentReadings, type StationReading } from "@/hooks/use-current-readings"

interface AquariusFallback {
  windSpeed: number | null
  windGust: number | null
  windDirection: number | null
  windSpeedKmh: number | null
  windGustKmh: number | null
  timestamp: string | null
  isApproximate: boolean
  assumedMaxKmh: number
}

function degToCardinal(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  return dirs[Math.round(deg / 22.5) % 16]
}

function verdictColor(knots: number | null): { bg: string; text: string; label: string } {
  if (knots === null) return { bg: "bg-slate-100", text: "text-slate-600", label: "—" }
  if (knots >= 18) return { bg: "bg-emerald-100", text: "text-emerald-800", label: "Bo per kite" }
  if (knots >= 14) return { bg: "bg-lime-100", text: "text-lime-800", label: "Just" }
  if (knots >= 10) return { bg: "bg-amber-100", text: "text-amber-800", label: "Fluix" }
  return { bg: "bg-slate-100", text: "text-slate-600", label: "Insuficient" }
}

function WindArrow({ direction }: { direction: number }) {
  const rotationDegree = (direction + 180) % 360
  return (
    <svg
      width="48"
      height="48"
      className="sm:w-14 sm:h-14"
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: `rotate(${rotationDegree}deg)`, transition: "transform 0.5s ease" }}
    >
      <circle cx="12" cy="12" r="11" stroke="#3b82f6" strokeWidth="1" fill="white" />
      <path
        d="M12 4L8 20L12 16.5L16 20L12 4Z"
        fill="#3b82f6"
        stroke="#2563eb"
        strokeWidth="0.5"
      />
      <circle cx="12" cy="12" r="1.5" fill="white" />
    </svg>
  )
}

export function AquariusReadings() {
  const { data: meteocat, loading: meteocatLoading, error: meteocatErr } = useCurrentReadings()
  const [fallback, setFallback] = useState<AquariusFallback | null>(null)
  const [fallbackLoading, setFallbackLoading] = useState(false)
  const [fallbackError, setFallbackError] = useState<string | null>(null)

  useEffect(() => {
    if (meteocat !== null || meteocatLoading) return
    if (meteocatErr) {
      setFallbackError(meteocatErr)
      return
    }
    setFallbackLoading(true)
    fetch("/api/aquarius-readings")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setFallback({
          windSpeed: json.windSpeed ?? null,
          windGust: json.windGust ?? null,
          windDirection: json.windDirection ?? null,
          windSpeedKmh: json.windSpeedKmh ?? null,
          windGustKmh: json.windGustKmh ?? null,
          timestamp: json.timestamp ?? null,
          isApproximate: json.isApproximate ?? true,
          assumedMaxKmh: json.assumedMaxKmh ?? 0,
        })
      })
      .catch((e) => setFallbackError(e.message))
      .finally(() => setFallbackLoading(false))
  }, [meteocat, meteocatLoading, meteocatErr])

  const loading = meteocatLoading || fallbackLoading
  const sourceData: StationReading | AquariusFallback | null = meteocat ?? fallback

  if (loading && !sourceData) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (fallbackError && !sourceData) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Lectura de la platja no disponible: {fallbackError}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sourceData) return null

  const verdict = verdictColor(sourceData.windSpeed)
  const updated = sourceData.timestamp
    ? new Date(sourceData.timestamp).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold">A la platja ara</span>
            <span className="text-[11px] text-muted-foreground">
              {updated ? `Actualitzat ${updated}` : "Lectura en directe"}
            </span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${verdict.bg} ${verdict.text}`}>
            {verdict.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
            <Wind className="h-4 w-4 text-slate-500 mb-1" />
            <span className="text-xl sm:text-2xl font-bold leading-none">
              {sourceData.windSpeed ?? "—"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">nusos</span>
            {sourceData.windSpeedKmh !== null && (
              <span className="text-[10px] text-muted-foreground">{sourceData.windSpeedKmh} km/h</span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30 p-2">
            <span className="text-[10px] text-orange-700 dark:text-orange-300 font-medium uppercase mb-1">Ratxa</span>
            <span className="text-xl sm:text-2xl font-bold leading-none">
              {sourceData.windGust ?? "—"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">nusos</span>
            {sourceData.windGustKmh !== null && (
              <span className="text-[10px] text-muted-foreground">{sourceData.windGustKmh} km/h</span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2">
            {sourceData.windDirection !== null ? (
              <WindArrow direction={sourceData.windDirection} />
            ) : (
              <Wind className="h-4 w-4 text-slate-500" />
            )}
            <div className="mt-1 text-center">
              <div className="text-xs font-bold leading-tight">
                {sourceData.windDirection !== null ? degToCardinal(sourceData.windDirection) : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {sourceData.windDirection !== null ? `${sourceData.windDirection}°` : "direcció"}
              </div>
            </div>
          </div>
        </div>

        {"isApproximate" in sourceData && sourceData.isApproximate && (
          <p className="mt-2 text-[10px] text-muted-foreground italic">
            Velocitat aprox. extreta del gràfic (escala {(sourceData as AquariusFallback).assumedMaxKmh} km/h). Direcció exacta.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
