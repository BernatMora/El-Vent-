"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function WindForecast() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<any[]>([])

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true)
        const data = await getForecastData(selectedSpot)
        setForecast(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [selectedSpot])

  // Función para renderizar la flecha de dirección del viento
  const renderWindArrow = (direction: number) => {
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
        <CardTitle>Previsió del Vent</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0">
          <TabsList className="grid w-full grid-cols-3">
            {forecast.map((day, index) => (
              <TabsTrigger key={day.date} value={index.toString()}>
                {index === 0 ? "Avui" : index === 1 ? "Demà" : formatDate(day.date)}
              </TabsTrigger>
            ))}
          </TabsList>

          {forecast.map((day, dayIndex) => (
            <TabsContent key={day.date} value={dayIndex.toString()}>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-5 gap-2 rounded-md bg-blue-50 p-2 text-center text-sm font-medium text-blue-900">
                    <div>Hora</div>
                    <div>Vent</div>
                    <div>Direcció</div>
                    <div>Ràfegues</div>
                    <div>Flux</div>
                  </div>
                  {day.hours
                    .filter((hour: any) => {
                      const hourNum = Number.parseInt(hour.time.split(":")[0])
                      return hourNum >= 9 && hourNum <= 21
                    })
                    .map((hour: any) => (
                      <div
                        key={hour.time}
                        className="grid grid-cols-5 items-center gap-2 rounded-md border p-2 text-center"
                      >
                        <div className="font-medium">{hour.time}</div>
                        <div className="font-semibold text-blue-700">
                          {Math.round(hour.windSpeed)} kn
                          <span className="ml-1 text-xs text-gray-500">({knotsToKmh(hour.windSpeed)} km/h)</span>
                        </div>
                        <div className="flex flex-col items-center">
                          {renderWindArrow(hour.windDirection)}
                          <span className="mt-1 text-xs">{getWindDirectionName(hour.windDirection)}</span>
                        </div>
                        <div className="font-medium text-amber-600">
                          {Math.round(hour.windGust)} kn
                          <span className="ml-1 text-xs text-gray-500">({knotsToKmh(hour.windGust)} km/h)</span>
                        </div>
                        <div className="text-sm text-gray-600">{getFlowDescription(hour.windSpeed)}</div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
