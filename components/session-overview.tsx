"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock3, Sparkles, Waves, Wind, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { type ForecastDay, type ForecastHour, getForecastData } from "@/lib/api"
import { useSpotStore } from "@/lib/store"
import { knotsToKmh } from "@/lib/utils"

const MIN_RIDEABLE_WIND = 10
const IDEAL_MIN_WIND = 12
const IDEAL_MAX_WIND = 20

type SummaryTone = "good" | "maybe" | "bad"

type DaySummary = {
  label: string
  tone: SummaryTone
  statusLabel: string
  score: number
  scoreLabel: string
  bestWindow: string
  bestWindowAvg: number
  gustQuality: string
  reason: string
  decisionTitle: string
  decisionText: string
}

function isOffshore(direction: number) {
  return direction >= 315 || direction <= 45
}

function isFavorable(direction: number) {
  return direction >= 15 && direction <= 135
}

function getDayLabel(index: number) {
  if (index === 0) return "Avui"
  if (index === 1) return "Demà"
  if (index === 2) return "Passat demà"
  return `Dia ${index + 1}`
}

function buildDaySummary(day: ForecastDay, index: number): DaySummary | null {
  const hours = day.hours.filter((hour: ForecastHour) => {
    const hourNum = Number.parseInt(hour.time.split(":")[0])
    return hourNum >= 9 && hourNum <= 21
  })

  if (hours.length === 0) {
    return null
  }

  const avgWind = hours.reduce((sum, hour) => sum + hour.windSpeed, 0) / hours.length
  const maxWind = Math.max(...hours.map((hour) => hour.windSpeed))
  const rideableHours = hours.filter((hour) => hour.windSpeed >= MIN_RIDEABLE_WIND)
  const idealHours = hours.filter(
    (hour) => hour.windSpeed >= IDEAL_MIN_WIND && hour.windSpeed <= IDEAL_MAX_WIND && isFavorable(hour.windDirection),
  )
  const offshoreRiskHours = hours.filter((hour) => hour.windSpeed >= MIN_RIDEABLE_WIND && isOffshore(hour.windDirection))
  const gustSpread = hours.reduce((sum, hour) => sum + Math.max(0, (hour.windGust || hour.windSpeed) - hour.windSpeed), 0) / hours.length

  const scoreBase =
    Math.min(40, rideableHours.length * 7) +
    Math.min(35, idealHours.length * 9) +
    Math.max(0, 18 - offshoreRiskHours.length * 8) +
    Math.max(0, 14 - Math.abs(avgWind - 15) * 1.8) -
    Math.max(0, gustSpread - 6) * 2

  const score = Math.max(0, Math.min(100, Math.round(scoreBase)))
  const targetHours = idealHours.length > 0 ? idealHours : rideableHours
  const bestWindow =
    targetHours.length > 0 ? `${targetHours[0].time}–${targetHours[targetHours.length - 1].time}` : "Cap franja clara"
  const bestWindowAvg = targetHours.length > 0
    ? Math.round(targetHours.reduce((s, h) => s + h.windSpeed, 0) / targetHours.length)
    : 0
  const gustQuality = gustSpread <= 3 ? "Molt estable" : gustSpread <= 6 ? "Moderat" : "Ratxejat"

  // "good": enough rideable hours with decent avg wind, not dominated by offshore
  const isGood =
    (idealHours.length >= 3 && offshoreRiskHours.length <= 1) ||
    (rideableHours.length >= 4 && avgWind >= IDEAL_MIN_WIND && offshoreRiskHours.length <= 1)

  // "maybe": some rideable hours but not great
  const isMaybe = rideableHours.length >= 2

  if (isGood) {
    return {
      label: getDayLabel(index),
      tone: "good",
      statusLabel: "Bona per sortir",
      score,
      scoreLabel: "molt bona pinta",
      bestWindow,
      bestWindowAvg,
      gustQuality,
      reason: `Hi ha ${rideableHours.length} hores navegables amb ${Math.round(avgWind)} kn de mitjana.`,
      decisionTitle: "Sí, val la pena anar-hi!",
      decisionText: `La millor finestra és ${bestWindow}, amb vent prou sòlid per a la majoria de kitesurfistes.`,
    }
  }

  if (isMaybe) {
    return {
      label: getDayLabel(index),
      tone: "maybe",
      statusLabel: "Justeta",
      score,
      scoreLabel: "sessió aprofitable però al límit",
      bestWindow,
      bestWindowAvg,
      gustQuality,
      reason: `Hi ha algunes hores per sobre dels ${MIN_RIDEABLE_WIND} kn, però no serà un dia rodó per a tothom.`,
      decisionTitle: "Potser, però serà justeta.",
      decisionText: `Si hi vas, apunta a la franja ${bestWindow} i no esperis una tracció constant tot el dia.`,
    }
  }

  return {
    label: getDayLabel(index),
    tone: "bad",
    statusLabel: "No val la pena",
    score,
    scoreLabel: "massa fluix o irregular",
    bestWindow,
    bestWindowAvg,
    gustQuality,
    reason: `La major part del dia queda per sota dels ${MIN_RIDEABLE_WIND} kn (màxim ${Math.round(maxWind)} kn).`,
    decisionTitle: "No, avui pinta massa fluix.",
    decisionText: `Amb menys de ${MIN_RIDEABLE_WIND} kn costa molt que la cometa treballi bé per a la majoria de riders.`,
  }
}

