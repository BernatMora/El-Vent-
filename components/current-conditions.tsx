"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { type ForecastHour, getForecastData } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { getWindName, knotsToKmh } from "@/lib/utils"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const SPOT = "sant-pere-pescador"

export function CurrentConditions() {
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<(ForecastHour & { date: string }) | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadCurrentData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getForecastData(SPOT, { forceRefresh })

      if (data && data.length > 0) {
        const now = new Date()
        const hour = now.getHours()

        // Trobar l'hora més propera a les dades
        let closestHour = data[0].hours[0]
        data[0].hours.forEach((h: ForecastHour) => {
          const hourNum = Number.parseInt(h.time.split(":")[0])
          if (Math.abs(hourNum - hour) < Math.abs(Number.parseInt(closestHour.time.split(":")[0]) - hour)) {
            closestHour = h
          }
        })

        setCurrentData({
          ...closestHour,
          date: data[0].date,
        })
        setLastUpdated(
          new Date().toLocaleTimeString("ca-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        )
      } else {
        setError("No hi ha condicions actuals disponibles.")
      }
    } catch (err) {
      console.error(err)
      setError("No s'han pogut carregar les condicions actuals.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentData()
  }, [refreshKey])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    loadCurrentData(true)
  }

  // Funció per renderitzar la fletxa de direcció del vent
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

  return (
    <Card>
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-lg sm:text-xl font-bold mb-1">Condicions Actuals</h2>
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 md:justify-start">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {loading ? "Carregant..." : `Previsio per les ${currentData?.time || "00:00"}`}
              </p>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  · Actualitzat a les {lastUpdated}
                </span>
              )}
            </div>
          </div>

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
            ) : error ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => loadCurrentData(true)}>
                  Torna-ho a provar
                </Button>
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
                    Velocitat del vent ({knotsToKmh(currentData?.windSpeed || 0)} km/h)
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-500">
                    {Math.round(currentData?.windGust || 0)}
                    <span className="text-lg sm:text-xl">kn</span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground text-center">
                    Rafegues ({knotsToKmh(currentData?.windGust || 0)} km/h)
                  </div>
                </div>
              </div>
            )}
      </CardContent>
    </Card>
  )
}
