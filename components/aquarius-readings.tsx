"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Wind, Compass, AlertTriangle } from "lucide-react"

interface AquariusReadings {
  source: string
  timestamp: string | null
  cachedAt: string
  windDirection: number | null
  windSpeedKmh: number | null
  windGustKmh: number | null
  windSpeed: number | null // nusos
  windGust: number | null  // nusos
  assumedMaxKmh: number
  isApproximate: boolean
  note: string
  error?: string
}

function degToCardinal(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  return dirs[Math.round(deg / 22.5) % 16]
}

// Llindars kite (vent estable per a navegar a Sant Pere): ~14 nusos mínim
function verdictColor(knots: number | null): { bg: string; text: string; label: string } {
  if (knots === null) return { bg: "bg-slate-100", text: "text-slate-600", label: "—" }
  if (knots >= 18) return { bg: "bg-emerald-100", text: "text-emerald-800", label: "Bo per kite" }
  if (knots >= 14) return { bg: "bg-lime-100", text: "text-lime-800", label: "Just" }
  if (knots >= 10) return { bg: "bg-amber-100", text: "text-amber-800", label: "Fluix" }
  return { bg: "bg-slate-100", text: "text-slate-600", label: "Insuficient" }
}

export function AquariusReadings() {
  const [data, setData] = useState<AquariusReadings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      const pref = typeof window !== 'undefined' ? localStorage.getItem('preferredWindSource') || 'auto' : 'auto'
      if (pref !== 'aquarius') {
        // Try server /api/current first (prefers Meteocat U2 when available)
        try {
          const cur = await fetch("/api/current")
          if (cur.ok) {
            const curJson = await cur.json()
            const c = curJson.current
            if (c && c.isReal && (curJson.stationCode === "U2" || String(curJson.source || "").includes("Meteocat"))) {
              const mapped: AquariusReadings = {
                source: curJson.source || "Meteocat",
                timestamp: c.lastUpdate ?? new Date().toISOString(),
                cachedAt: new Date().toISOString(),
                windDirection: c.windDirection ?? null,
                windSpeedKmh: c.windSpeed != null ? Math.round((c.windSpeed as number) * 1.852) : null,
                windGustKmh: c.windGust != null ? Math.round((c.windGust as number) * 1.852) : null,
                windSpeed: c.windSpeed ?? null,
                windGust: c.windGust ?? null,
                assumedMaxKmh: 0,
                isApproximate: false,
                note: `Dades Meteocat U2 (${curJson.station || curJson.stationCode})`,
              }
              setData(mapped)
              return
            }
          }
        } catch (e) {
          // ignore and fallback to aquarium
        }
      }

      const res = await fetch("/api/aquarius-readings")
      const json: AquariusReadings = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`)
      setData(json)
    } catch (e: any) {
      setError(e?.message || "Error carregant dades del camping")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60 * 1000)
    const onVisibility = () => {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Lectura de la platja no disponible: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const verdict = verdictColor(data.windSpeed)
  const updated = data.timestamp
    ? new Date(data.timestamp).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })
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
              {data.windSpeed ?? "—"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">nusos</span>
            {data.windSpeedKmh !== null && (
              <span className="text-[10px] text-muted-foreground">{data.windSpeedKmh} km/h</span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30 p-2">
            <span className="text-[10px] text-orange-700 dark:text-orange-300 font-medium uppercase mb-1">Ratxa</span>
            <span className="text-xl sm:text-2xl font-bold leading-none">
              {data.windGust ?? "—"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">nusos</span>
            {data.windGustKmh !== null && (
              <span className="text-[10px] text-muted-foreground">{data.windGustKmh} km/h</span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2">
            <Compass className="h-4 w-4 text-blue-600 mb-1" />
            <span className="text-xl sm:text-2xl font-bold leading-none">
              {data.windDirection !== null ? `${data.windDirection}°` : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {data.windDirection !== null ? degToCardinal(data.windDirection) : "direcció"}
            </span>
          </div>
        </div>

        {data.isApproximate && (
          <p className="mt-2 text-[10px] text-muted-foreground italic">
            Velocitat aprox. extreta del gràfic (escala {data.assumedMaxKmh} km/h). Direcció exacta.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
