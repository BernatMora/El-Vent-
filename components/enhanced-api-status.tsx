"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSpotStore } from "@/lib/store"
import { getProtectionStats } from "@/lib/api"
import { Brain, Database, Users, Wifi, TrendingUp, RefreshCw, Info } from "lucide-react"
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
  const [stats, setStats] = useState<any>(null)
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
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Carregant estadístiques del sistema...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Sistema Protegit - Només Dades Reals</span>
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Sistema Sense Dades Simulades</DialogTitle>
                <DialogDescription>
                  Com garantim que només mostrem dades meteorològiques reals
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">🌐 Només Dades Reals</h4>
                  <p className="text-sm text-muted-foreground">
                    Totes les dades provenen d'APIs meteorològiques professionals. Mai mostrem dades inventades.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📡 Estat de Connexió</h4>
                  <p className="text-sm text-muted-foreground">
                    Si no hi ha connexió o s'esgoten les crides API, l'app mostra clarament "Sense connexió".
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🛡️ Cache Intel·ligent</h4>
                  <p className="text-sm text-muted-foreground">
                    Les dades reals es guarden temporalment per evitar crides innecessàries, però sempre són dades reals.
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
              <Badge className={stats.hitRate > 80 ? "bg-green-600" : "bg-blue-600"} className="text-xs">
                {stats.hitRate}% eficiència
              </Badge>
            </div>
            <div className="text-xs text-green-700">
              <div>Crides evitades: {stats.cacheHits}</div>
              <div>Última actualització: {stats.lastUpdate}</div>
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
              <span className="font-medium text-sm">Límits API</span>
              <Badge variant={stats.offlineMode ? "destructive" : stats.isNearLimit ? "secondary" : "default"} className="text-xs">
                {stats.offlineMode ? "Offline" : stats.isNearLimit ? "Prop límit" : "OK"}
              </Badge>
            </div>
            <div className="text-xs text-blue-700">
              <div>Crides avui: {stats.dailyApiCalls}/100</div>
              <div>Restants: {stats.remainingCalls}</div>
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
              <span className="font-medium text-sm">Garantia de Dades Reals</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-xs">Només Reals</Badge>
              <Button variant="ghost" size="sm" onClick={updateStats}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Mai mostrem dades simulades o inventades. Si no hi ha connexió, l'app ho indica clarament.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}