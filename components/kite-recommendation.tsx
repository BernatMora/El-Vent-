"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"
import { BirdIcon as Kite, User } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getForecastData } from "@/lib/api"
import { formatDate } from "@/lib/utils"

export function KiteRecommendation() {
  const { selectedSpot, userPreferences, setUserPreferences } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState<any[]>([])
  const [weight, setWeight] = useState(userPreferences.weight)
  const [level, setLevel] = useState(userPreferences.level)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true)
        const data = await getForecastData(selectedSpot)
        setForecast(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [selectedSpot])

  // Update the getKiteSize function to handle no wind

  const getKiteSize = (windSpeed: number, userWeight: number, userLevel: string) => {
    // Si no hay viento, no se recomienda ninguna cometa
    if (windSpeed === 0) return "No recomanat"

    // Ajuste base según el nivel del usuario
    let adjustment = 0
    if (userLevel === "beginner") adjustment = 2 // Principiantes: cometas más grandes
    if (userLevel === "advanced") adjustment = -1 // Avanzados: cometas más pequeñas

    // Ajuste según el peso (riders más pesados necesitan cometas más grandes)
    const weightAdjustment = (userWeight - 75) / 15 // Cada 15kg de diferencia ajusta ~1m²

    // Cálculo más realista
    if (windSpeed < 8)
      return `${Math.round(14 + adjustment + weightAdjustment)}-${Math.round(17 + adjustment + weightAdjustment)}m²`
    if (windSpeed < 12)
      return `${Math.round(12 + adjustment + weightAdjustment)}-${Math.round(14 + adjustment + weightAdjustment)}m²`
    if (windSpeed < 16)
      return `${Math.round(9 + adjustment + weightAdjustment)}-${Math.round(12 + adjustment + weightAdjustment)}m²`
    if (windSpeed < 20)
      return `${Math.round(7 + adjustment + weightAdjustment)}-${Math.round(9 + adjustment + weightAdjustment)}m²`
    return `${Math.round(5 + adjustment + weightAdjustment)}-${Math.round(7 + adjustment + weightAdjustment)}m²`
  }

  // Preparar datos para mostrar
  const prepareHourlyData = (dayIndex: number) => {
    if (!forecast || forecast.length === 0 || !forecast[dayIndex]) return []

    // Filtrar horas relevantes (10:00, 13:00, 16:00, 19:00)
    const targetHours = ["10:00", "13:00", "16:00", "19:00"]
    const day = forecast[dayIndex]

    return day.hours
      .filter((hour: any) => {
        const hourTime = hour.time.split(":")[0] + ":00"
        return targetHours.includes(hourTime)
      })
      .map((hour: any) => ({
        time: hour.time,
        windSpeed: Math.round(hour.windSpeed),
        kiteSize: getKiteSize(hour.windSpeed, weight, level),
      }))
  }

  const handleSavePreferences = () => {
    setUserPreferences({ weight, level })
    setOpen(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Kite className="mr-2 h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Recomendación de cometa</CardTitle>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <User className="h-4 w-4" />
                <span className="sr-only">Configurar perfil</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Perfil de rider</DialogTitle>
                <DialogDescription>
                  Actualiza tus datos para obtener recomendaciones de cometa personalizadas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="weight" className="text-right">
                    Peso (kg)
                  </Label>
                  <Input
                    id="weight"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    type="number"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="level" className="text-right">
                    Nivel
                  </Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona tu nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Principiante</SelectItem>
                      <SelectItem value="intermediate">Intermedio</SelectItem>
                      <SelectItem value="advanced">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleSavePreferences}>
                  Guardar cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>Basado en tu peso ({weight}kg) y nivel</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || forecast.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            <Tabs defaultValue="0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="0">Hoy</TabsTrigger>
                <TabsTrigger value="1">Mañana</TabsTrigger>
              </TabsList>

              {[0, 1].map((dayIndex) => (
                <TabsContent key={dayIndex} value={dayIndex.toString()} className="mt-2 space-y-2">
                  <div className="mb-1 text-xs text-muted-foreground">
                    {forecast[dayIndex] ? formatDate(forecast[dayIndex].date) : ""}
                  </div>

                  {/* Update the JSX where the kite size is displayed */}
                  {prepareHourlyData(dayIndex).map((data: any) => (
                    <div key={data.time} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{data.time}</span>
                        <Badge variant="outline">{data.windSpeed} kts</Badge>
                      </div>
                      <Badge className={data.windSpeed === 0 ? "bg-gray-400" : "bg-blue-600"}>{data.kiteSize}</Badge>
                    </div>
                  ))}

                  {prepareHourlyData(dayIndex).length === 0 && (
                    <div className="rounded-lg border p-3 text-center text-sm text-muted-foreground">
                      No hay datos disponibles para este día
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
