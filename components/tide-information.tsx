"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"
import { Skeleton } from "@/components/ui/skeleton"
import { Waves } from "lucide-react"

type TideData = {
  location: string
  updatedAt: string
  currentHeight: number
  nextHigh: {
    time: string
    height: number
  }
  nextLow: {
    time: string
    height: number
  }
  waveHeight: number
  waveDirection: string
  wavePeriod: number
  source: string
}

export function TideInformation() {
  const { selectedSpot } = useSpotStore()
  const [loading, setLoading] = useState(true)
  const [tideData, setTideData] = useState<TideData | null>(null)

  useEffect(() => {
    async function loadTideData() {
      try {
        setLoading(true)

        // Simulamos la carga de datos de mareas
        // En una implementación real, esto vendría de una API
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Datos simulados basados en la ubicación
        const data: TideData = {
          location: selectedSpot === "roses" ? "Roses" : selectedSpot === "lescala" ? "L'Escala" : "Sant Pere Pescador",
          updatedAt: new Date().toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" }),
          currentHeight: 0.13,
          nextHigh: {
            time: "16:42",
            height: 0.3,
          },
          nextLow: {
            time: "23:15",
            height: 0.05,
          },
          waveHeight: 0.7,
          waveDirection: "NE",
          wavePeriod: 4,
          source: "Puertos del Estado",
        }

        // Ajustar datos según el spot
        if (selectedSpot === "kitesurf-point") {
          data.waveHeight = 0.9
          data.wavePeriod = 5
        } else if (selectedSpot === "la-ballena") {
          data.waveHeight = 0.8
          data.wavePeriod = 4
        } else if (selectedSpot === "can-martinet") {
          data.waveHeight = 0.6
          data.wavePeriod = 3
        }

        setTideData(data)
      } catch (error) {
        console.error("Error carregant dades de marees:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTideData()
  }, [selectedSpot])

  // Función para determinar la descripción del estado del mar
  const getWaveDescription = (height: number): string => {
    if (height < 0.5) return "Mar plana"
    if (height < 1.0) return "Marejol"
    if (height < 1.5) return "Marejada"
    if (height < 2.5) return "Fort marejada"
    if (height < 4.0) return "Grossa"
    return "Molt grossa"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Waves className="mr-2 h-5 w-5 text-blue-600" />
          Informació de Marees
        </CardTitle>
        {!loading && tideData && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{tideData.location}</span>
            <span>Actualitzat: {tideData.updatedAt}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-3">
                <div className="text-sm font-medium text-muted-foreground">Altura actual</div>
                <div className="mt-1 text-3xl font-bold">{tideData?.currentHeight.toFixed(2)} m</div>
                <div className="mt-1 text-xs text-right text-muted-foreground">Font: {tideData?.source}</div>
              </div>

              <div className="rounded-lg border bg-card p-3">
                <div className="text-sm font-medium text-muted-foreground">Alçada d'onades</div>
                <div className="mt-1 text-3xl font-bold">{tideData?.waveHeight.toFixed(1)} m</div>
                <div className="mt-1 flex items-center justify-end">
                  <div className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {tideData ? getWaveDescription(tideData.waveHeight) : ""}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-lg border bg-card p-3">
              <div className="mb-2 text-sm font-medium">Detalls d'onades</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Direcció</div>
                  <div className="font-medium">{tideData?.waveDirection}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Període</div>
                  <div className="font-medium">{tideData?.wavePeriod} segons</div>
                </div>
              </div>
            </div>

            <div className="mb-2 text-sm font-medium">Propers extrems</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-5 w-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12h20" />
                    <path d="M12 2v20" />
                  </svg>
                  <span>Pleamar</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{tideData?.nextHigh.time}</div>
                  <div className="text-sm text-muted-foreground">{tideData?.nextHigh.height.toFixed(2)} m</div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-5 w-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12h20" />
                    <path d="M12 2v20" />
                  </svg>
                  <span>Bajamar</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{tideData?.nextLow.time}</div>
                  <div className="text-sm text-muted-foreground">{tideData?.nextLow.height.toFixed(2)} m</div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
