"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { WindReportDialog } from "@/components/wind-report-dialog"
import { UserReportsPanel } from "@/components/user-reports-panel"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"

export function CurrentConditions() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<any>(null)

  useEffect(() => {
    async function loadCurrentData() {
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

    loadCurrentData()
  }, [selectedSpot])

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

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex flex-col items-center md:items-start">
                <h2 className="mb-1 text-xl font-bold">Condicions Actuals</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
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

              <WindReportDialog 
                currentModelData={currentData ? {
                  windSpeed: currentData.originalWindSpeed || currentData.windSpeed,
                  windDirection: currentData.originalWindDirection || currentData.windDirection
                } : undefined}
              />
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
            ) : (
              <div className="mt-6 flex flex-col items-center gap-8 md:flex-row md:justify-around">
                <div className="flex flex-col items-center">
                  {renderWindArrow(currentData?.windDirection || 0)}
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium">{currentData?.windDirection}°</div>
                    <div className="text-xs text-muted-foreground">{getWindName(currentData?.windDirection || 0)}</div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-5xl font-bold text-blue-600">
                    {Math.round(currentData?.windSpeed || 0)}
                    <span className="text-2xl">kn</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Velocitat del vent ({knotsToKmh(currentData?.windSpeed || 0)} km/h)
                  </div>
                  {currentData?.isCalibrated && currentData?.originalWindSpeed && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Model: {currentData.originalWindSpeed} kn
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-amber-500">
                    {Math.round(currentData?.windGust || 0)}
                    <span className="text-xl">kn</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ràfegues ({knotsToKmh(currentData?.windGust || 0)} km/h)
                  </div>
                </div>
              </div>
            )}

            {currentData?.isCalibrated && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="text-sm text-blue-800">
                  <strong>Dades calibrades:</strong> Aquests valors han estat ajustats basant-se en reportes d'usuaris recents per millorar la precisió local.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <UserReportsPanel />
      </div>
    </div>
  )
}