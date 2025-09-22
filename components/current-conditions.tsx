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
import { Info, RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CurrentConditions() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [justUpdated, setJustUpdated] = useState(false)

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
      console.error("Error loading current data:", err)
      setCurrentData(null)
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
    // Mostrar indicador visual de actualización
    setJustUpdated(true)
    
    // Forzar recarga de datos después de enviar un reporte
    setTimeout(() => {
      setRefreshKey(prev => prev + 1)
    }, 500)

    // Ocultar indicador después de 3 segundos
    setTimeout(() => {
      setJustUpdated(false)
    }, 3000)
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
      <div className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-500 ${
        justUpdated ? 'bg-green-100 ring-2 ring-green-300' : 'bg-blue-100'
      }`}>
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
            fill={justUpdated ? "#059669" : "#1d4ed8"}
            stroke={justUpdated ? "#059669" : "#1d4ed8"}
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
        <Card className={`col-span-1 xl:col-span-2 transition-all duration-500 ${
          justUpdated ? 'ring-2 ring-green-300 bg-green-50/30' : ''
        }`}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row">
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg sm:text-xl font-bold">Condicions Actuals</h2>
                  {justUpdated && (
                    <div className="flex items-center gap-1 animate-pulse">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Actualitzat!</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {loading ? "Carregant..." : `Previsió per les ${currentData?.time || "00:00"}`}
                  </p>
                  {currentData?.isCalibrated && (
                    <Badge variant="outline" className={`text-xs transition-colors duration-300 ${
                      justUpdated ? 'bg-green-100 border-green-300 text-green-700' : ''
                    }`}>
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
            ) : !currentData ? (
              <div className="mt-4 sm:mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                  </svg>
                  <span className="font-medium text-red-800">Sense Dades Meteorològiques</span>
                </div>
                <p className="text-red-700 text-sm">
                  No es poden obtenir condicions actuals.
                  <br />
                  Comprova la connexió i actualitza.
                </p>
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
                  <div className={`text-3xl sm:text-5xl font-bold transition-colors duration-500 ${
                    justUpdated ? 'text-green-600' : 'text-blue-600'
                  }`}>
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
                  <div className={`text-2xl sm:text-3xl font-bold transition-colors duration-500 ${
                    justUpdated ? 'text-green-500' : 'text-amber-500'
                  }`}>
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

                <div className="flex flex-col items-center">
                  <div className="text-3xl sm:text-4xl">
                    {currentData?.precipitationProbability > 60 ? (
                      currentData?.precipitationType === 'thunderstorm' ? '⛈️' : 
                      currentData?.precipitationType === 'rain' ? '🌧️' : 
                      currentData?.precipitationType === 'drizzle' ? '🌦️' : '🌧️'
                    ) : currentData?.precipitationProbability > 30 ? (
                      '🌦️'
                    ) : currentData?.precipitationProbability > 10 ? (
                      '🌤️'
                    ) : (
                      '☀️'
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground text-center">
                    {currentData?.precipitationProbability || 0}% pluja
                    {currentData?.precipitation > 0 && (
                      <div className="text-blue-600 font-medium">
                        {currentData.precipitation.toFixed(1)} mm/h
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentData?.isCalibrated && (
              <div className={`mt-4 rounded-lg border p-3 transition-colors duration-500 ${
                justUpdated 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-blue-200 bg-blue-50'
              }`}>
                <div className={`text-xs sm:text-sm ${
                  justUpdated ? 'text-green-800' : 'text-blue-800'
                }`}>
                  <strong>Dades calibrades:</strong> Aquests valors han estat ajustats basant-se en reportes d'usuaris recents per millorar la precisió local.
                  {justUpdated && (
                    <span className="block mt-1 font-medium">
                      ✓ Acabat d'actualitzar amb el teu reporte!
                    </span>
                  )}
                </div>
              </div>
            )}

            {currentData?.precipitationProbability > 50 && (
              <div className={`mt-4 rounded-lg border p-3 transition-colors duration-500 ${
                currentData.precipitationType === 'thunderstorm' 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-blue-200 bg-blue-50'
              }`}>
                <div className={`text-xs sm:text-sm ${
                  currentData.precipitationType === 'thunderstorm' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  <strong>Alerta de precipitació:</strong> {currentData.precipitationProbability}% probabilitat de {
                    currentData.precipitationType === 'thunderstorm' ? 'tempesta' :
                    currentData.precipitationType === 'rain' ? 'pluja' :
                    currentData.precipitationType === 'drizzle' ? 'plugim' : 'precipitació'
                  }
                  {currentData.precipitation > 0 && ` (${currentData.precipitation.toFixed(1)} mm/h)`}
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