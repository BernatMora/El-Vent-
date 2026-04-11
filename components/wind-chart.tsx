"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSpotStore } from "@/lib/store"
import { type ForecastDay, type ForecastHour, getForecastData } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { getWindDirectionName, knotsToKmh } from "@/lib/utils"
import { Area, AreaChart, CartesianGrid, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type ChartPoint = {
  time: string
  windSpeed: number
  windGust: number
  windDirection: number
  directionName: string
}

const MIN_RIDEABLE_WIND = 10
const IDEAL_WIND_START = 12
const IDEAL_WIND_END = 20

export function WindChart() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [activeTab, setActiveTab] = useState("")

  const formatTabDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("ca-ES", { day: "2-digit", month: "2-digit" })
  }

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true)
        const data = await getForecastData(selectedSpot)
        setForecast(data)

        // Establir la pestanya activa al primer dia quan es carreguen les dades
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

  // Preparar dades per la gràfica
  const prepareChartData = (dayIndex: number): ChartPoint[] => {
    if (!forecast || forecast.length === 0) return []

    const daysToShow = dayIndex === -1 ? forecast : forecast[dayIndex] ? [forecast[dayIndex]] : []

    return daysToShow.flatMap((day) =>
      day.hours
        .filter((hour: ForecastHour) => {
          const hourNum = Number.parseInt(hour.time.split(":")[0])
          return hourNum >= 9 && hourNum <= 21
        })
        .map((hour: ForecastHour) => {
          const windSpeed = hour.windSpeed
          // Assegurar que les ràfegues sempre siguin >= al vent sostingut
          const windGust = Math.max(hour.windGust || hour.windSpeed * 1.2, windSpeed)
          return {
            time: dayIndex === -1 ? `${formatTabDate(day.date)} · ${hour.time}` : hour.time,
            windSpeed,
            windGust,
            windDirection: hour.windDirection,
            directionName: getWindDirectionName(hour.windDirection),
          }
        }),
    )
  }

  // Obtenir l'índex del dia a partir del tab actiu
  const getDayIndexFromTab = (tab: string) => {
    if (tab === "Tots") return -1

    // Buscar l'índex del dia que coincideix amb el format de data del tab
    const index = forecast.findIndex((day) => formatTabDate(day.date) === tab)
    return index >= 0 ? index : 0
  }

  // Component personalitzat per al tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ value?: number; payload?: ChartPoint }>
    label?: string
  }) => {
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
        </div>
      )
    }
    return null
  }

  const dayIndex = getDayIndexFromTab(activeTab)
  const chartData = useMemo(() => prepareChartData(dayIndex), [forecast, dayIndex])
  const windStats = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, avg: 0, max: 0, gustMax: 0 }
    }
    const windSpeeds = chartData.map((item) => item.windSpeed)
    const windGusts = chartData.map((item) => item.windGust)
    const min = Math.min(...windSpeeds)
    const max = Math.max(...windSpeeds)
    const avg = windSpeeds.reduce((sum: number, speed: number) => sum + speed, 0) / windSpeeds.length
    const gustMax = Math.max(...windGusts)
    return {
      min: Math.round(min * 10) / 10,
      avg: Math.round(avg * 10) / 10,
      max: Math.round(max * 10) / 10,
      gustMax: Math.round(gustMax * 10) / 10,
    }
  }, [chartData])

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
        <CardDescription>Visualitza quan el vent queda curt, quan entra en zona bona i quan les ràfegues poden complicar la sessió</CardDescription>
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
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <ReferenceArea y1={0} y2={MIN_RIDEABLE_WIND} fill="#fee2e2" fillOpacity={0.5} />
                      <ReferenceArea y1={IDEAL_WIND_START} y2={IDEAL_WIND_END} fill="#dcfce7" fillOpacity={0.45} />
                      <XAxis dataKey="time" />
                      <YAxis
                        label={{ value: "Vent (kn)", angle: -90, position: "insideLeft" }}
                        domain={[0, "dataMax + 5"]}
                      />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={MIN_RIDEABLE_WIND} stroke="#ef4444" strokeDasharray="6 6" />
                      <ReferenceLine y={IDEAL_WIND_START} stroke="#10b981" strokeDasharray="6 6" />
                      <Area
                        type="monotone"
                        dataKey="windSpeed"
                        stroke="#2563eb"
                        strokeWidth={2}
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
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
                <div className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                  Vermell: per sota de {MIN_RIDEABLE_WIND} kn
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  Verd: zona bona {IDEAL_WIND_START}-{IDEAL_WIND_END} kn
                </div>
                <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                  Línia taronja: ràfegues
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vent mínim</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">{windStats.min} kn</div>
                  <div>{knotsToKmh(windStats.min)} km/h</div>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">Mitjana</div>
                  <div className="mt-1 text-lg font-bold text-blue-900">{windStats.avg} kn</div>
                  <div>{knotsToKmh(windStats.avg)} km/h</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Vent màxim</div>
                  <div className="mt-1 text-lg font-bold text-emerald-900">{windStats.max} kn</div>
                  <div>{knotsToKmh(windStats.max)} km/h</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">Ràfega màxima</div>
                  <div className="mt-1 text-lg font-bold text-amber-900">{windStats.gustMax} kn</div>
                  <div>{knotsToKmh(windStats.gustMax)} km/h</div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
