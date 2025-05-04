"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Cloud, CloudRain, Sun, Umbrella } from "lucide-react"

export function CurrentConditions() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<any>(null)
  const [userReports, setUserReports] = useState<any[]>([])
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [newReport, setNewReport] = useState({
    windSpeed: "",
    windDirection: "NE",
    comment: "",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCurrentData() {
      try {
        setLoading(true)
        setError(null)
        console.log("Cargando datos para spot:", selectedSpot)
        const data = await getForecastData(selectedSpot)

        if (data && data.length > 0) {
          const now = new Date()
          const hour = now.getHours()

          // Encontrar la hora más cercana en los datos
          let closestHour = data[0].hours[0]
          let minDiff = 24

          data[0].hours.forEach((h: any) => {
            const hourNum = Number.parseInt(h.time.split(":")[0])
            const diff = Math.abs(hourNum - hour)
            if (diff < minDiff) {
              minDiff = diff
              closestHour = h
            }
          })

          console.log("Hora más cercana encontrada:", closestHour)

          // Verificar que los datos de viento sean válidos
          if (typeof closestHour.windSpeed !== "number" || isNaN(closestHour.windSpeed)) {
            console.error("Velocidad del viento inválida:", closestHour.windSpeed)
            closestHour.windSpeed = 10 // Valor por defecto
          }

          if (typeof closestHour.windGust !== "number" || isNaN(closestHour.windGust)) {
            console.error("Ráfaga de viento inválida:", closestHour.windGust)
            closestHour.windGust = closestHour.windSpeed * 1.5 // Valor por defecto
          }

          setCurrentData({
            ...closestHour,
            date: data[0].date,
          })
        } else {
          throw new Error("No se recibieron datos válidos")
        }
      } catch (err) {
        console.error("Error cargando datos actuales:", err)
        setError("Error al cargar los datos. Por favor, intenta de nuevo.")

        // Establecer datos de fallback para que la UI no se rompa
        setCurrentData({
          time: new Date().getHours() + ":00",
          windSpeed: 10,
          windDirection: 90,
          windGust: 15,
          temperature: 20,
          date: new Date().toISOString().split("T")[0],
        })
      } finally {
        setLoading(false)
      }
    }

    loadCurrentData()
    loadUserReports()
  }, [selectedSpot])

  // Función para cargar reportes de usuarios
  async function loadUserReports() {
    try {
      const response = await fetch(`/api/user-reports?spot=${encodeURIComponent(selectedSpot)}`)

      if (response.ok) {
        const reports = await response.json()
        console.log("Reportes de usuarios cargados:", reports)
        setUserReports(Array.isArray(reports) ? reports : [])
      } else {
        console.error("Error en respuesta de API de reportes:", response.status)
        setUserReports([])
      }
    } catch (error) {
      console.error("Error cargando reportes de usuarios:", error)
      setUserReports([])
    }
  }

  const handleReportSubmit = async () => {
    const windSpeedNum = Number.parseInt(newReport.windSpeed)

    if (isNaN(windSpeedNum) || windSpeedNum <= 0) {
      alert("Si us plau, introdueix una velocitat de vent vàlida")
      return
    }

    try {
      setReportDialogOpen(false)

      // Enviar reporte al backend
      const response = await fetch(`/api/user-reports?spot=${encodeURIComponent(selectedSpot)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          windSpeed: windSpeedNum,
          windDirection: newReport.windDirection,
          comment: newReport.comment,
          user: "Tu", // Podría ser un nombre de usuario real en una implementación completa
        }),
      })

      if (!response.ok) {
        throw new Error("Error al enviar el reporte")
      }

      const newUserReport = await response.json()
      console.log("Nuevo reporte enviado:", newUserReport)

      // Actualizar la UI con el nuevo reporte
      setUserReports([newUserReport, ...userReports])

      // Resetear el formulario
      setNewReport({
        windSpeed: "",
        windDirection: "NE",
        comment: "",
      })
    } catch (error) {
      console.error("Error al enviar reporte:", error)
      alert("No se pudo enviar el reporte. Inténtalo de nuevo.")
    }
  }

  // Función para obtener el nombre del viento según su dirección
  const getWindName = (direction: number) => {
    if (direction >= 337.5 || direction < 22.5) return "Tramuntana"
    if (direction >= 22.5 && direction < 67.5) return "Gregal"
    if (direction >= 67.5 && direction < 112.5) return "Llevant"
    if (direction >= 112.5 && direction < 157.5) return "Xaloc"
    if (direction >= 157.5 && direction < 202.5) return "Migjorn"
    if (direction >= 202.5 && direction < 247.5) return "Llebeig"
    if (direction >= 247.5 && direction < 292.5) return "Ponent"
    if (direction >= 292.5 && direction < 337.5) return "Mestral"
    return "Tramuntana"
  }

  // Función para renderizar la flecha de dirección del viento
  const renderWindArrow = (direction: number, windSpeed: number) => {
    // Si no hay viento, mostrar un icono diferente
    if (windSpeed === 0) {
      return (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
      )
    }

    // La flecha debe apuntar HACIA DONDE va el viento
    // Necesitamos rotar 180 grados porque en meteorología la dirección indica de donde viene
    const rotationDegree = (direction + 180) % 360

    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: `rotate(${rotationDegree}deg)` }}
        >
          <path
            d="M12 4L4 20L12 17L20 20L12 4Z"
            fill="#1d4ed8"
            stroke="#1d4ed8"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  // Convertir nudos a km/h
  const knotsToKmh = (knots: number) => {
    return Math.round(knots * 1.852)
  }

  // Formatear la hora para mostrar "hace X minutos/horas"
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.round(diffMs / 60000)

      if (diffMins < 1) return "Fa uns segons"
      if (diffMins < 60) return `Fa ${diffMins} min`

      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `Fa ${diffHours} h`

      const diffDays = Math.floor(diffHours / 24)
      return `Fa ${diffDays} dies`
    } catch (e) {
      return dateString
    }
  }

  // Función para renderizar el icono del clima
  const renderWeatherIcon = () => {
    if (!currentData || !currentData.weather) return null

    const weather = currentData.weather.toLowerCase()
    const rain = currentData.rain > 0

    if (rain) {
      return <CloudRain className="h-10 w-10 text-blue-500" />
    } else if (weather === "clouds" || currentData.clouds > 70) {
      return <Cloud className="h-10 w-10 text-gray-500" />
    } else if (weather === "clear") {
      return <Sun className="h-10 w-10 text-yellow-500" />
    } else {
      return <Cloud className="h-10 w-10 text-gray-400" />
    }
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex flex-col items-center md:items-start">
                <h2 className="mb-1 text-xl font-bold">Condicions Actuals</h2>
                <p className="text-sm text-muted-foreground">
                  {loading ? "Carregant..." : `Actualitzat a les ${currentData?.time || "00:00"}`}
                </p>
              </div>

              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Reportar vent actual
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Reportar condicions actuals</DialogTitle>
                    <DialogDescription>Comparteix les condicions actuals de vent amb altres riders.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="windSpeed" className="text-right">
                        Vent (kn)
                      </Label>
                      <Input
                        id="windSpeed"
                        value={newReport.windSpeed}
                        onChange={(e) => setNewReport({ ...newReport, windSpeed: e.target.value })}
                        type="number"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="windDirection" className="text-right">
                        Direcció
                      </Label>
                      <Select
                        value={newReport.windDirection}
                        onValueChange={(value) => setNewReport({ ...newReport, windDirection: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecciona direcció" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N">Tramuntana (N)</SelectItem>
                          <SelectItem value="NE">Gregal (NE)</SelectItem>
                          <SelectItem value="E">Llevant (E)</SelectItem>
                          <SelectItem value="SE">Xaloc (SE)</SelectItem>
                          <SelectItem value="S">Migjorn (S)</SelectItem>
                          <SelectItem value="SW">Llebeig (SW)</SelectItem>
                          <SelectItem value="W">Ponent (W)</SelectItem>
                          <SelectItem value="NW">Mestral (NW)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="comment" className="text-right">
                        Comentari
                      </Label>
                      <Input
                        id="comment"
                        value={newReport.comment}
                        onChange={(e) => setNewReport({ ...newReport, comment: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleReportSubmit}>
                      Enviar reporte
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="mt-6 flex flex-col items-center gap-4 md:flex-row md:justify-around">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ) : error ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800">
                {error}
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Recargar página
                </Button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-8 md:flex-row md:justify-around">
                <div className="flex flex-col items-center">
                  {renderWindArrow(currentData?.windDirection || 0, currentData?.windSpeed || 0)}
                  <div className="mt-2 text-center">
                    {currentData?.windSpeed === 0 ? (
                      <div className="text-sm font-medium">Sense vent</div>
                    ) : (
                      <>
                        <div className="text-sm font-medium">{currentData?.windDirection}°</div>
                        <div className="text-xs text-muted-foreground">
                          {getWindName(currentData?.windDirection || 0)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className={`text-5xl font-bold ${currentData?.windSpeed === 0 ? "text-gray-400" : "text-blue-600"}`}
                  >
                    {Math.round(currentData?.windSpeed || 0)}
                    <span className="text-2xl">kn</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Velocitat del vent ({knotsToKmh(currentData?.windSpeed || 0)} km/h)
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className={`text-3xl font-bold ${currentData?.windGust === 0 ? "text-gray-400" : "text-amber-500"}`}
                  >
                    {Math.round(currentData?.windGust || 0)}
                    <span className="text-xl">kn</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ràfegues ({knotsToKmh(currentData?.windGust || 0)} km/h)
                  </div>
                </div>
              </div>
            )}

            {/* Información del clima */}
            {!loading && currentData && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 rounded-lg border bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  {renderWeatherIcon()}
                  <div>
                    <div className="font-medium">
                      {currentData.weatherDescription || (currentData.rain > 0 ? "Pluja" : "Sense dades")}
                    </div>
                    {currentData.rain > 0 && (
                      <div className="text-sm text-blue-600">
                        <Umbrella className="mr-1 inline-block h-4 w-4" />
                        {currentData.rain.toFixed(1)} mm/h
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">{currentData.temperature}°C</div>
                  <div className="text-sm text-muted-foreground">Temperatura</div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-medium">{currentData.humidity}%</div>
                  <div className="text-sm text-muted-foreground">Humitat</div>
                </div>

                {currentData.clouds !== undefined && (
                  <div className="text-center">
                    <div className="text-xl font-medium">{currentData.clouds}%</div>
                    <div className="text-sm text-muted-foreground">Núvols</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-medium">Últims reportes d'usuaris</h3>
            {userReports.length > 0 ? (
              <div className="space-y-4">
                {userReports.map((report) => (
                  <div key={report.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium">{report.user}</div>
                      <div className="text-xs text-muted-foreground">{formatTimeAgo(report.time)}</div>
                    </div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        {report.windSpeed} kn
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        {report.windDirection}
                      </span>
                    </div>
                    {report.comment && <p className="text-sm">{report.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                No hi ha reportes recents
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
