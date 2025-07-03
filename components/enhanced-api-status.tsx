"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSpotStore } from "@/lib/store"
import { getEnhancedStats } from "@/lib/api"
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
      const enhancedStats = getEnhancedStats(selectedSpot)
      setStats(enhancedStats)
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
            Sistema de Predicció Avançat
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Sistema de Predicció Meteorològica Avançat</DialogTitle>
                <DialogDescription>
                  Detalls sobre com funciona el nostre sistema multi-font amb Intel·ligència Artificial
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">🌐 Múltiples Fonts de Dades</h4>
                  <p className="text-sm text-muted-foreground">
                    Combinem dades de Open-Meteo, WeatherAPI i OpenWeatherMap per obtenir la informació més precisa possible.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🤖 Machine Learning</h4>
                  <p className="text-sm text-muted-foreground">
                    El nostre sistema aprèn de les observacions reals dels usuaris per millorar constantment les prediccions locals.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">👥 Calibració d'Usuaris</h4>
                  <p className="text-sm text-muted-foreground">
                    Els reportes dels kiters locals ajusten automàticament les prediccions per cada spot específic.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Multi-API Status */}
          <div className="rounded-lg border p-3 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Múltiples APIs</span>
              <Badge className="bg-blue-600 text-xs">
                {stats.multiApi.status}
              </Badge>
            </div>
            <div className="text-xs text-blue-700">
              <div>Fonts: {stats.multiApi.sources.length}</div>
              <div>Última actualització: {stats.lastUpdate}</div>
            </div>
          </div>

          {/* Machine Learning Status */}
          <div className={`rounded-lg border p-3 ${
            stats.machineLearning.enabled 
              ? 'bg-gradient-to-br from-purple-50 to-purple-100' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">Machine Learning</span>
              <Badge variant={stats.machineLearning.enabled ? "default" : "secondary"} className="text-xs">
                {stats.machineLearning.enabled ? "Actiu" : "Entrenant"}
              </Badge>
            </div>
            <div className="text-xs text-purple-700">
              <div>Dades: {stats.machineLearning.dataPoints}</div>
              <div>Precisió: {stats.machineLearning.accuracy}%</div>
              {stats.machineLearning.lastTrained !== 'Mai' && (
                <div>Entrenat: {stats.machineLearning.lastTrained}</div>
              )}
            </div>
          </div>

          {/* User Calibration Status */}
          <div className={`rounded-lg border p-3 ${
            stats.userCalibration.enabled 
              ? 'bg-gradient-to-br from-green-50 to-green-100' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Calibració Usuaris</span>
              <Badge variant={stats.userCalibration.enabled ? "default" : "secondary"} className="text-xs">
                {stats.userCalibration.enabled ? "Actiu" : "Inactiu"}
              </Badge>
            </div>
            <div className="text-xs text-green-700">
              <div>Reportes: {stats.userCalibration.observations}</div>
              {stats.userCalibration.enabled && (
                <>
                  <div>Ajust velocitat: {stats.userCalibration.speedAdjustment > 0 ? '+' : ''}{stats.userCalibration.speedAdjustment}%</div>
                  <div>Ajust direcció: {stats.userCalibration.directionAdjustment > 0 ? '+' : ''}{stats.userCalibration.directionAdjustment}°</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Indicador de qualitat general */}
        <div className="mt-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Qualitat de Predicció</span>
            </div>
            <div className="flex items-center gap-2">
              {stats.machineLearning.enabled && stats.userCalibration.enabled ? (
                <Badge className="bg-green-600 text-xs">Excel·lent</Badge>
              ) : stats.machineLearning.enabled || stats.userCalibration.enabled ? (
                <Badge className="bg-blue-600 text-xs">Bona</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Estàndard</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={updateStats}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {stats.machineLearning.enabled && stats.userCalibration.enabled 
              ? "Sistema completament optimitzat amb IA i calibració d'usuaris"
              : stats.machineLearning.enabled 
                ? "Sistema millorat amb Intel·ligència Artificial"
                : stats.userCalibration.enabled
                  ? "Sistema calibrat per reportes d'usuaris"
                  : "Sistema estàndard - Envia reportes per millorar la precisió"
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
}