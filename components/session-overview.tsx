"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock3, Share2, Sparkles, Waves, Wind, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { type ForecastDay, type ForecastHour, getForecastData } from "@/lib/api"
import { knotsToKmh } from "@/lib/utils"

const SPOT = "sant-pere-pescador"

// Llindars de vent en nusos (5 categories)
// Molt fluix:      < 10 kn  → no apte (platja)
// Fluix:           10-12 kn → poc vent, aprenentatge bàsic
// Bo:              13-17 kn → ideal principiants
// Molt bo:         18-22 kn → vent fort, experiència
// Extremadament bo: ≥ 23 kn → només experts
const FLUIX_MAX = 10           // < 10 kn → fluix
const MOLT_FLUIX_MAX = 13      // 10-12 kn → molt fluix
const BUENO_MAX = 18           // 13-17 kn → bo
const MOLT_BO_MAX = 23         // 18-22 kn → molt bo
                               // ≥ 23 kn → extremadament bo

// Compatibilitat amb la resta del càlcul
const MIN_JUSTETA_WIND = MOLT_FLUIX_MAX // 13 kn (a partir d'aquí ja navegues bé)
const MIN_GOOD_WIND = BUENO_MAX         // 18 kn (vent fort)

type SummaryTone = "fluix" | "moltFluix" | "bueno" | "moltBo" | "extrem"

function classifyWind(windKn: number): { tone: SummaryTone; statusLabel: string } {
  if (windKn < FLUIX_MAX) return { tone: "moltFluix", statusLabel: "Molt fluix" }
  if (windKn < MOLT_FLUIX_MAX) return { tone: "fluix", statusLabel: "Fluix" }
  if (windKn < BUENO_MAX) return { tone: "bueno", statusLabel: "Bo" }
  if (windKn < MOLT_BO_MAX) return { tone: "moltBo", statusLabel: "Molt bo" }
  return { tone: "extrem", statusLabel: "Extremadament bo" }
}

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

// Offshore per Sant Pere Pescador: vents de terra cap a mar
// Tramuntana (N), Mestral (NW), Ponent (W), i part de Llebeig (SW)
function isOffshore(direction: number) {
  // N: 315-360° i 0-45°
  // NW (Mestral): 292.5-337.5°
  // W (Ponent): 247.5-292.5°
  // SW (Llebeig/Garbí): 202.5-247.5°
  return direction >= 202.5 || direction <= 45
}

