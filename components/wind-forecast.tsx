"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSpotStore } from "@/lib/store"
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Cloud, CloudRain, RefreshCw, Sun } from "lucide-react"
import { getForecastData } from "@/lib/api"

export function WindForecast() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString())
  const [activeTab, setActiveTab] = useState("0") // Asegurarnos de que el tab activo sea "0" (Avui)
  // Primero, añadir un estado para rastrear la fuente de datos
  const [dataSource, setDataSource] = useState<string>("openweathermap")

  // Función para cargar los datos del pronóstico
  const loadForecast = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener la fuente de datos actual
      const currentSource = localStorage.getItem("dataSource") || "openweathermap"
      setDataSource(currentSource)

      // Añadir un timestamp para evitar caché
      const timestamp = new Date().getTime()

      // Obtener datos reales de la API con el parámetro de timestamp
      const data = await getForecastData(selectedSpot + `?_t=${timestamp}`, currentSource)

      setForecast(data)
      setLastUpdated(new Date().toLocaleTimeString())
      setActiveTab("0") // Asegurarse de que el tab activo sea el primero (hoy)
    } catch (err) {
      console.error("Error cargando pronóstico:", err)
      setError("Error al cargar el pronóstico. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForecast()

    // Detectar la fuente de datos guardada en localStorage
    const savedSource = localStorage.getItem("dataSource")
    if (savedSource) {
      setDataSource(savedSource)
    }
  }, [selectedSpot])

  // Función para renderizar la flecha de dirección del viento
  const renderWindArrow = (direction: number, windSpeed: number) => {
    // Si no hay viento, mostrar un icono diferente
    if (windSpeed === 0) {
      return (
        <div className="flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="8" y1="12" x2="16" y2="12" stroke="#9CA3AF" strokeWidth="2" />
          </svg>
        </div>
      )
    }

    // La flecha debe apuntar HACIA DONDE va el viento
    // Necesitamos rotar 180 grados porque en meteorología la dirección indica de donde viene
    const rotationDegree = (direction + 180) % 360

    // Usamos un SVG más simple y claro para la flecha
    return (
      <div className="flex items-center justify-center">
        <svg
          width="24"
          height="24"
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
    if (direction === 0) return "-" // No wind direction
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
    if (windSpeed === 0) return "Sense vent"
    if (windSpeed <= 3) return "Molt fluix"
    if (windSpeed <= 7) return "Fluix"
    return "Flux"
  }

  // Función para renderizar el icono del clima
  const renderWeatherIcon = (hour: any) => {
    if (!hour || !hour.weather) return null

    const weather = hour.weather?.toLowerCase()
    const rain = hour.rain > 0

    if (rain) {
      return <CloudRain className="h-5 w-5 text-blue-500" />
    } else if (weather === "clouds" || hour.clouds > 70) {
      return <Cloud className="h-5 w-5 text-gray-500" />
    } else if (weather === "clear") {
      return <Sun className="h-5 w-5 text-yellow-500" />
    } else {
      return null
    }
  }

  // Función para formatear la fecha para mostrar en la UI
  const getFormattedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const isToday = date.toDateString() === today.toDateString()
      const isTomorrow = date.toDateString() === tomorrow.toDateString()

      if (isToday) {
        return "Avui"
      } else if (isTomorrow) {
        return "Demà"
      } else {
        // Formato: "dilluns, 5 de maig"
        return formatDate(dateStr)
      }
    } catch (e) {
      console.error("Error formateando fecha:", e)
      return dateStr
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Previsió del Vent</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Actualitzat: {lastUpdated}</span>
          <Button variant="outline" size="sm" onClick={loadForecast} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Actualitzar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">
            Font de dades: {dataSource === "open-meteo" ? "Open-Meteo (1h)" : "OpenWeatherMap (3h)"}
          </span>
        </div>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">
            {error}
            <Button variant="outline" className="mt-2" onClick={loadForecast}>
              Recargar datos
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              {forecast.slice(0, 5).map((day, index) => (
                <TabsTrigger key={day.date} value={index.toString()}>
                  {getFormattedDate(day.date)}
                </TabsTrigger>
              ))}
            </TabsList>

            {forecast.slice(0, 5).map((day, dayIndex) => (
              <TabsContent key={day.date} value={dayIndex.toString()}>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-6 gap-2 rounded-md bg-blue-50 p-2 text-center text-sm font-medium text-blue-900">
                      <div>Hora</div>
                      <div>Vent</div>
                      <div>Direcció</div>
                      <div>Ràfegues</div>
                      <div>Flux</div>
                      <div>Clima</div>
                    </div>
                    {day.hours
                      .filter((hour: any) => {
                        const hourNum = Number.parseInt(hour.time.split(":")[0])
                        // Si es Open-Meteo, mostrar todas las horas entre 9 y 21
                        // Si es OpenWeatherMap, mostrar solo cada 3 horas
                        if (dataSource === "open-meteo") {
                          return hourNum >= 9 && hourNum <= 21
                        } else {
                          // Para OpenWeatherMap, mostrar solo horas múltiplos de 3 o las disponibles
                          return hourNum >= 9 && hourNum <= 21 && (hourNum % 3 === 0 || hour.time.includes(":00"))
                        }
                      })
                      .map((hour: any) => (
                        <div
                          key={hour.time}
                          className="grid grid-cols-6 items-center gap-2 rounded-md border p-2 text-center"
                        >
                          <div className="font-medium">{hour.time}</div>
                          <div className="font-semibold text-blue-700">
                            {Math.round(hour.windSpeed)} kn
                            <span className="ml-1 text-xs text-gray-500">({knotsToKmh(hour.windSpeed)} km/h)</span>
                          </div>
                          <div className="flex flex-col items-center">
                            {renderWindArrow(hour.windDirection, hour.windSpeed)}
                            <span className="mt-1 text-xs">
                              {hour.windSpeed === 0 ? "-" : getWindDirectionName(hour.windDirection)}
                            </span>
                          </div>
                          <div className="font-medium text-amber-600">
                            {Math.round(hour.windGust)} kn
                            <span className="ml-1 text-xs text-gray-500">({knotsToKmh(hour.windGust)} km/h)</span>
                          </div>
                          <div className="text-sm text-gray-600">{getFlowDescription(hour.windSpeed)}</div>
                          <div className="flex items-center justify-center">
                            {renderWeatherIcon(hour)}
                            {hour.rain > 0 && (
                              <span className="ml-1 text-xs text-blue-600">{hour.rain.toFixed(1)} mm</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
