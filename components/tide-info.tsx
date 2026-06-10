"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Waves, ArrowUp, ArrowDown, Clock, Sunrise, Sunset } from "lucide-react"

const TIDE_CYCLE = 745 // 12h 25min en minuts

interface TideData {
  currentLevel: "alta" | "baixa" | "pujant" | "baixant"
  currentHeight: number
  nextHighTide: string
  nextLowTide: string
  tidePercent: number
}

interface TideDay {
  dayLabel: string
  highTides: string[]
  lowTides: string[]
}

function calculateAllTides(): { current: TideData; days: TideDay[] } {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const currentPhase = nowMinutes % TIDE_CYCLE

  const tidePercent = Math.round(50 + 50 * Math.sin((currentPhase / TIDE_CYCLE) * 2 * Math.PI))
  const currentHeight = 0.1 + (tidePercent / 100) * 0.2

  let currentLevel: TideData["currentLevel"]
  if (tidePercent > 85) currentLevel = "alta"
  else if (tidePercent < 15) currentLevel = "baixa"
  else if (currentPhase < TIDE_CYCLE / 2) currentLevel = "pujant"
  else currentLevel = "baixant"

  const toNextHigh = ((TIDE_CYCLE / 4 - currentPhase) % TIDE_CYCLE + TIDE_CYCLE) % TIDE_CYCLE
  const toNextLow = ((3 * TIDE_CYCLE / 4 - currentPhase) % TIDE_CYCLE + TIDE_CYCLE) % TIDE_CYCLE

  const nextHighTime = new Date(now.getTime() + toNextHigh * 60000)
  const nextLowTime = new Date(now.getTime() + toNextLow * 60000)

  // Previsió 7 dies
  const days: TideDay[] = []
  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(now)
    day.setDate(day.getDate() + offset)
    day.setHours(0, 0, 0, 0)

    const dayLabel =
      offset === 0 ? "Avui" :
      offset === 1 ? "Demà" :
      offset === 2 ? "Passat demà" :
      `${day.getDate()}/${day.getMonth() + 1}`

    const diffMs = day.getTime() - now.getTime()
    const diffMin = diffMs / 60000
    const midnightPhase = ((currentPhase + diffMin) % TIDE_CYCLE + TIDE_CYCLE) % TIDE_CYCLE

    const highTides: string[] = []
    const lowTides: string[] = []
    for (let n = 0; n < 4; n++) {
      const hp = TIDE_CYCLE / 4 + n * TIDE_CYCLE
      if (hp >= midnightPhase && hp <= midnightPhase + 1440) {
        const m = hp - midnightPhase
        const hh = Math.floor(m / 60)
        const mm = Math.round(m % 60)
        if (hh >= 0 && hh < 24) highTides.push(`${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`)
      }
      const lp = 3 * TIDE_CYCLE / 4 + n * TIDE_CYCLE
      if (lp >= midnightPhase && lp <= midnightPhase + 1440) {
        const m = lp - midnightPhase
        const hh = Math.floor(m / 60)
        const mm = Math.round(m % 60)
        if (hh >= 0 && hh < 24) lowTides.push(`${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`)
      }
      if (hp > midnightPhase + 1440 && lp > midnightPhase + 1440) break
    }
    days.push({ dayLabel, highTides: highTides.slice(0, 2), lowTides: lowTides.slice(0, 2) })
  }

  return {
    current: {
      currentLevel,
      currentHeight: Math.round(currentHeight * 100) / 100,
      nextHighTide: `${nextHighTime.getHours().toString().padStart(2, '0')}:${nextHighTime.getMinutes().toString().padStart(2, '0')}`,
      nextLowTide: `${nextLowTime.getHours().toString().padStart(2, '0')}:${nextLowTime.getMinutes().toString().padStart(2, '0')}`,
      tidePercent,
    },
    days,
  }
}

const levelLabels: Record<string, string> = {
  alta: "Marea alta",
  baixa: "Marea baixa",
  pujant: "Marea pujant",
  baixant: "Marea baixant",
}

const levelColors: Record<string, string> = {
  alta: "text-blue-600 bg-blue-50",
  baixa: "text-amber-600 bg-amber-50",
  pujant: "text-cyan-600 bg-cyan-50",
  baixant: "text-slate-600 bg-slate-50",
}

export function TideInfo() {
  const [data, setData] = useState<{ current: TideData; days: TideDay[] } | null>(null)

  useEffect(() => {
    setData(calculateAllTides())
    const interval = setInterval(() => setData(calculateAllTides()), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!data) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-20 animate-pulse rounded bg-slate-100" />
        </CardContent>
      </Card>
    )
  }

  const tideData = data.current
  const LevelIcon = tideData.currentLevel === "pujant" || tideData.currentLevel === "alta" ? ArrowUp : ArrowDown

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Waves className="h-4 w-4 text-blue-500" />
          Marees
        </CardTitle>
        <CardDescription className="text-xs">
          Mediterrània · Variació petita (20-30 cm)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Estat actual */}
        <div className={`flex items-center justify-between rounded-lg p-3 ${levelColors[tideData.currentLevel]}`}>
          <div className="flex items-center gap-2">
            <LevelIcon className="h-5 w-5" />
            <span className="font-medium">{levelLabels[tideData.currentLevel]}</span>
          </div>
          <span className="text-sm font-semibold">{tideData.currentHeight} m</span>
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
            style={{ width: `${tideData.tidePercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 p-2">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <div>
              <div className="text-slate-500">Propera alta</div>
              <div className="font-medium">{tideData.nextHighTide}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 p-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <div>
              <div className="text-slate-500">Propera baixa</div>
              <div className="font-medium">{tideData.nextLowTide}</div>
            </div>
          </div>
        </div>

        {/* Previsió 7 dies */}
        <div className="pt-2">
          <h4 className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Previsió 7 dies</h4>
          <div className="divide-y rounded-lg border text-xs">
            {data.days.map((day) => (
              <div key={day.dayLabel} className="grid grid-cols-3 items-center gap-2 px-3 py-2 hover:bg-slate-50">
                <div className="font-medium text-slate-700">{day.dayLabel}</div>
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Sunrise className="h-3 w-3" />
                  <span>{day.highTides.join(", ") || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Sunset className="h-3 w-3" />
                  <span>{day.lowTides.join(", ") || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-slate-400">
          A Sant Pere les marees tenen poc impacte, però amb marea baixa hi ha més zona de sorra.
        </p>
      </CardContent>
    </Card>
  )
}
