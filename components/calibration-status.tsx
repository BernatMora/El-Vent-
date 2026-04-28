"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings2, History, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface CalibrationFactor {
  windSpeedFactor: number
  windGustFactor: number
  confidence: number
  sampleCount: number
}

interface HistoryEntry {
  id: string
  created_at: string
  predicted_wind_speed: number
  predicted_wind_gust: number
  predicted_wind_direction: number
  real_wind_speed: number
  real_wind_gust: number
  real_wind_direction: number
  wind_speed_factor: number
  wind_gust_factor: number
  notes?: string
}

export function CalibrationStatus() {
  const [factors, setFactors] = useState<Record<string, CalibrationFactor>>({})
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Carregar factors
        const factorsRes = await fetch("/api/calibration?type=factors")
        if (factorsRes.ok) {
          const data = await factorsRes.json()
          setFactors(data.factors || {})
        }

        // Carregar historial
        const historyRes = await fetch("/api/calibration?type=history")
        if (historyRes.ok) {
          const data = await historyRes.json()
          setHistory(data.history || [])
        }
      } catch (err) {
        console.error("Error carregant dades de calibratge:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const windDirections = [
    { key: "N", name: "Tramuntana" },
    { key: "NE", name: "Gregal" },
    { key: "E", name: "Llevant" },
    { key: "SE", name: "Xaloc" },
    { key: "S", name: "Migjorn" },
    { key: "SW", name: "Garbí" },
    { key: "W", name: "Ponent" },
    { key: "NW", name: "Mestral" },
  ]

  const getFactorIcon = (factor: number) => {
    if (factor > 1.05) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (factor < 0.95) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.7) return <Badge variant="default">Alta</Badge>
    if (confidence >= 0.4) return <Badge variant="secondary">Mitjana</Badge>
    return <Badge variant="outline">Baixa</Badge>
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ca-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Carregant dades de calibratge...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Sistema de Calibratge
        </CardTitle>
        <CardDescription>
          Factors de correcció apresos de les teves dades reals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="factors">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="factors">Factors Actuals</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="factors" className="mt-4">
            {Object.keys(factors).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Encara no hi ha factors de calibratge.</p>
                <p className="text-sm mt-2">Introdueix dades reals per començar a entrenar el sistema.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {windDirections.map(({ key, name }) => {
                  const factor = factors[key]
                  if (!factor) return null

                  return (
                    <div
                      key={key}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {key} - {name}
                        </span>
                        {getConfidenceBadge(factor.confidence)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          {getFactorIcon(factor.windSpeedFactor)}
                          <span className="text-muted-foreground">Vent:</span>
                          <span className="font-medium">
                            {factor.windSpeedFactor > 1 ? "+" : ""}
                            {((factor.windSpeedFactor - 1) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getFactorIcon(factor.windGustFactor)}
                          <span className="text-muted-foreground">Ràfega:</span>
                          <span className="font-medium">
                            {factor.windGustFactor > 1 ? "+" : ""}
                            {((factor.windGustFactor - 1) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Basat en {factor.sampleCount} observacions
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hi ha historial de calibratge.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((entry) => {
                  // Calcular direcció com a categoria
                  const getDirectionName = (deg: number) => {
                    if (deg >= 337.5 || deg < 22.5) return "N"
                    if (deg >= 22.5 && deg < 67.5) return "NE"
                    if (deg >= 67.5 && deg < 112.5) return "E"
                    if (deg >= 112.5 && deg < 157.5) return "SE"
                    if (deg >= 157.5 && deg < 202.5) return "S"
                    if (deg >= 202.5 && deg < 247.5) return "SW"
                    if (deg >= 247.5 && deg < 292.5) return "W"
                    return "NW"
                  }
                  const dirName = getDirectionName(entry.predicted_wind_direction || 0)
                  
                  return (
                    <div
                      key={entry.id}
                      className="p-3 border rounded-lg text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{dirName} ({entry.predicted_wind_direction}°)</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <span className="text-muted-foreground">Previst:</span>{" "}
                          {Math.round((entry.predicted_wind_speed || 0) * 1.852)} / {Math.round((entry.predicted_wind_gust || 0) * 1.852)} km/h
                        </div>
                        <div>
                          <span className="text-muted-foreground">Real:</span>{" "}
                          {Math.round((entry.real_wind_speed || 0) * 1.852)} / {Math.round((entry.real_wind_gust || 0) * 1.852)} km/h
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Factor:</span>{" "}
                          <span className={(entry.wind_speed_factor || 1) > 1 ? "text-green-600" : "text-amber-600"}>
                            x{(entry.wind_speed_factor || 1).toFixed(2)}
                          </span>
                          {" / "}
                          <span className={(entry.wind_gust_factor || 1) > 1 ? "text-green-600" : "text-amber-600"}>
                            x{(entry.wind_gust_factor || 1).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
