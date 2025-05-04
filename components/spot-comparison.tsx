"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getForecastData } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

type SpotData = {
  name: string
  id: string
  currentWind: number
  maxWind: number
  direction: number
  directionName: string
  temperature: number
  optimalHours: number
  bestTime: string
}

export function SpotComparison() {
  const [loading, setLoading] = useState(true)
  const [spotsData, setSpotsData] = useState<SpotData[]>([])
  const [selectedDay, setSelectedDay] = useState(0) // 0 = hoy, 1 = mañana, 2 = pasado mañana

  // Lista de spots a comparar
  const spots = [
    { id: "aquarius", name: "Aquarius" },
    { id: "la-gaviota", name: "La Gaviota" },
  ]

  useEffect(() => {
    async function loadSpotsData() {
      setLoading(true)
      try {
        const spotsPromises = spots.map(async (spot) => {
          const data = await getForecastData(spot.id)

          if (!data || data.length === 0 || !data[selectedDay] || !data[selectedDay].hours) {
            return {
              name: spot.name,
              id: spot.id,
              currentWind: 0,
              maxWind: 0,
              direction: 0,
              directionName: "-",
              temperature: 0,
              optimalHours: 0,
              bestTime: "N/A",
            }
          }

          const dayData = data[selectedDay]
          const hours = dayData.hours

          // Encontrar viento actual o primera hora disponible
          const now = new Date()
          const currentHour = now.getHours()
          const currentHourData =
            hours.find((h: any) => Number.parseInt(h.time.split(":")[0]) === currentHour) || hours[0]

          // Calcular viento máximo del día
          const maxWind = Math.max(...hours.map((h: any) => h.windSpeed))

          // Contar horas óptimas (viento entre 10-25 nudos)
          const optimalHours = hours.filter((h: any) => h.windSpeed >= 10 && h.windSpeed <= 25).length

          // Encontrar mejor hora (mayor viento dentro del rango óptimo)
          const optimalHoursData = hours.filter((h: any) => h.windSpeed >= 10 && h.windSpeed <= 25)

          const bestHour =
            optimalHoursData.length > 0
              ? optimalHoursData.reduce(
                  (best: any, current: any) => (current.windSpeed > best.windSpeed ? current : best),
                  optimalHoursData[0],
                )
              : null

          const bestTime = bestHour ? bestHour.time : "N/A"

          // Obtener nombre de dirección
          const directionName = getWindDirectionName(currentHourData.windDirection)

          return {
            name: spot.name,
            id: spot.id,
            currentWind: Math.round(currentHourData.windSpeed),
            maxWind: Math.round(maxWind),
            direction: currentHourData.windDirection,
            directionName,
            temperature: Math.round(currentHourData.temperature || 20),
            optimalHours,
            bestTime,
          }
        })

        const results = await Promise.all(spotsPromises)

        // Ordenar spots por viento actual (de mayor a menor)
        results.sort((a, b) => b.currentWind - a.currentWind)

        setSpotsData(results)
      } catch (error) {
        console.error("Error cargando datos de spots:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSpotsData()
  }, [selectedDay])

  // Función para obtener el nombre de la dirección del viento
  function getWindDirectionName(direction: number) {
    if (direction === 0) return "-" // No wind
    if (direction >= 337.5 || direction < 22.5) return "N"
    if (direction >= 22.5 && direction < 67.5) return "NE"
    if (direction >= 67.5 && direction < 112.5) return "E"
    if (direction >= 112.5 && direction < 157.5) return "SE"
    if (direction >= 157.5 && direction < 202.5) return "S"
    if (direction >= 202.5 && direction < 247.5) return "SW"
    if (direction >= 247.5 && direction < 292.5) return "W"
    return "NW"
  }

  // Función para renderizar la flecha de dirección del viento
  const renderWindArrow = (direction: number, windSpeed: number) => {
    // Si no hay viento, mostrar un icono diferente
    if (windSpeed === 0) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
      )
    }

    // La flecha debe apuntar HACIA DONDE va el viento
    const rotationDegree = (direction + 180) % 360

    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: `rotate(${rotationDegree}deg)` }}
        >
          <path
            d="M12 4L4 20L12 17L20 20L12 4Z"
            fill="#1d4ed8"
            stroke="#1d4ed8"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  // Función para determinar el color de la insignia según la velocidad del viento
  const getWindBadgeColor = (windSpeed: number) => {
    if (windSpeed === 0) return "bg-gray-400"
    if (windSpeed < 8) return "bg-gray-500"
    if (windSpeed < 12) return "bg-green-600"
    if (windSpeed < 18) return "bg-blue-600"
    if (windSpeed < 25) return "bg-amber-500"
    return "bg-red-500"
  }

  // Función para obtener el texto de recomendación
  const getRecommendation = (spot: SpotData) => {
    if (spot.currentWind === 0) return "Sense vent"
    if (spot.currentWind < 8) return "Vent insuficient"
    if (spot.currentWind > 25) return "Vent massa fort"
    if (spot.currentWind >= 12 && spot.currentWind <= 20) return "Condicions òptimes!"
    return "Condicions acceptables"
  }

  // Obtener la fecha para cada pestaña
  const getDayLabel = (dayOffset: number) => {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)

    if (dayOffset === 0) return "Avui"
    if (dayOffset === 1) return "Demà"

    return date.toLocaleDateString("ca-ES", { weekday: "short", day: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Comparació de Spots</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0" onValueChange={(value) => setSelectedDay(Number(value))}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="0">{getDayLabel(0)}</TabsTrigger>
            <TabsTrigger value="1">{getDayLabel(1)}</TabsTrigger>
            <TabsTrigger value="2">{getDayLabel(2)}</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {spotsData.map((spot) => (
                  <div
                    key={spot.id}
                    className={`rounded-lg border p-4 ${
                      spot.currentWind >= 12 && spot.currentWind <= 20 ? "border-green-200 bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{spot.name}</h3>
                        <Badge className={getWindBadgeColor(spot.currentWind)}>{spot.currentWind} kn</Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderWindArrow(spot.direction, spot.currentWind)}
                        <span className="text-sm">{spot.directionName}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Màxim:</span>{" "}
                        <span className="font-medium">{spot.maxWind} kn</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Temp:</span>{" "}
                        <span className="font-medium">{spot.temperature}°C</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Millor hora:</span>{" "}
                        <span className="font-medium">{spot.bestTime}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Hores òptimes:</span>{" "}
                        <span className="font-medium">{spot.optimalHours}</span>
                      </div>

                      <div
                        className={`text-sm font-medium ${
                          spot.currentWind >= 12 && spot.currentWind <= 20
                            ? "text-green-700"
                            : spot.currentWind > 0 && spot.currentWind < 25
                              ? "text-blue-700"
                              : "text-gray-500"
                        }`}
                      >
                        {getRecommendation(spot)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
