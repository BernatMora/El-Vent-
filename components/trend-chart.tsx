"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ForecastDay, getForecastData } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const SPOT = "sant-pere-pescador"

export function TrendChart() {
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getForecastData(SPOT)
        setForecast(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const trendData = useMemo(() => {
    return forecast.slice(0, 7).map((day, index) => {
      const hours = day.hours.filter(h => {
        const hr = parseInt(h.time.split(":")[0])
        return hr >= 9 && hr <= 21
      })
      const avg = hours.length > 0
        ? Math.round(hours.reduce((s, h) => s + h.windSpeed, 0) / hours.length)
        : 0
      const max = hours.length > 0
        ? Math.round(Math.max(...hours.map(h => h.windSpeed)))
        : 0
      const label = index === 0 ? "Avui" : index === 1 ? "Demà" : formatDate(day.date).split(",")[0]
      return { label, avg, max }
    })
  }, [forecast])

  const getBarColor = (avg: number) => {
    if (avg >= 12) return "#16a34a"
    if (avg >= 8) return "#eab308"
    return "#ef4444"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Tendència 7 dies</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[200px] w-full" /></CardContent>
      </Card>
    )
  }

  if (trendData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendència 7 dies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} barGap={8}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis unit=" kn" tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [`${value} kn`, name === "avg" ? "Mitjana" : "Màxim"]}
                labelFormatter={(label: string) => label}
              />
              <Bar dataKey="avg" name="Mitjana" radius={[4, 4, 0, 0]}>
                {trendData.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.avg)} />
                ))}
              </Bar>
              <Bar dataKey="max" name="Màxim" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-600" /> Navegable</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-500" /> Justeta</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> Fluixa</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-300" /> Ràfega màx</span>
        </div>
      </CardContent>
    </Card>
  )
}
