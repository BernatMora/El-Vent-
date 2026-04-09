"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSpotStore } from "@/lib/store"
import { getProtectionStats, type ProtectionStats } from "@/lib/api"
import { Database, Wifi, TrendingUp, RefreshCw, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function EnhancedApiStatus() {
  const { selectedSpot } = useSpotStore()
  const [stats, setStats] = useState<ProtectionStats | null>(null)
  const [loading, setLoading] = useState(true)

  const updateStats = () => {
    setLoading(true)
    try {
      const protectionStats = getProtectionStats()
      setStats(protectionStats)
    } catch (error) {
      console.error('Error obtenint estadístiques:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    updateStats()
    const interval = setInterval(updateStats, 30000) // Actualitzar cada 30 segons
    return () => clearInterval(interval)
  }, [selectedSpot])

  if (loading || !stats) {
    return (
      <Card className="mb-4">
        <CardContent className="flex items-center justify-center p-4">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-sm">Carregant estat de dades i cache...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            Estat de dades i cache
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Com funciona l'estat de dades</DialogTitle>
                <DialogDescription>
                  Resum de cache, disponibilitat de fonts i control de cost per mantenir la previsió estable
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">🛡️ Cache Intel·ligent</h4>
                  <p className="text-sm text-muted-foreground">
                    Les dades es guarden localment durant 15-30 minuts. Milers d'usuaris poden compartir les mateixes dades cached.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📊 Límits Diaris</h4>
                  <p className="text-sm text-muted-foreground">
                    Màxim 100 crides API per dia. Si s'arriba al límit, s'usen dades simulades intel·ligents.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">📴 Mode Offline</h4>
                  <p className="text-sm text-muted-foreground">
                    Si no hi ha connexió o s'esgoten les crides, l'app segueix funcionant amb dades simulades realistes.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">🔑 Claus reals d'API</h4>
                  <p className="text-sm text-muted-foreground">
                    Si afegeixes <code>WEATHER_API_KEY</code>, <code>OPENWEATHER_API_KEY</code> o <code>METEOCAT_API_KEY</code> a Netlify, s'activaran automàticament al servidor.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cache Status */}
          <div className={`rounded-lg border p-3 ${
            stats.hitRate > 80 
              ? 'bg-gradient-to-br from-green-50 to-green-100' 
              : 'bg-gradient-to-br from-blue-50 to-blue-100'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Cache Intel·ligent</span>
              <Badge className={`text-xs ${stats.hitRate > 80 ? "bg-green-600" : "bg-blue-600"}`}>
                {stats.hitRate}% eficiència
              </Badge>
            </div>
            <div className="text-xs text-green-700">
              <div>Crides evitades: {stats.cacheHits}</div>
              <div>Darrera comprovació: {stats.lastUpdate}</div>
            </div>
          </div>

          {/* API Limits Status */}
          <div className={`rounded-lg border p-3 ${
            stats.isNearLimit 
              ? 'bg-gradient-to-br from-amber-50 to-amber-100' 
              : stats.offlineMode
                ? 'bg-gradient-to-br from-red-50 to-red-100'
                : 'bg-gradient-to-br from-blue-50 to-blue-100'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Connexió API</span>
              <Badge variant={stats.offlineMode ? "destructive" : stats.isNearLimit ? "secondary" : "default"} className="text-xs">
                {stats.offlineMode ? "Offline" : stats.isNearLimit ? "Prop límit" : "Connectat"}
              </Badge>
            </div>
            <div className="text-xs text-blue-700">
              <div>Estat: {stats.offlineMode ? "Sense connexió" : "Connectat"}</div>
              <div>Font: {stats.offlineMode ? "Dades de referència" : "Open-Meteo"}</div>
            </div>
          </div>

          {/* Cost Protection Status */}
          <div className="rounded-lg border p-3 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Protecció Costos</span>
              <Badge className="bg-green-600 text-xs">
                100% Gratuït
              </Badge>
            </div>
            <div className="text-xs text-green-700">
              <div>Estalvi: {stats.costSavings}</div>
              <div>Estat: {stats.status}</div>
            </div>
          </div>
        </div>

        {/* Indicador de protecció */}
        <div className="mt-4 rounded-lg border bg-gradient-to-r from-green-50 to-blue-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Cost controlat</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-xs">Protegit</Badge>
              <Button variant="ghost" size="sm" onClick={updateStats}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Sistema amb cache intel·ligent i límits estrictes per mantenir una previsió estable i sense sorpreses de cost.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}