// Detectar el nom del vent offshore
function getOffshoreWindName(direction: number): string {
  if (direction >= 337.5 || direction < 22.5) return "Tramuntana"
  if (direction >= 22.5 && direction < 45) return "Gregal"
  if (direction >= 292.5 && direction < 337.5) return "Mestral"
  if (direction >= 247.5 && direction < 292.5) return "Ponent"
  if (direction >= 202.5 && direction < 247.5) return "Garbí"
  return "offshore"
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

// Calcula el vent efectiu: mitjana entre vent sostingut i ràfegues
// Això representa millor el que realment notes quan fas kite
function getEffectiveWind(hour: ForecastHour): number {
  const gust = hour.windGust || hour.windSpeed
  // Ponderat: 60% vent sostingut + 40% ràfegues (el vent sostingut és més representatiu)
  return hour.windSpeed * 0.6 + gust * 0.4
}

function buildDaySummary(day: ForecastDay, index: number): DaySummary | null {
  const hours = day.hours.filter((hour: ForecastHour) => {
    const hourNum = Number.parseInt(hour.time.split(":")[0])
    return hourNum >= 9 && hourNum <= 21
  })

  if (hours.length === 0) {
    return null
  }

  // Utilitzem el vent efectiu (mitjana vent/ràfegues) per als càlculs
  const avgEffectiveWind = hours.reduce((sum, hour) => sum + getEffectiveWind(hour), 0) / hours.length
  const maxEffectiveWind = Math.max(...hours.map((hour) => getEffectiveWind(hour)))
  
  // Hores amb vent suficient per navegar
  const goodWindHours = hours.filter((hour) => getEffectiveWind(hour) >= MIN_GOOD_WIND) // 18+ kn (Molt bo / Extrem)
  const justejaWindHours = hours.filter((hour) => getEffectiveWind(hour) >= MIN_JUSTETA_WIND && getEffectiveWind(hour) < MIN_GOOD_WIND) // 13-17 kn (Bo)
  const navigableHours = hours.filter((hour) => getEffectiveWind(hour) >= MIN_JUSTETA_WIND) // 13+ kn
  
  const offshoreRiskHours = hours.filter((hour) => getEffectiveWind(hour) >= MIN_JUSTETA_WIND && isOffshore(hour.windDirection))
  const gustSpread = hours.reduce((sum, hour) => sum + Math.max(0, (hour.windGust || hour.windSpeed) - hour.windSpeed), 0) / hours.length

  // Puntuació basada directament en vent efectiu
  const scoreBase =
    Math.min(50, goodWindHours.length * 10) +        // Hores amb 18+ kn (màx 50 punts)
    Math.min(25, justejaWindHours.length * 5) +      // Hores amb 13-17 kn (màx 25 punts)
    Math.min(25, Math.max(0, avgEffectiveWind - 10) * 2.5) - // Bonus per mitjana alta
    Math.max(0, gustSpread - 6) * 2                  // Penalització per ràfegues irregulars

  const score = Math.max(0, Math.min(100, Math.round(scoreBase)))
  const targetHours = goodWindHours.length > 0 ? goodWindHours : navigableHours
  const bestWindow =
    targetHours.length > 0 ? `${targetHours[0].time}–${targetHours[targetHours.length - 1].time}` : "Cap franja clara"
  const bestWindowAvg = targetHours.length > 0
    ? Math.round(targetHours.reduce((s, h) => s + h.windSpeed, 0) / targetHours.length)
    : 0
  const gustQuality = gustSpread <= 3 ? "Molt estable" : gustSpread <= 6 ? "Moderat" : "Ratxejat"

  // Detectar si és un dia de vent offshore (tramuntana, garbí, mestral, ponent)
  const isOffshoreDay = offshoreRiskHours.length >= 3 && avgEffectiveWind >= MIN_JUSTETA_WIND
  const hasStrongGusts = gustSpread > 4
  // Trobar el vent offshore predominant
  const offshoreWindName = offshoreRiskHours.length > 0 
    ? getOffshoreWindName(offshoreRiskHours[0].windDirection)
    : "offshore"

  // LÒGICA basada en vent efectiu (5 categories):
  //  Fluix            < 10 kn   → no apte
  //  Molt fluix       10-12 kn  → poc vent, aprenentatge
  //  Bo               13-17 kn  → ideal principiants
  //  Molt bo          18-22 kn  → vent fort, experiència
  //  Extremadament bo ≥ 23 kn   → només experts
  const avgRounded = Math.round(avgEffectiveWind)
  const { tone, statusLabel } = classifyWind(avgRounded)
  const label = getDayLabel(index)
  const scoreLabel = `${avgRounded} kn de mitjana`
  const baseSummary = { label, score, scoreLabel, bestWindow, bestWindowAvg, gustQuality }

  // Avís offshore (només té sentit quan es pot navegar)
  const offshoreWarning =
    isOffshoreDay && (tone === "bueno" || tone === "moltBo" || tone === "extrem")
      ? `Vent offshore (${offshoreWindName})${hasStrongGusts ? " amb ràfegues fortes" : ""}. No naveguis sol i tingues precaució.`
      : ""

  switch (tone) {
    case "moltFluix":
      return {
        ...baseSummary,
        tone,
        statusLabel,
        reason: `Mitjana de ${avgRounded} kn, per sota dels 10 kn.`,
        decisionTitle: "No és ideal.",
        decisionText: `Menys de 10 kn: no és ideal per kitesurf. Pots aprofitar per fer sol i gaudir de la platja. Màxim previst: ${Math.round(maxEffectiveWind)} kn.`,
      }
    case "fluix":
      return {
        ...baseSummary,
        tone,
        statusLabel,
        reason: `Mitjana de ${avgRounded} kn (entre 10-12 kn).`,
        decisionTitle: "Just, només per aprendre.",
        decisionText: `Poc vent (10-12 kn): pot servir per girs suaus o aprenentatge bàsic de kitesurf. Millor franja: ${bestWindow}.`,
      }
    case "bueno":
      return {
        ...baseSummary,
        tone,
        statusLabel,
        reason: `Mitjana de ${avgRounded} kn (13-17 kn) — ideal principiants.`,
        decisionTitle: offshoreWarning ? `Bon vent, però alerta: ${offshoreWindName}!` : "Sí, val la pena!",
        decisionText: offshoreWarning || `Vent moderat (13-17 kn), ideal per practicar tècniques bàsiques del kitesurf. Millor franja: ${bestWindow}.`,
      }
    case "moltBo":
      return {
        ...baseSummary,
        tone,
        statusLabel,
        reason: `Mitjana de ${avgRounded} kn (18-22 kn) — vent fort.`,
        decisionTitle: offshoreWarning ? `Molt bon vent, alerta: ${offshoreWindName}!` : "Sí, sessió forta!",
        decisionText: offshoreWarning || `Vent fort (18-22 kn): requereix experiència. Millor franja: ${bestWindow}.`,
      }
    case "extrem":
    default:
      return {
        ...baseSummary,
        tone: "extrem",
        statusLabel,
        reason: `Mitjana de ${avgRounded} kn (≥ 23 kn) — vent intens.`,
        decisionTitle: offshoreWarning ? `Vent extrem + ${offshoreWindName}!` : "Només per experts.",
        decisionText: offshoreWarning || `Vent intens (≥ 23 kn): només adequat per experts amb molta experiència. Màxim previst: ${Math.round(maxEffectiveWind)} kn.`,
      }
  }
}

export function SessionOverview() {
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<ForecastDay[]>([])

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true)
        const data = await getForecastData(SPOT)
        setForecast(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [])

  const daySummaries = useMemo(
    () => forecast.slice(0, 7).map((day, index) => buildDaySummary(day, index)).filter((item): item is DaySummary => item !== null),
    [forecast],
  )

  const summary = daySummaries[0] ?? null

  const toneStyles = {
    fluix: {
      panel: "border-rose-200 bg-rose-50 text-rose-900",
      badge: "bg-rose-600 text-white",
      Icon: XCircle,
    },
    moltFluix: {
      panel: "border-amber-200 bg-amber-50 text-amber-900",
      badge: "bg-amber-500 text-white",
      Icon: AlertTriangle,
    },
    bueno: {
      panel: "border-emerald-200 bg-emerald-50 text-emerald-900",
      badge: "bg-emerald-600 text-white",
      Icon: CheckCircle2,
    },
    moltBo: {
      panel: "border-green-300 bg-green-100 text-green-900",
      badge: "bg-green-700 text-white",
      Icon: CheckCircle2,
    },
    extrem: {
      panel: "border-violet-300 bg-violet-100 text-violet-900",
      badge: "bg-violet-700 text-white",
      Icon: AlertTriangle,
    },
  } as const

  const toneConfig = summary ? toneStyles[summary.tone] : toneStyles.fluix
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
                Bo: 13-17 kn
              </Badge>
              <Badge variant="outline" className="gap-1 bg-white/70">
                <Waves className="h-3.5 w-3.5" />
                Molt bo: 18-22 kn · Extrem ≥ 23 kn
              </Badge>
            </div>

            {/* Versió mòbil: scroll horitzontal amb 3 dies visibles */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:hidden">
              {daySummaries.map((day, idx) => {
                const dayTone = toneStyles[day.tone]
                const DayIcon = dayTone.Icon
                const shortLabel = idx === 0 ? "Avui" : idx === 1 ? "Demà" : `D${idx + 1}`
                // Obtenir el dia de la setmana
                const dayOfWeek = new Date(Date.now() + idx * 24 * 60 * 60 * 1000).toLocaleDateString('ca-ES', { weekday: 'short' })

                return (
                  <div
                    key={day.label}
                    className={`min-w-[100px] flex-shrink-0 rounded-xl border p-2.5 text-center transition-all duration-300 ${dayTone.panel}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <DayIcon className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">{dayOfWeek}</span>
                    </div>
                    <div className="mt-1 text-lg font-bold">{day.statusLabel}</div>
                    <div className="text-xs opacity-80">{day.scoreLabel}</div>
                  </div>
                )
              })}
            </div>
            
            {/* Versió tablet/desktop: graella */}
            <div className="hidden sm:grid sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
              {daySummaries.map((day) => {
                const dayTone = toneStyles[day.tone]
                const DayIcon = dayTone.Icon

                return (
                  <div
                    key={day.label}
                    className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${dayTone.panel}`}
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
                Referència: 13 kn = {knotsToKmh(13)} km/h | 18 kn = {knotsToKmh(18)} km/h | 23 kn = {knotsToKmh(23)} km/h
              </p>
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-100 px-4 py-3 text-sm font-medium text-sky-700 transition hover:bg-sky-200"
              onClick={() => {
                const text = `🪁 ${summary.label} a Sant Pere Pescador\n` +
                  `${summary.statusLabel} (${summary.score}/100)\n` +
                  `Millor franja: ${summary.bestWindow}` +
                  (summary.bestWindowAvg > 0 ? ` · ${summary.bestWindowAvg} kn · ${summary.gustQuality}` : '') +
                  `\n${summary.decisionTitle}\n\nels-vents-de-sant-pere-pescador.netlify.app`
                if (navigator.share) {
                  navigator.share({ title: "El Vent — Sessió", text }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(text).then(() => {
                    alert("Copiat al portapapers!")
                  }).catch(() => {})
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              Compartir sessió
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
