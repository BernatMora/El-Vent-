"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Info, Brain, Wifi, Users } from "lucide-react"

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
        console.log("Cargando previsión millorada para:", selectedSpot)
        const data = await getForecastData(selectedSpot)
        console.log("Datos recibidos:", data)

        if (!data || data.length === 0) {
          setError("No s'han pogut carregar les dades de previsió")
          return
        }

        setForecast(data)
      } catch (err) {
        console.error("Error loading forecast:", err)
        setError("Sense connexió - No es poden carregar dades meteorològiques")
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

  // Obtener el icono y color según el tipo de predicción
  const getPredictionBadge = (hour: any) => {
    if (hour.isMLEnhanced && hour.mlConfidence > 0.7) {
      return (
        <Badge variant="outline" className="text-xs px-1 py-0 bg-purple-50 border-purple-200 text-purple-700">
          <Brain className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">IA</span>
          <span className="sm:hidden">AI</span>
        </Badge>
      )
    }
    
    if (hour.isCalibrated) {
      return (
        <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50 border-green-200 text-green-700">
          <Users className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">Calibrat</span>
          <span className="sm:hidden">Cal</span>
        </Badge>
      )
    }

    if (hour.source && hour.source.includes('Agregat')) {
      return (
        <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 border-blue-200 text-blue-700">
          <Wifi className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">Multi-API</span>
          <span className="sm:hidden">API</span>
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="text-xs px-1 py-0">
        <span className="hidden sm:inline">Model</span>
        <span className="sm:hidden">Mod</span>
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Previsió Millorada amb IA
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Prediccions combinant múltiples fonts meteorològiques i Machine Learning
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
              </svg>
              <span className="text-lg font-medium text-red-800">Sense Connexió</span>
            </div>
            <p className="text-red-700 text-sm">
              No es poden obtenir dades meteorològiques reals en aquest moment.
              <br />
              Comprova la connexió a internet i torna-ho a intentar.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Tornar a intentar
            </button>
          </div>
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
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 rounded-md bg-gradient-to-r from-purple-50 to-blue-50 p-2 text-center text-xs sm:text-sm font-medium text-purple-900">
                    <div>Hora</div>
                    <div>Vent</div>
                    <div>Dir.</div>
                    <div>Ràf.</div>
                    <div>Pluja</div>
                    <div className="hidden sm:block">Flux</div>
                    <div className="sm:hidden">Est.</div>
                    <div className="hidden sm:block">Tipus</div>
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
                          className="grid grid-cols-7 items-center gap-1 sm:gap-2 rounded-md border p-2 text-center text-xs sm:text-sm hover:bg-gray-50 transition-colors"
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
                          
                          <div className="flex flex-col items-center">
                            <div className="text-lg">
                              {hour.precipitationProbability > 60 ? (
                                hour.precipitationType === 'thunderstorm' ? '⛈️' : 
                                hour.precipitationType === 'rain' ? '🌧️' : 
                                hour.precipitationType === 'drizzle' ? '🌦️' : '🌧️'
                              ) : hour.precipitationProbability > 30 ? (
                                '🌦️'
                              ) : hour.precipitationProbability > 10 ? (
                                '🌤️'
                              ) : (
                                '☀️'
                              )}
                            </div>
                            <div className="text-xs">
                              {hour.precipitationProbability}%
                              {hour.precipitation > 0 && (
                                <div className="text-xs text-blue-600">
                                  {hour.precipitation.toFixed(1)}mm
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-xs sm:text-sm text-gray-600">
                            {getFlowDescription(hour.windSpeed)}
                          </div>
                          
                          <div className="flex justify-center">
                            {getPredictionBadge(hour)}
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
        
        {/* Informació sobre les millores */}
        {forecast.length > 0 && (
          <div className="mt-4 space-y-2">
            {forecast[0].hours.some((h: any) => h.isMLEnhanced) && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Prediccions millorades amb IA</span>
                </div>
                <div className="text-xs text-purple-700">
                  Alguns valors han estat optimitzats pel nostre model de Machine Learning basat en observacions locals.
                </div>
              </div>
            )}
            
            {forecast[0].hours.some((h: any) => h.source && h.source.includes('Agregat')) && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wifi className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Dades multi-font</span>
                </div>
                <div className="text-xs text-blue-700">
                  Prediccions combinant múltiples APIs meteorològiques per màxima precisió.
                </div>
              </div>
            )}
            
            {forecast[0].hours.some((h: any) => h.isCalibrated) && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Calibració d'usuaris</span>
                </div>
                <div className="text-xs text-green-700">
                  Valors ajustats basant-se en reportes reals de la comunitat de kiters locals.
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}