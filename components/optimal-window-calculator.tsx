"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

export function OptimalWindowCalculator() {
  const { selectedSpot, userPreferences, setUserPreferences } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<any[]>([])
  const [optimalWindows, setOptimalWindows] = useState<any[]>([])
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false)
  const [preferences, setPreferences] = useState({
    windSpeed: {
      min: userPreferences.windSpeed?.min || 10,
      max: userPreferences.windSpeed?.max || 20,
    },
    windDirection: userPreferences.windDirection || ["E", "SE", "NE"],
    considerTemperature: userPreferences.considerTemperature || true,
    minTemperature: userPreferences.minTemperature || 18,
    considerWaves: userPreferences.considerWaves || true,
    maxWaveHeight: userPreferences.maxWaveHeight || 1.5,
  })

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true)
        const data = await getForecastData(selectedSpot)
        setForecast(data)
        calculateOptimalWindows(data, preferences)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [selectedSpot, preferences])

  const calculateOptimalWindows = (forecastData: any[], prefs: any) => {
    if (!forecastData || forecastData.length === 0) return

    const windows = forecastData.map((day) => {
      const dayWindows = day.hours
        .filter((hour: any) => {
          const hourNum = Number.parseInt(hour.time.split(":")[0])
          return hourNum >= 9 && hourNum <= 21 // Solo horas de luz
        })
        .map((hour: any) => {
          // Si no hay viento, puntuación baja
          if (hour.windSpeed === 0) {
            return {
              time: hour.time,
              windSpeed: 0,
              windDirection: 0,
              directionName: "-",
              temperature: hour.temperature || 22,
              waveHeight: "0.0",
              score: 0,
              optimalLevel: "low",
              details: {
                windSpeedScore: 0,
                windDirectionScore: 0,
                temperatureScore: 100,
                wavesScore: 100,
              },
            }
          }

          // Calcular puntuación para cada factor
          let windSpeedScore = 0
          if (hour.windSpeed >= prefs.windSpeed.min && hour.windSpeed <= prefs.windSpeed.max) {
            // Puntuación máxima si está en el rango ideal
            windSpeedScore = 100
          } else if (hour.windSpeed < prefs.windSpeed.min) {
            // Puntuación reducida si está por debajo del mínimo
            windSpeedScore = Math.max(0, 70 - (prefs.windSpeed.min - hour.windSpeed) * 10)
          } else {
            // Puntuación reducida si está por encima del máximo
            windSpeedScore = Math.max(0, 70 - (hour.windSpeed - prefs.windSpeed.max) * 5)
          }

          // Puntuación de dirección del viento
          let windDirectionScore = 0
          const directionName = getWindDirectionName(hour.windDirection)
          if (prefs.windDirection.includes(directionName)) {
            windDirectionScore = 100
          } else {
            // Calcular la "cercanía" a las direcciones preferidas
            const closestScore = prefs.windDirection.map((dir: string) => {
              const dirDegree = getDirectionDegree(dir)
              const diff = Math.min(
                Math.abs(hour.windDirection - dirDegree),
                360 - Math.abs(hour.windDirection - dirDegree),
              )
              return Math.max(0, 100 - diff * 1.5)
            })
            windDirectionScore = Math.max(...closestScore)
          }

          // Puntuación de temperatura
          let temperatureScore = 100
          if (prefs.considerTemperature && hour.temperature < prefs.minTemperature) {
            temperatureScore = Math.max(0, 70 - (prefs.minTemperature - hour.temperature) * 10)
          }

          // Puntuación de olas (simulada)
          let wavesScore = 100
          const simulatedWaveHeight = (hour.windSpeed / 10) * 0.5 + Math.random() * 0.5
          if (prefs.considerWaves && simulatedWaveHeight > prefs.maxWaveHeight) {
            wavesScore = Math.max(0, 70 - (simulatedWaveHeight - prefs.maxWaveHeight) * 20)
          }

          // Puntuación total (ponderada)
          const totalScore =
            windSpeedScore * 0.4 + windDirectionScore * 0.3 + temperatureScore * 0.15 + wavesScore * 0.15

          // Determinar el nivel de optimalidad
          let optimalLevel = "low"
          if (totalScore >= 80) optimalLevel = "high"
          else if (totalScore >= 60) optimalLevel = "medium"

          return {
            time: hour.time,
            windSpeed: hour.windSpeed,
            windDirection: hour.windDirection,
            directionName: directionName,
            temperature: hour.temperature || 22, // Valor por defecto si no hay datos
            waveHeight: simulatedWaveHeight.toFixed(1),
            score: Math.round(totalScore),
            optimalLevel,
            details: {
              windSpeedScore,
              windDirectionScore,
              temperatureScore,
              wavesScore,
            },
          }
        })

      return {
        date: day.date,
        windows: dayWindows,
      }
    })

    setOptimalWindows(windows)
  }

  const getWindDirectionName = (direction: number) => {
    if (direction === 0) return "-" // No wind direction
    if (direction >= 337.5 || direction < 22.5) return "N"
    if (direction >= 22.5 && direction < 67.5) return "NE"
    if (direction >= 67.5 && direction < 112.5) return "E"
    if (direction >= 112.5 && direction < 157.5) return "SE"
    if (direction >= 157.5 && direction < 202.5) return "S"
    if (direction >= 202.5 && direction < 247.5) return "SW"
    if (direction >= 247.5 && direction < 292.5) return "W"
    return "NW"
  }

  const getDirectionDegree = (directionName: string) => {
    const directionMap: Record<string, number> = {
      N: 0,
      NE: 45,
      E: 90,
      SE: 135,
      S: 180,
      SW: 225,
      W: 270,
      NW: 315,
    }
    return directionMap[directionName] || 0
  }

  const handleSavePreferences = () => {
    setUserPreferences({
      ...userPreferences,
      ...preferences,
    })
    setPreferencesDialogOpen(false)
    calculateOptimalWindows(forecast, preferences)
  }

  const getOptimalLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-green-500"
      case "medium":
        return "bg-amber-500"
      case "low":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  const getOptimalLevelText = (level: string) => {
    switch (level) {
      case "high":
        return "Òptim"
      case "medium":
        return "Acceptable"
      case "low":
        return "No recomanat"
      default:
        return "Desconegut"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Calculadora de Finestra Òptima</CardTitle>
          <CardDescription>Troba les millors hores per navegar segons les teves preferències</CardDescription>
        </div>
        <Dialog open={preferencesDialogOpen} onOpenChange={setPreferencesDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Preferències de navegació</DialogTitle>
              <DialogDescription>
                Configura les teves condicions ideals per obtenir recomanacions personalitzades
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Velocitat del vent (nusos)</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mínim: {preferences.windSpeed.min} kn</span>
                  <span className="text-sm text-muted-foreground">Màxim: {preferences.windSpeed.max} kn</span>
                </div>
                <div className="px-1">
                  <Slider
                    defaultValue={[preferences.windSpeed.min, preferences.windSpeed.max]}
                    min={5}
                    max={40}
                    step={1}
                    onValueChange={(value) =>
                      setPreferences({
                        ...preferences,
                        windSpeed: { min: value[0], max: value[1] },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Direccions de vent preferides</Label>
                <RadioGroup
                  className="grid grid-cols-4 gap-2"
                  value={preferences.windDirection.join(",")}
                  onValueChange={(value) =>
                    setPreferences({
                      ...preferences,
                      windDirection: value.split(","),
                    })
                  }
                >
                  {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((dir) => (
                    <div key={dir} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={dir}
                        id={`dir-${dir}`}
                        checked={preferences.windDirection.includes(dir)}
                        onClick={() => {
                          let newDirs = [...preferences.windDirection]
                          if (newDirs.includes(dir)) {
                            newDirs = newDirs.filter((d) => d !== dir)
                          } else {
                            newDirs.push(dir)
                          }
                          setPreferences({
                            ...preferences,
                            windDirection: newDirs,
                          })
                        }}
                      />
                      <Label htmlFor={`dir-${dir}`}>{dir}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="consider-temp">Considerar temperatura</Label>
                  <Switch
                    id="consider-temp"
                    checked={preferences.considerTemperature}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        considerTemperature: checked,
                      })
                    }
                  />
                </div>

                {preferences.considerTemperature && (
                  <div className="space-y-2">
                    <Label>Temperatura mínima: {preferences.minTemperature}°C</Label>
                    <Slider
                      defaultValue={[preferences.minTemperature]}
                      min={10}
                      max={30}
                      step={1}
                      onValueChange={(value) =>
                        setPreferences({
                          ...preferences,
                          minTemperature: value[0],
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="consider-waves">Considerar onades</Label>
                  <Switch
                    id="consider-waves"
                    checked={preferences.considerWaves}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        considerWaves: checked,
                      })
                    }
                  />
                </div>

                {preferences.considerWaves && (
                  <div className="space-y-2">
                    <Label>Alçada màxima d'onades: {preferences.maxWaveHeight} m</Label>
                    <Slider
                      defaultValue={[preferences.maxWaveHeight]}
                      min={0.5}
                      max={3}
                      step={0.1}
                      onValueChange={(value) =>
                        setPreferences({
                          ...preferences,
                          maxWaveHeight: value[0],
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSavePreferences}>Guardar preferències</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="0">
          <TabsList className="grid w-full grid-cols-3">
            {optimalWindows.map((day, index) => (
              <TabsTrigger key={day.date} value={index.toString()}>
                {index === 0 ? "Avui" : index === 1 ? "Demà" : formatDate(day.date)}
              </TabsTrigger>
            ))}
          </TabsList>

          {optimalWindows.map((day, dayIndex) => (
            <TabsContent key={day.date} value={dayIndex.toString()}>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mb-2 text-sm text-muted-foreground">{formatDate(day.date)}</div>

                  <div className="grid grid-cols-1 gap-2">
                    {day.windows.map((window: any) => (
                      <div
                        key={window.time}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          window.optimalLevel === "high" ? "border-green-200 bg-green-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-4 w-4 rounded-full ${getOptimalLevelColor(window.optimalLevel)}`}
                            title={getOptimalLevelText(window.optimalLevel)}
                          ></div>
                          <div className="font-medium">{window.time}</div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{Math.round(window.windSpeed)} kn</span>
                            <span className="text-xs text-muted-foreground">({window.directionName})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {window.temperature}°C | {window.waveHeight}m
                          </div>
                          <Badge
                            variant={
                              window.optimalLevel === "high"
                                ? "default"
                                : window.optimalLevel === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              window.optimalLevel === "high"
                                ? "bg-green-600"
                                : window.optimalLevel === "medium"
                                  ? "bg-amber-600"
                                  : ""
                            }
                          >
                            {window.score}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border p-3">
                    <div className="mb-2 text-sm font-medium">Llegenda</div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-xs">Òptim (80-100%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                        <span className="text-xs">Acceptable (60-79%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="text-xs">No recomanat (0-59%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
