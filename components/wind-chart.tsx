"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function WindChart() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("")

  const formatTabDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ca-ES", { day: "2-digit", month: "2-digit" })
  }

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true)
        const data = await getForecastData(selectedSpot)
        setForecast(data)

        // Set the active tab to the first day when data is loaded
        if (data && data.length > 0) {
          setActiveTab(formatTabDate(data[0].date))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [selectedSpot])

  // Preparar datos para la gráfica
  const prepareChartData = (dayIndex: number) => {
    if (!forecast || forecast.length === 0 || !forecast[dayIndex]) return []

    const day = forecast[dayIndex]
    return day.hours
      .filter((hour: any) => {
        const hourNum = Number.parseInt(hour.time.split(":")[0])
        return hourNum >= 9 && hourNum <= 21
      })
      .map((hour: any) => ({
        time: hour.time,
        windSpeed: hour.windSpeed,
        windGust: hour.windGust || hour.windSpeed * 1.2,
        windDirection: hour.windDirection,
        directionName: getWindDirectionName(hour.windDirection),
        precipitation: hour.precipitation || 0,
        precipitationProbability: hour.precipitationProbability || 0,
      }))
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

  // Obtener el índice del día a partir del tab activo
  const getDayIndexFromTab = (tab: string) => {
    if (tab === "Tots") return 0 // Por defecto mostrar el primer día

    // Buscar el índice del día que coincide con el formato de fecha del tab
    const index = forecast.findIndex((day) => formatTabDate(day.date) === tab)
    return index >= 0 ? index : 0
  }

  // Componente personalizado para el tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white p-3 shadow-md">
          <p className="mb-1 font-medium">
            {activeTab} - {label}
          </p>
          <p className="text-blue-600">Vent: {payload[0]?.value?.toFixed(1) || 0} kn</p>
          {payload[1] && (
            <p className="text-amber-600">Ràfegues: {payload[1].value?.toFixed(1) || 0} kn</p>
          )}
          <p>
            Direcció: {payload[0]?.payload?.directionName || 'N/A'} ({payload[0]?.payload?.windDirection || 0}°)
          </p>
          {payload[0]?.payload?.precipitationProbability > 0 && (
            <p className="text-blue-500">
              Pluja: {payload[0].payload.precipitationProbability}%
              {payload[0].payload.precipitation > 0 && ` (${payload[0].payload.precipitation.toFixed(1)} mm/h)`}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Calcular estadísticas del viento para el día seleccionado
  const calculateWindStats = (dayIndex: number) => {
    if (!forecast || forecast.length === 0 || !forecast[dayIndex]) {
      return { min: 0, avg: 0, max: 0, gustMax: 0 }
    }

    const chartData = prepareChartData(dayIndex)
    if (chartData.length === 0) {
      return { min: 0, avg: 0, max: 0, gustMax: 0 }
    }

    const windSpeeds = chartData.map((item: any) => item.windSpeed)
    const windGusts = chartData.map((item: any) => item.windGust)

    const min = Math.min(...windSpeeds)
    const max = Math.max(...windSpeeds)
    const avg = windSpeeds.reduce((sum: number, speed: number) => sum + speed, 0) / windSpeeds.length
    const gustMax = Math.max(...windGusts)

    return {
      min: Math.round(min * 10) / 10,
      avg: Math.round(avg * 10) / 10, // Redondear a 1 decimal
      max: Math.round(max * 10) / 10,
      gustMax: Math.round(gustMax * 10) / 10,
    }
  }

  const dayIndex = getDayIndexFromTab(activeTab)
  const windStats = calculateWindStats(dayIndex)

  // Convertir nudos a km/h
  const knotsToKmh = (knots: number) => {
    return Math.round(knots * 1.852 * 10) / 10
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 22h18M18 10l3 3-3 3" />
            <path d="M18.5 13h-13a2 2 0 1 1 0-4h6a2 2 0 1 0 0-4h-6" />
          </svg>
          Anàlisi visual del vent
        </CardTitle>
        <CardDescription>Visualitza les dades de vent i temperatura per entendre millor les condicions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="evolucio" className="mb-4">
          <TabsList>
            <TabsTrigger value="evolucio" className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              Evolució
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {forecast.map((day, index) => (
                <button
                  key={day.date}
                  className={`rounded-full px-4 py-1 text-sm ${
                    activeTab === formatTabDate(day.date)
                      ? "bg-blue-900 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setActiveTab(formatTabDate(day.date))}
                >
                  {formatTabDate(day.date)}
                </button>
              ))}
              <button
                className={`rounded-full px-4 py-1 text-sm ${
                  activeTab === "Tots" ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setActiveTab("Tots")}
              >
                Tots
              </button>
            </div>

            <TabsContent value="evolucio" className="mt-0">
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareChartData(dayIndex)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" />
                      <YAxis
                        label={{ value: "Vent (kn)", angle: -90, position: "insideLeft" }}
                        domain={[0, "dataMax + 5"]}
                      />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="windSpeed"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorWind)"
                      />
                      <Line
                        type="monotone"
                        dataKey="windGust"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                      {/* Línia de precipitació */}
                      <Line
                        type="monotone"
                        dataKey="precipitationProbability"
                        stroke="#06b6d4"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        dot={false}
                        yAxisId="right"
                      />
                      {/* Líneas de referencia */}
                      <line x1="0%" y1="12" x2="100%" y2="12" stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" />
                      <line x1="0%" y1="8" x2="100%" y2="8" stroke="#d1d5db" strokeWidth={1} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5" />
                    <path d="M5 12h14" />
                  </svg>
                  Vent mínim: {windStats.min} kn ({knotsToKmh(windStats.min)} km/h)
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1 h-4 w-4 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5" />
                    <path d="M5 12h14" />
                  </svg>
                  Mitjana: {windStats.avg} kn ({knotsToKmh(windStats.avg)} km/h)
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1 h-4 w-4 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                  </svg>
                  Vent màxim: {windStats.max} kn ({knotsToKmh(windStats.max)} km/h)
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end text-sm text-amber-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
                Ràfegues màximes: {windStats.gustMax} kn ({knotsToKmh(windStats.gustMax)} km/h)
              </div>
              
              {/* Informació de precipitació */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                      <path d="m16 14-3-2-3 2"/>
                      <path d="m8 17 4-5 4 5"/>
                    </svg>
                    Precipitació: Línia discontínua blava
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
