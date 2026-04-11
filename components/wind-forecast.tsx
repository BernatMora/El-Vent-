"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { type ForecastDay, type ForecastHour, getForecastData } from "@/lib/api"
import { formatDate, getWindDirectionName, getShoreType, knotsToKmh } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Brain, CloudRain, RefreshCw } from "lucide-react"

const SPOT = "sant-pere-pescador"

export function WindForecast() {
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getForecastData(SPOT)
      console.log("Dades rebudes:", data)

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

  // Funció per renderitzar la fletxa de direcció del vent
  const renderWindArrow = (direction: number) => {
    const rotationDegree = (direction + 180) % 360

    return (
      <div className="flex items-center justify-center">
        <svg
          width="20"
          height="20"
          className="sm:w-6 sm:h-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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

  // Condicions útils per al kiter (12 kn mínim, 15-20 kn ideal)
  const getFlowDescription = (windSpeed: number) => {
    if (windSpeed < 8) return "Calma"
    if (windSpeed < 12) return "Fluix"
    if (windSpeed < 15) return "Moderat"
    if (windSpeed < 20) return "Ideal"
    if (windSpeed < 25) return "Fort"
    return "Molt fort"
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
              <Skeleton key={i} className="h-12 sm:h-16 w-full" />
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

            <Tabs defaultValue="0">
              <TabsList className="flex w-full h-auto overflow-x-auto">
              {forecast.map((day, index) => (
                <TabsTrigger key={day.date} value={index.toString()} className="flex-1 min-w-[60px] text-xs sm:text-sm px-2 py-2">
                  {index === 0 ? "Avui" : index === 1 ? "Demà" : formatDate(day.date).split(',')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

              {forecast.map((day, dayIndex) => (
                <TabsContent key={day.date} value={dayIndex.toString()}>
                <div className="space-y-2">
                  {/* Header - compacte per mobil */}
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-1 sm:gap-2 rounded-md bg-gradient-to-r from-blue-50 to-cyan-50 p-2 text-center text-[10px] sm:text-sm font-medium text-blue-900">
                    <div>Hora</div>
                    <div>Vent</div>
                    <div>Dir.</div>
                    <div>Raf.</div>
                    <div className="hidden sm:block">Shore</div>
                    <div className="hidden sm:block">Temp</div>
                    <div className="hidden sm:block">Pluja</div>
                  </div>
                  
                  {day.hours && day.hours.length > 0 ? (
                    day.hours
                      .filter((hour: ForecastHour) => {
                        const hourNum = Number.parseInt(hour.time.split(":")[0])
                        return hourNum >= 9 && hourNum <= 21
                      })
                      .map((hour: ForecastHour) => (
                        <div
                          key={hour.time}
                          className="grid grid-cols-5 sm:grid-cols-7 items-center gap-1 sm:gap-2 rounded-md border p-1.5 sm:p-2 text-center text-[10px] sm:text-sm hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium">{hour.time}</div>
                          
                          <div className="font-semibold text-blue-700">
                            {Math.round(hour.windSpeed)}
                            <span className="text-[8px] sm:text-xs"> kn</span>
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
                      ))
                  ) : (
                    <div className="rounded-lg border p-4 text-center text-gray-500">
                      No hi ha dades disponibles per aquest dia
                    </div>
                  )}
                </div>
              </TabsContent>
              ))}
            </Tabs>
          </>
        ) : (
          <div className="rounded-lg border p-4 text-center text-gray-500">No hi ha dades de previsió disponibles</div>
        )}
        

      </CardContent>
    </Card>
  )
}
