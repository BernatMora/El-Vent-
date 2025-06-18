"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Info } from "lucide-react"

export function WindForecast() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true)
        setError(null)
        console.log("Cargando previsión para:", selectedSpot)
        const data = await getForecastData(selectedSpot)
        console.log("Datos recibidos:", data)

        if (!data || data.length === 0) {
          setError("No s'han pogut carregar les dades de previsió")
          return
        }

        setForecast(data)
      } catch (err) {
        console.error("Error loading forecast:", err)
        setError("Error carregant les dades")
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [selectedSpot])

  // Función para renderizar la flecha de dirección del viento
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

  // Obtener el nombre del viento según su dirección
  const getWindDirectionName = (direction: number) => {
    if (direction >= 337.5 || direction < 22.5) return "N"
    if (direction >= 22.5 && direction < 67.5) return "NE"
    if (direction >= 67.5 && direction < 112.5) return "E"
    if (direction >= 112.5 && direction < 157.5) return "SE"
    if (direction >= 157.5 && direction < 202.5) return "S"
    if (direction >= 202.5 && direction < 247.5) return "SW"
    if (direction >= 247.5 && direction < 292.5) return "W"
    return "NW"
  }

  // Convertir nudos a km/h para mostrar ambos
  const knotsToKmh = (knots: number) => {
    return Math.round(knots * 1.852)
  }

  // Determinar si el flujo es "Molt fluix", "Fluix" o normal basado en la velocidad del viento
  const getFlowDescription = (windSpeed: number) => {
    if (windSpeed <= 3) return "Molt fluix"
    if (windSpeed <= 7) return "Fluix"
    return "Flux"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Previsió del Vent</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 sm:h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">{error}</div>
        ) : forecast && forecast.length > 0 ? (
          <Tabs defaultValue="0">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              {forecast.map((day, index) => (
                <TabsTrigger key={day.date} value={index.toString()} className="text-xs sm:text-sm px-2 py-2">
                  {index === 0 ? "Avui" : index === 1 ? "Demà" : formatDate(day.date).split(',')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {forecast.map((day, dayIndex) => (
              <TabsContent key={day.date} value={dayIndex.toString()}>
                <div className="space-y-2">
                  {/* Header per mòbil - més compacte */}
                  <div className="grid grid-cols-6 gap-1 sm:gap-2 rounded-md bg-blue-50 p-2 text-center text-xs sm:text-sm font-medium text-blue-900">
                    <div>Hora</div>
                    <div>Vent</div>
                    <div>Dir.</div>
                    <div>Ràf.</div>
                    <div className="hidden sm:block">Flux</div>
                    <div className="sm:hidden">Est.</div>
                    <div className="hidden sm:block">Estat</div>
                  </div>
                  
                  {day.hours && day.hours.length > 0 ? (
                    day.hours
                      .filter((hour: any) => {
                        const hourNum = Number.parseInt(hour.time.split(":")[0])
                        return hourNum >= 9 && hourNum <= 21
                      })
                      .map((hour: any) => (
                        <div
                          key={hour.time}
                          className="grid grid-cols-6 items-center gap-1 sm:gap-2 rounded-md border p-2 text-center text-xs sm:text-sm"
                        >
                          <div className="font-medium">{hour.time}</div>
                          
                          <div className="font-semibold text-blue-700">
                            {Math.round(hour.windSpeed)} kn
                            <div className="text-xs text-gray-500 hidden sm:block">
                              ({knotsToKmh(hour.windSpeed)} km/h)
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            {renderWindArrow(hour.windDirection)}
                            <span className="text-xs mt-1">{getWindDirectionName(hour.windDirection)}</span>
                          </div>
                          
                          <div className="font-medium text-amber-600">
                            {Math.round(hour.windGust)} kn
                            <div className="text-xs text-gray-500 hidden sm:block">
                              ({knotsToKmh(hour.windGust)} km/h)
                            </div>
                          </div>
                          
                          <div className="text-xs sm:text-sm text-gray-600">
                            {getFlowDescription(hour.windSpeed)}
                          </div>
                          
                          <div className="flex justify-center">
                            {hour.isCalibrated ? (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                <Info className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline">Calibrat</span>
                                <span className="sm:hidden">Cal</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                <span className="hidden sm:inline">Model</span>
                                <span className="sm:hidden">Mod</span>
                              </Badge>
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
        ) : (
          <div className="rounded-lg border p-4 text-center text-gray-500">No hi ha dades de previsió disponibles</div>
        )}
        
        {forecast.length > 0 && forecast[0].hours.some((h: any) => h.isCalibrated) && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs sm:text-sm text-blue-800">
              <strong>Dades calibrades:</strong> Alguns valors han estat ajustats basant-se en reportes d'usuaris recents per millorar la precisió local.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}