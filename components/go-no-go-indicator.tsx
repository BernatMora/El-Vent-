"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpotStore } from "@/lib/store"
import { getWindDirectionName } from "@/lib/utils"

interface CurrentResp {
  current: {
    windSpeed: number
    windGust: number
    windDirection: number
    isReal?: boolean
    isOffHours?: boolean
  }
}

type Verdict = {
  level: "go" | "maybe" | "no"
  title: string
  reasons: string[]
}

function evaluateConditions(
  windSpeed: number,
  windGust: number,
  windDir: number,
  prefs: { min: number; max: number; allowedDirs: string[] },
  isOffHours: boolean,
): Verdict {
  const reasons: string[] = []
  let blockers = 0
  let warnings = 0

  // Vent mínim
  if (windSpeed < prefs.min) {
    blockers++
    reasons.push(`Vent fluix (${windSpeed} kn < ${prefs.min} kn)`)
  } else if (windSpeed < prefs.min + 2) {
    warnings++
    reasons.push(`Vent just per anar (${windSpeed} kn)`)
  } else {
    reasons.push(`Vent ${windSpeed} kn ✓`)
  }

  // Vent màxim
  if (windSpeed > prefs.max + 5) {
    blockers++
    reasons.push(`Massa vent (${windSpeed} kn > ${prefs.max + 5} kn)`)
  } else if (windSpeed > prefs.max) {
    warnings++
    reasons.push(`Vent fort (${windSpeed} kn)`)
  }

  // Ràfegues vs vent (si la diferència és > 10 kn = vent inestable)
  if (windGust - windSpeed > 12) {
    warnings++
    reasons.push(`Ràfegues fortes (+${windGust - windSpeed} kn)`)
  }

  // Direcció
  const dirName = getWindDirectionName(windDir)
  if (!prefs.allowedDirs.includes(dirName)) {
    blockers++
    reasons.push(`Direcció dolenta (${dirName})`)
  } else {
    reasons.push(`Direcció ${dirName} ✓`)
  }

  // Hora
  if (isOffHours) {
    blockers++
    reasons.push(`Fora d'horari diürn`)
  }

  if (blockers > 0) {
    return { level: "no", title: "No és el moment", reasons }
  }
  if (warnings > 0) {
    return { level: "maybe", title: "Es pot, però amb cura", reasons }
  }
  return { level: "go", title: "ARA SÍ! Vés-hi", reasons }
}

export function GoNoGoIndicator() {
  const { userPreferences } = useSpotStore()
  const [data, setData] = useState<CurrentResp["current"] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch("/api/current")
        if (!r.ok) return
        const json: CurrentResp = await r.json()
        if (!cancelled) setData(json.current)
      } catch {
        // silently
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }
  if (!data) return null

  const verdict = evaluateConditions(
    Math.round(data.windSpeed),
    Math.round(data.windGust),
    data.windDirection,
    {
      min: userPreferences.windSpeed?.min ?? 12,
      max: userPreferences.windSpeed?.max ?? 22,
      allowedDirs: userPreferences.windDirection ?? ["E", "SE", "NE"],
    },
    !!data.isOffHours,
  )

  const styles = {
    go: {
      bg: "from-green-500 to-emerald-600",
      ring: "ring-green-300",
      emoji: "🟢",
    },
    maybe: {
      bg: "from-amber-400 to-orange-500",
      ring: "ring-amber-300",
      emoji: "🟡",
    },
    no: {
      bg: "from-red-500 to-rose-600",
      ring: "ring-red-300",
      emoji: "🔴",
    },
  }[verdict.level]

  return (
    <Card className={`overflow-hidden ring-2 ${styles.ring}`}>
      <CardContent className={`p-3 sm:p-6 bg-gradient-to-br ${styles.bg} text-white`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-5xl sm:text-6xl drop-shadow-lg">{styles.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider opacity-90 sm:text-xs">Puc anar a navegar?</div>
            <div className="text-2xl font-bold leading-tight sm:text-3xl">{verdict.title}</div>
          </div>
        </div>
        {/* Resum dades vitals — gran al mòbil */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white/15 p-2 backdrop-blur-sm sm:mt-4 sm:p-3">
          <div className="text-center">
            <div className="text-[10px] uppercase opacity-80 sm:text-xs">Vent</div>
            <div className="text-base font-bold sm:text-xl">{Math.round(data.windSpeed)}<span className="text-[10px] sm:text-xs"> kn</span></div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase opacity-80 sm:text-xs">Ràfega</div>
            <div className="text-base font-bold sm:text-xl">{Math.round(data.windGust)}<span className="text-[10px] sm:text-xs"> kn</span></div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase opacity-80 sm:text-xs">Direcció</div>
            <div className="text-base font-bold sm:text-xl">{getWindDirectionName(data.windDirection)}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-95 sm:text-sm">
          {verdict.reasons.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
