"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings2,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react"

interface CalibrationFactor {
  windSpeedFactor: number
  windGustFactor: number
  confidence: number
  sampleCount: number
  lastUpdated: string | null
}

interface HistoryEntry {
  timestamp: string
  direction: number
  directionCategory: string
  predictedWindSpeed: number
  predictedWindGust: number
  realWindSpeed: number
  realWindGust: number
  windSpeedFactor: number
  windGustFactor: number
  station: string
}

interface StatusResponse {
  lastRun: string | null
  nextRunDueAt: string | null
  intervalMinutes: number
  totalSamples: number
  factors: Record<string, CalibrationFactor>
}

const WIND_DIRECTIONS = [
  { key: "N", name: "Tramuntana" },
  { key: "NE", name: "Gregal" },
  { key: "E", name: "Llevant" },
  { key: "SE", name: "Xaloc" },
  { key: "S", name: "Migjorn" },
  { key: "SW", name: "Garbí" },
  { key: "W", name: "Ponent" },
  { key: "NW", name: "Mestral" },
]

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("ca-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getFactorIcon(factor: number) {
  if (factor > 1.05) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (factor < 0.95) return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 0.7) return <Badge variant="default">Alta</Badge>
  if (confidence >= 0.4) return <Badge variant="secondary">Mitjana</Badge>
  return <Badge variant="outline">Baixa</Badge>
}

export function CalibrationStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isForcing, setIsForcing] = useState(false)

  async function loadAll() {
    try {
      const [s, h] = await Promise.all([
        fetch("/api/calibration?type=status").then((r) => r.json()),
        fetch("/api/calibration?type=history").then((r) => r.json()),
      ])
      setStatus(s)
      setHistory(h.history || [])
    } catch (err) {
      console.error("Error carregant calibratge:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    const id = setInterval(loadAll, 60_000)
    return () => clearInterval(id)
  }, [])

  async function forceRun() {
    setIsForcing(true)
    try {
      await fetch("/api/calibration?force=1", { method: "POST" })
      await loadAll()
    } finally {
      setIsForcing(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Carregant dades de calibratge…</p>
        </CardContent>
      </Card>
    )
  }

  const factors = status?.factors ?? {}

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Calibratge automàtic
            </CardTitle>
            <CardDescription>
              Compara cada {status?.intervalMinutes ?? 30} min la previsió Open-Meteo amb la
              dada real de Meteocat (XEMA).
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={forceRun}
            disabled={isForcing}
          >
            <RefreshCw className={`h-4 w-4 ${isForcing ? "animate-spin" : ""} mr-1`} />
            Calibrar ara
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
          <div>
            <p className="text-muted-foreground">Última passada</p>
            <p className="font-medium">{formatDate(status?.lastRun ?? null)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pròxima passada</p>
            <p className="font-medium">{formatDate(status?.nextRunDueAt ?? null)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Mostres totals</p>
            <p className="font-medium">{status?.totalSamples ?? 0}</p>
          </div>
        </div>

        <Tabs defaultValue="factors">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="factors">Factors per direcció</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-1" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="factors" className="mt-4">
            {Object.keys(factors).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Encara no hi ha factors de calibratge.</p>
                <p className="text-sm mt-2">
                  Quan hi hagi vent suficient, el sistema començarà a calibrar
                  automàticament cada 30 minuts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {WIND_DIRECTIONS.map(({ key, name }) => {
                  const f = factors[key]
                  if (!f) {
                    return (
                      <div
                        key={key}
                        className="p-3 border rounded-lg opacity-50 text-sm"
                      >
                        <p className="font-medium">{name}</p>
                        <p className="text-muted-foreground text-xs">Sense dades</p>
                      </div>
                    )
                  }
                  return (
                    <div key={key} className="p-3 border rounded-lg space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{name}</p>
                        {getConfidenceBadge(f.confidence)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getFactorIcon(f.windSpeedFactor)}
                        <span>Vent ×{f.windSpeedFactor.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getFactorIcon(f.windGustFactor)}
                        <span>Ràfega ×{f.windGustFactor.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {f.sampleCount} mostres · {formatDate(f.lastUpdated)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Encara no hi ha historial.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((h, idx) => (
                  <div
                    key={`${h.timestamp}-${idx}`}
                    className="p-2 border rounded text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">
                        {h.directionCategory} · {formatDate(h.timestamp)}
                      </p>
                      <p className="text-muted-foreground">
                        Real {h.realWindSpeed} kts · Previst {h.predictedWindSpeed} kts ·{" "}
                        {h.station}
                      </p>
                    </div>
                    <Badge variant="outline">×{h.windSpeedFactor.toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
