"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { WindReportDialog } from "@/components/wind-report-dialog"
import { UserReportsPanel } from "@/components/user-reports-panel"
import { Badge } from "@/components/ui/badge"
import { windCalibration } from "@/lib/calibration"
import { Info, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CurrentConditions() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadCurrentData = async () => {
    try {
      setLoading(true)
      const data = await getForecastData(selectedSpot)

      if (data && data.length > 0) {
        const now = new Date()
        const hour = now.getHours()

        // Encontrar la hora más cercana en los datos
        let closestHour = data[0].hours[0]
        data[0].hours.forEach((h: any) => {
          const hourNum = Number.parseInt(h.time.split(":")[0])
          if (Math.abs(hourNum - hour) < Math.abs(Number.parseInt(closestHour.time.split(":")[0]) - hour)) {
            closestHour = h
          }
        })

        setCurrentData({
          ...closestHour,
          date: data[0].date,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentData()

    // Suscribirse a cambios en el sistema de calibración
    const unsubscribe = windCalibration.subscribe(() => {
      console.log("Calibración actualizada, recargando datos...")
      loadCurrentData()
    })

    return unsubscribe
  }, [selectedSpot, refreshKey])

  const handleReportSubmitted = () => {
    // Forzar recarga de datos después de enviar un reporte
    setTimeout(() => {
      setRefreshKey(prev => prev + 1)
    }, 500)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
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
  const renderWindArrow = (direction: number) => {
    const rotationDegree = (direction + 180) % 360

    return (
      <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-100">
        <svg
          width="32"
          height="32"
          className="sm:w-10 sm:h-10"
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

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="col-span-1 xl:col-span-2">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row">
              <div className="flex flex-col items-center md:items-start">
                <h2 className="mb-1 text-lg sm:text-xl font-bold">Condicions Actuals</h2>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {loading ? "Carregant..." : `Previsió per les ${currentData?.time || "00:00"}`}
                  </p>
                  {currentData?.isCalibrated && (
                    <Badge variant="outline" className="text-xs">
                      <Info className="mr-1 h-3 w-3" />
                      Calibrat
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline ml-2">Actualitzar</span>
                </Button>
                <WindReportDialog 
                  currentModelData={currentData ? {
                    windSpeed: currentData.originalWindSpeed || currentData.windSpeed,
                    windDirection: currentData.originalWindDirection || currentData.windDirection
                  } : undefined}
                  onReportSubmitted={handleReportSubmitted}
                />
              </div>
            </div>

            {loading ? (
              <div className="mt-4 sm:mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
                <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 sm:h-8 w-32 sm:w-40" />
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 sm:h-8 w-32 sm:w-40" />
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                </div>
              </div>
            ) : (
              <div className="mt-4 sm:mt-6 flex flex-col items-center gap-4 sm:gap-8 sm:flex-row sm:justify-around">
                <div className="flex flex-col items-center">
                  {renderWindArrow(currentData?.windDirection || 0)}
                  <div className="mt-2 text-center">
                    <div className="text-xs sm:text-sm font-medium">{currentData?.windDirection}°</div>
                    <div className="text-xs text-muted-foreground">{getWindName(currentData?.windDirection || 0)}</div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-3xl sm:text-5xl font-bold text-blue-600">
                    {Math.round(currentData?.windSpeed || 0)}
                    <span className="text-lg sm:text-2xl">kn</span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground text-center">
                    Velocitat del vent
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline"> </span>
                    ({knotsToKmh(currentData?.windSpeed || 0)} km/h)
                  </div>
                  {currentData?.isCalibrated && currentData?.originalWindSpeed && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Model original: {currentData.originalWindSpeed} kn
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-500">
                    {Math.round(currentData?.windGust || 0)}
                    <span className="text-lg sm:text-xl">kn</span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground text-center">
                    Ràfegues
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline"> </span>
                    ({knotsToKmh(currentData?.windGust || 0)} km/h)
                  </div>
                </div>
              </div>
            )}

            {currentData?.isCalibrated && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="text-xs sm:text-sm text-blue-800">
                  <strong>Dades calibrades:</strong> Aquests valors han estat ajustats basant-se en reportes d'usuaris recents per millorar la precisió local.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <UserReportsPanel key={refreshKey} />
      </div>
    </div>
  )
}