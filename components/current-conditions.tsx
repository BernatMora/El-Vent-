"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getWindName, knotsToKmh } from "@/lib/utils"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MeteocatConditions {
  windSpeed: number
  windDirection: number
  windGust: number
  temperature: number
  humidity: number
  lastUpdate: string
  stationName: string
  isReal: boolean
  source: string
}

interface CurrentResponse {
  current: MeteocatConditions
  source: string
  station: string
}

export function CurrentConditions() {
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState<MeteocatConditions | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stationInfo, setStationInfo] = useState<string | null>(null)

  const loadCurrentData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/current${forceRefresh ? '?nocache=' + Date.now() : ''}`)
      
      if (!response.ok) {
        throw new Error("No s'han pogut obtenir les dades reals")
      }
      
      const data: CurrentResponse = await response.json()
      
      if (data.current) {
        setCurrentData(data.current)
        setStationInfo(data.station)
        
        // Formatar l'hora de l'última actualització de l'estació
        if (data.current.lastUpdate) {
          const updateDate = new Date(data.current.lastUpdate)
          setLastUpdated(
            updateDate.toLocaleTimeString("ca-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          )
        }
      } else {
        setError("No hi ha condicions actuals disponibles.")
      }
    } catch (err) {
      console.error(err)
      setError("No s'han pogut carregar les dades reals de l'estació.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentData()
    
    // Actualitzar cada 5 minuts
    const interval = setInterval(() => loadCurrentData(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold">Condicions Actuals</h2>
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Multi-model
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 md:justify-start">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {loading ? "Carregant dades..." : stationInfo || "Sant Pere Pescador"}
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
            <p className="mt-1 text-xs">Problema temporal obtenint dades meteorologiques.</p>
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

            <div className="flex flex-col items-center">
              <div className="text-xl sm:text-2xl font-semibold text-gray-700">
                {currentData?.temperature || 0}°C
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Temperatura
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Font: {currentData?.source || "Multi-model"} - Previsio combinada AROME + ICON + GFS
        </div>
      </CardContent>
    </Card>
  )
}
