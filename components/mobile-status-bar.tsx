"use client"

import { useEffect, useState } from "react"
import { useSpotStore } from "@/lib/store"
import { getWindDirectionName } from "@/lib/utils"

interface CurrentResp {
  current: {
    windSpeed: number
    windGust: number
    windDirection: number
    isOffHours?: boolean
  }
}

function decide(
  speed: number,
  gust: number,
  dir: number,
  prefs: { min: number; max: number; allowedDirs: string[] },
  isOffHours: boolean,
): "go" | "maybe" | "no" {
  let blockers = 0
  let warnings = 0
  if (speed < prefs.min) blockers++
  else if (speed < prefs.min + 2) warnings++
  if (speed > prefs.max + 5) blockers++
  else if (speed > prefs.max) warnings++
  if (gust - speed > 12) warnings++
  const dirName = getWindDirectionName(dir)
  if (!prefs.allowedDirs.includes(dirName)) blockers++
  if (isOffHours) blockers++
  if (blockers > 0) return "no"
  if (warnings > 0) return "maybe"
  return "go"
}

export function MobileStatusBar() {
  const { userPreferences } = useSpotStore()
  const [data, setData] = useState<CurrentResp["current"] | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const r = await fetch("/api/current")
        if (!r.ok) return
        const json: CurrentResp = await r.json()
        if (!cancelled) setData(json.current)
      } catch {
        // silent
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (!data) return null

  const verdict = decide(
    Math.round(data.windSpeed),
    Math.round(data.windGust),
    data.windDirection,
    {
      min: userPreferences.windSpeed?.min ?? 12,
      max: userPreferences.windSpeed?.max ?? 22,
      allowedDirs: userPreferences.windDirection ?? ["E", "SE", "NE", "N"],
    },
    !!data.isOffHours,
  )

  const styles = {
    go: { bg: "bg-green-600", emoji: "🟢", label: "Vés-hi" },
    maybe: { bg: "bg-amber-500", emoji: "🟡", label: "Amb cura" },
    no: { bg: "bg-red-600", emoji: "🔴", label: "Espera" },
  }[verdict]

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 ${styles.bg} pb-safe text-white shadow-2xl sm:hidden`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      role="button"
      aria-label="Veure verdict complet"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{styles.emoji}</span>
          <span className="text-sm font-semibold">{styles.label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold">{Math.round(data.windSpeed)} kn</span>
          <span className="opacity-90">↑{Math.round(data.windGust)}</span>
          <span className="font-medium">{getWindDirectionName(data.windDirection)}</span>
        </div>
      </div>
    </div>
  )
}
