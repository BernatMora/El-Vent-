"use client"

import { useEffect, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getForecastData } from "@/lib/api"
import { predictionHistory } from "@/lib/prediction-history"

const SPOT = "sant-pere-pescador"

type Row = {
  label: string
  previst: number
  real: number | null
  errorKn: number | null
}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

async function syncCurrent() {
  try {
    const r = await fetch("/api/current")
    if (!r.ok) return
    const json = await r.json()
    const cur = json.current
    if (cur?.isReal) {
      predictionHistory.reportActualConditions(
        SPOT,
        Math.round(cur.windSpeed),
        Math.round(cur.windDirection),
        Math.round(cur.windGust),
      )
    }
  } catch {
    // silent
  }
}

async function syncForecast() {
  try {
    const days = await getForecastData(SPOT)
    const now = new Date()
    for (const day of days) {
      for (const h of day.hours) {
        const t = new Date(h.time)
        // Només prediccions futures o de l'hora actual
        if (t.getTime() < now.getTime() - 60 * 60 * 1000) continue
        const date = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
        const hour = `${pad(t.getHours())}:00`
        predictionHistory.savePrediction(SPOT, date, hour, {
          windSpeed: Math.round(h.windSpeed),
          windDirection: Math.round(h.windDirection),
          windGust: Math.round(h.windGust),
        })
      }
    }
  } catch {
    // silent
  }
}

export function ForecastVsRealChart() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      await syncForecast()
      await syncCurrent()
      const recent = predictionHistory
        .getRecentHistory(SPOT, 24)
        .slice()
        .reverse()
      const mapped: Row[] = recent.map((r) => ({
        label: `${r.date.slice(5)} ${r.hour}`,
        previst: r.predicted.windSpeed,
        real: r.actual?.windSpeed ?? null,
        errorKn: r.accuracy?.windSpeedError ?? null,
      }))
      if (!cancelled) {
        setRows(mapped)
        setLoading(false)
      }
    }

    tick()
    const interval = setInterval(tick, 10 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Previsió vs realitat</CardTitle>
        <CardDescription className="text-xs">
          Compara la previsió amb les lectures reals de Meteocat (s'omple amb el temps)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
        ) : rows.length < 2 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
            Encara no hi ha prou dades. Torna més endavant — l'app va guardant prediccions
            i lectures reals automàticament.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} unit=" kn" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="previst"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Previst"
              />
              <Line
                type="monotone"
                dataKey="real"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Real (Meteocat)"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
