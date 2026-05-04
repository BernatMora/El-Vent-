"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ForecastDay, type ForecastHour, getForecastData } from "@/lib/api"
import { formatDate, getWindDirectionName, getShoreType } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle2, ChevronDown, ChevronUp, CloudRain, RefreshCw } from "lucide-react"

const SPOT = "sant-pere-pescador"

// Colors per qualitat de vent (nusos), no per confiança del model
function windDot(kn: number) {
  if (kn >= 18) return "bg-green-500"
  if (kn >= 13) return "bg-lime-400"
  if (kn >= 10) return "bg-amber-400"
  return "bg-rose-500"
}

function windRowBg(kn: number) {
  if (kn >= 18) return "bg-emerald-50 hover:bg-emerald-100"
  if (kn >= 13) return "bg-lime-50 hover:bg-lime-100"
  if (kn >= 10) return "bg-amber-50 hover:bg-amber-100"
  return "bg-rose-50 hover:bg-rose-100"
}

function windText(kn: number) {
  if (kn >= 18) return "text-emerald-700"
  if (kn >= 13) return "text-lime-700"
  if (kn >= 10) return "text-amber-700"
  return "text-rose-700"
}

export function WindForecast() {
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedDay, setExpandedDay] = useState(0)

  const loadForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getForecastData(SPOT)
      if (!data || data.length === 0) {
        setError("No s'han pogut carregar les dades de previsió")
        return
      }
      setForecast(data)
    } catch (err) {
      console.error("Error carregant la previsió:", err)
      setError("No s'han pogut carregar les dades ara mateix.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForecast()
  }, [])

  const hasSimulatedData = forecast.some((day) =>
    day.hours?.some((hour: ForecastHour) => hour.source?.includes("Simulat")),
  )

  const renderWindArrow = (direction: number) => {
    const rotationDegree = (direction + 180) % 360
    return (
      <div className="flex items-center justify-center">
        <svg
          width="16"
          height="16"
          className="sm:w-5 sm:h-5"
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: `rotate(${rotationDegree}deg)` }}
        >
          <path
            d="M12 4L4 20L12 17L20 20L12 4Z"
            fill="#3b82f6"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Brain className="h-5 w-5 text-purple-600" />
          Previsió avançada del vent
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Estimació combinant múltiples fonts, calibració local i observacions recents
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadForecast}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Torna-ho a provar
            </Button>
          </div>
        ) : forecast && forecast.length > 0 ? (
          <>
            {hasSimulatedData && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="font-medium">Mode de continuïtat actiu</div>
                <div className="text-xs text-amber-800 sm:text-sm">
                  Algunes franges es mostren amb dades simulades o guardades localment perquè la connexió o la font en temps real no està disponible.
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {forecast.map((day, dayIndex) => {
                const hours = (day.hours ?? []).filter((h: ForecastHour) => {
                  const n = parseInt(h.time.split(":")[0])
                  return n >= 9 && n <= 21
                })
                const maxKn = hours.length
                  ? Math.max(...hours.map((h) => Math.round(h.windSpeed)))
                  : 0
                const isOpen = expandedDay === dayIndex
                const dayLabel =
                  dayIndex === 0 ? "Avui" :
                  dayIndex === 1 ? "Demà" :
                  formatDate(day.date).split(",")[0]

                return (
                  <div key={day.date} className="overflow-hidden rounded-xl border">
                    {/* Capçalera del dia — sempre visible */}
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${windRowBg(maxKn)}`}
                      onClick={() => setExpandedDay(isOpen ? -1 : dayIndex)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${windDot(maxKn)}`} />
                        <span className="font-semibold text-sm text-slate-800">{dayLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end leading-none">
                          <span className={`text-sm font-bold ${windText(maxKn)}`}>{maxKn} kn</span>
                          <span className="text-[10px] text-slate-400">màx</span>
                        </div>
                        {isOpen
                          ? <ChevronUp className="h-4 w-4 text-slate-400" />
                          : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </button>

                    {/* Taula horària — visible quan expandit */}
                    {isOpen && (
                      <div className="p-2 space-y-1">
                        {/* Capçalera de columnes */}
                        <div className="grid grid-cols-5 sm:grid-cols-7 gap-1 rounded-md bg-gradient-to-r from-blue-50 to-cyan-50 px-2 py-1.5 text-center text-[10px] sm:text-sm font-medium text-blue-900">
                          <div>Hora</div>
                          <div>Vent</div>
                          <div>Dir.</div>
                          <div>Raf.</div>
                          <div className="hidden sm:block">Shore</div>
                          <div className="hidden sm:block">Temp</div>
                          <div className="hidden sm:block">Pluja</div>
                        </div>

                        {hours.length > 0 ? (
                          hours.map((hour: ForecastHour) => {
                            const kn = Math.round(hour.windSpeed)
                            return (
                              <div
                                key={hour.time}
                                className="grid grid-cols-5 sm:grid-cols-7 items-center gap-1 sm:gap-2 rounded-md border px-1.5 py-1 sm:p-2 text-center text-[10px] sm:text-sm hover:bg-gray-50 transition-colors"
                              >
                                <div className="font-medium">{hour.time}</div>

                                <div className="font-semibold text-blue-700">
                                  {kn}
                                  <span className="text-[8px] sm:text-xs"> kn</span>
                                  <div className="mt-0.5 flex justify-center items-center gap-0.5">
                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${windDot(kn)}`} />
                                    {hour.isCalibrated && <CheckCircle2 className="h-3 w-3 text-purple-600" />}
                                  </div>
                                </div>

                                <div className="flex flex-col items-center">
                                  {renderWindArrow(hour.windDirection)}
                                  <span className="text-[8px] sm:text-xs mt-0.5">{getWindDirectionName(hour.windDirection)}</span>
                                </div>

                                <div className="font-medium text-amber-600">
                                  {Math.round(hour.windGust)}
                                  <span className="text-[8px] sm:text-xs"> kn</span>
                                </div>

                                <div className="hidden sm:block text-xs">
                                  {(() => {
                                    const shore = getShoreType(hour.windDirection)
                                    return (
                                      <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs font-medium ${shore.color}`}>
                                        <span>{shore.emoji}</span>
                                        <span>{shore.label}</span>
                                      </span>
                                    )
                                  })()}
                                </div>

                                <div className="hidden sm:block text-xs text-slate-700">
                                  {hour.temperature != null ? `${hour.temperature}°` : "—"}
                                </div>

                                <div className="hidden sm:block text-xs">
                                  {(hour.precipitation ?? 0) > 0 ? (
                                    <span className="inline-flex items-center gap-0.5 text-blue-600 font-medium">
                                      <CloudRain className="h-3 w-3" />
                                      <span>{hour.precipitation} mm</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="rounded-lg border p-3 text-center text-gray-500 text-sm">
                            No hi ha dades disponibles per aquest dia
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="rounded-lg border p-4 text-center text-gray-500">No hi ha dades de previsió disponibles</div>
        )}
      </CardContent>
    </Card>
  )
}
