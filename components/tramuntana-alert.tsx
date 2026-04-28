"use client"

import { useEffect, useState } from "react"
import { Wind, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getForecastData } from "@/lib/api"

const SPOT = "sant-pere-pescador"

type Detection = {
  level: "imminent" | "soon" | "later"
  hoursAhead: number
  peakWind: number
  peakTime: string
  startTime: string
} | null

function isTramuntanaDirection(deg: number) {
  // N, NW, NNW: 300-360 + 0-30
  return (deg >= 300 && deg <= 360) || (deg >= 0 && deg <= 30)
}

function detectTramuntana(): Promise<Detection> {
  return getForecastData(SPOT)
    .then((days) => {
      if (!days || days.length === 0) return null

      // Aplanem les pròximes 12h
      const now = new Date()
      const upcoming: Array<{ time: Date; speed: number; gust: number; dir: number }> = []
      for (const day of days) {
        for (const h of day.hours) {
          const t = new Date(h.time)
          const diffH = (t.getTime() - now.getTime()) / (1000 * 60 * 60)
          if (diffH >= 0 && diffH <= 12) {
            upcoming.push({ time: t, speed: h.windSpeed, gust: h.windGust, dir: h.windDirection })
          }
        }
      }
      if (upcoming.length === 0) return null

      // Cerca primera finestra consecutiva de tramuntana ≥20 kn
      const tramuntanaHours = upcoming.filter(
        (u) => isTramuntanaDirection(u.dir) && u.speed >= 20,
      )
      if (tramuntanaHours.length === 0) return null

      const first = tramuntanaHours[0]
      const peak = tramuntanaHours.reduce((a, b) => (b.gust > a.gust ? b : a), first)
      const hoursAhead = Math.max(
        0,
        Math.round((first.time.getTime() - now.getTime()) / (1000 * 60 * 60)),
      )

      let level: NonNullable<Detection>["level"]
      if (hoursAhead <= 2) level = "imminent"
      else if (hoursAhead <= 6) level = "soon"
      else level = "later"

      return {
        level,
        hoursAhead,
        peakWind: Math.round(peak.gust),
        peakTime: peak.time.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" }),
        startTime: first.time.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" }),
      }
    })
    .catch(() => null)
}

export function TramuntanaAlert() {
  const [detection, setDetection] = useState<Detection>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const d = await detectTramuntana()
      if (!cancelled) setDetection(d)
    }
    load()
    const interval = setInterval(load, 15 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (!detection) return null

  const styles = {
    imminent: {
      bg: "from-red-500 to-orange-600",
      ring: "ring-red-300",
      title: `⚠️ Tramuntana entrant ja!`,
    },
    soon: {
      bg: "from-orange-500 to-amber-500",
      ring: "ring-orange-300",
      title: `Tramuntana en ~${detection.hoursAhead}h`,
    },
    later: {
      bg: "from-blue-500 to-sky-600",
      ring: "ring-blue-300",
      title: `Tramuntana prevista en ${detection.hoursAhead}h`,
    },
  }[detection.level]

  return (
    <Card className={`overflow-hidden ring-2 ${styles.ring}`}>
      <CardContent className={`p-3 sm:p-4 bg-gradient-to-r ${styles.bg} text-white`}>
        <div className="flex items-center gap-3">
          {detection.level === "imminent" ? (
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
          ) : (
            <Wind className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
          )}
          <div className="flex-1 min-w-0 text-sm sm:text-base">
            <div className="font-bold leading-tight">{styles.title}</div>
            <div className="opacity-95 text-xs sm:text-sm">
              Inici previst {detection.startTime} · pic {detection.peakWind} kn cap a {detection.peakTime}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
