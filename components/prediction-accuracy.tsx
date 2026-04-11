"use client"

import { useEffect, useState } from "react"
import { BarChart3, CheckCircle, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { predictionHistory, AccuracyStats } from "@/lib/prediction-history"

const SPOT = "sant-pere-pescador"

export function PredictionAccuracy() {
  const [stats, setStats] = useState<AccuracyStats | null>(null)

  useEffect(() => {
    const loadStats = () => {
      const data = predictionHistory.getAccuracyStats(SPOT)
      setStats(data)
    }
    
    loadStats()
    // Actualitzar cada minut
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!stats || stats.verifiedPredictions === 0) {
    return (
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-lg text-slate-900">Precisio de les prediccions</CardTitle>
          </div>
          <CardDescription className="text-slate-600">
            Compara les prediccions amb les condicions reals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-600">
              Encara no hi ha dades de precisio. Quan reportis condicions reals, 
              podras veure com de precises son les prediccions.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600"
    if (accuracy >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 80) return "bg-green-500"
    if (accuracy >= 60) return "bg-amber-500"
    return "bg-red-500"
  }

  const getAccuracyLabel = (accuracy: number) => {
    if (accuracy >= 80) return "Molt precisa"
    if (accuracy >= 60) return "Acceptable"
    return "Poc precisa"
  }

  // Formatar data curta
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("ca-ES", { weekday: "short", day: "numeric" })
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-900">Precisio de les prediccions</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Basat en {stats.verifiedPredictions} verificacions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Puntuació general */}
        <div className="rounded-xl border border-blue-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Precisio global</span>
            <span className={`text-2xl font-bold ${getAccuracyColor(stats.overallAccuracy)}`}>
              {stats.overallAccuracy}%
            </span>
          </div>
          <Progress 
            value={stats.overallAccuracy} 
            className="h-2"
          />
          <div className="mt-2 flex items-center gap-1">
            <CheckCircle className={`h-4 w-4 ${getAccuracyColor(stats.overallAccuracy)}`} />
            <span className={`text-sm ${getAccuracyColor(stats.overallAccuracy)}`}>
              {getAccuracyLabel(stats.overallAccuracy)}
            </span>
          </div>
        </div>

        {/* Errors mitjans */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <div className="text-xs text-slate-500 mb-1">Error velocitat</div>
            <div className="text-lg font-semibold text-slate-800">
              {stats.averageWindSpeedError} kn
            </div>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <div className="text-xs text-slate-500 mb-1">Error direccio</div>
            <div className="text-lg font-semibold text-slate-800">
              {stats.averageDirectionError}°
            </div>
          </div>
        </div>

        {/* Grafic dels ultims 7 dies */}
        <div className="rounded-xl border border-blue-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Ultims 7 dies</span>
          </div>
          <div className="flex items-end gap-1 h-24">
            {stats.last7Days.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full rounded-t transition-all"
                  style={{ 
                    height: `${Math.max(4, day.accuracy * 0.8)}px`,
                    backgroundColor: day.predictions > 0 
                      ? (day.accuracy >= 80 ? "#22c55e" : day.accuracy >= 60 ? "#f59e0b" : "#ef4444")
                      : "#e2e8f0"
                  }}
                />
                <span className="text-[10px] text-slate-500">
                  {formatDate(day.date).split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nota informativa */}
        <p className="text-xs text-blue-600 text-center">
          Reporta les condicions reals per millorar la precisio
        </p>
      </CardContent>
    </Card>
  )
}