export function SessionOverview() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<ForecastDay[]>([])

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true)
        const data = await getForecastData(selectedSpot)
        setForecast(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [selectedSpot])

  const daySummaries = useMemo(
    () => forecast.slice(0, 3).map((day, index) => buildDaySummary(day, index)).filter((item): item is DaySummary => item !== null),
    [forecast],
  )

  const summary = daySummaries[0] ?? null

  const toneStyles = {
    good: {
      panel: "border-emerald-200 bg-emerald-50 text-emerald-900",
      badge: "bg-emerald-600 text-white",
      Icon: CheckCircle2,
    },
    maybe: {
      panel: "border-amber-200 bg-amber-50 text-amber-900",
      badge: "bg-amber-500 text-white",
      Icon: AlertTriangle,
    },
    bad: {
      panel: "border-rose-200 bg-rose-50 text-rose-900",
      badge: "bg-rose-600 text-white",
      Icon: XCircle,
    },
  } as const

  const toneConfig = summary ? toneStyles[summary.tone] : toneStyles.bad
  const ToneIcon = toneConfig.Icon

  return (
    <Card className="mb-4 border-sky-100 bg-gradient-to-br from-sky-50 to-white shadow-md transition-all duration-300 hover:shadow-lg sm:mb-6">
      <CardContent className="p-4 animate-in fade-in-50 duration-500 sm:p-6">
        {loading || !summary ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${toneConfig.badge} gap-1`}>
                <Sparkles className="h-3.5 w-3.5" />
                Semàfor de sessió
              </Badge>
              <Badge variant="outline" className="gap-1 bg-white/70">
                <Wind className="h-3.5 w-3.5" />
                Llindar mínim útil: {MIN_RIDEABLE_WIND} kn
              </Badge>
              <Badge variant="outline" className="gap-1 bg-white/70">
                <Waves className="h-3.5 w-3.5" />
                Òptim general: {IDEAL_MIN_WIND}-{IDEAL_MAX_WIND} kn
              </Badge>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {daySummaries.map((day) => {
                const dayTone = toneStyles[day.tone]
                const DayIcon = dayTone.Icon

                return (
                  <div
                    key={day.label}
                    className={`rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${dayTone.panel}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <DayIcon className="h-4 w-4" />
                        <span>{day.label}</span>
                      </div>
                      <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-bold">{day.score}/100</span>
                    </div>
                    <div className="text-lg font-bold">{day.statusLabel}</div>
                    <p className="mt-1 text-sm opacity-90">{day.bestWindow}</p>
                  </div>
                )
              })}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  Puntuació d'avui
                </div>
                <div className="text-3xl font-bold text-slate-900">{summary.score}/100</div>
                <p className="mt-1 text-sm text-slate-600">{summary.scoreLabel}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Clock3 className="h-4 w-4" />
                  Millor franja d'avui
                </div>
                <div className="text-xl font-bold text-slate-900">{summary.bestWindow}</div>
                <p className="mt-1 text-sm text-slate-600">
                  {summary.bestWindowAvg > 0
                    ? `Mitjana ${summary.bestWindowAvg} kn · ${summary.gustQuality}`
                    : "Sense franja clara de vent navegable"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 transition-all duration-300 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-sky-900">
                <Waves className="h-4 w-4" />
                Val la pena anar-hi avui?
              </div>
              <div className="text-lg font-bold text-sky-950">{summary.decisionTitle}</div>
              <p className="mt-1 text-sm text-sky-900">{summary.decisionText}</p>
              <p className="mt-2 text-xs text-sky-700">
                Referència ràpida: {MIN_RIDEABLE_WIND} kn són uns {knotsToKmh(MIN_RIDEABLE_WIND)} km/h.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
