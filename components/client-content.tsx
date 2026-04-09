"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { SpotSelector } from "@/components/spot-selector"
import { WindForecast } from "@/components/wind-forecast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendChart } from "@/components/trend-chart"
import { AdditionalInfo } from "@/components/additional-info"
import { SpotDetails } from "@/components/spot-details"
import { KiteRecommendation } from "@/components/kite-recommendation"
import { OptimalSessions } from "@/components/optimal-sessions"
import { HistoricalStats } from "@/components/historical-stats"
import { AlertsBanner } from "@/components/alerts-banner"
import { CurrentConditions } from "@/components/current-conditions"
import { WindGuide } from "@/components/wind-guide"
import { WindChart } from "@/components/wind-chart"
import { TideInformation } from "@/components/tide-information"
import { WindDirectionLegend } from "@/components/wind-direction-legend"
import { EnhancedApiStatus } from "@/components/enhanced-api-status"
import { TrainingSection } from "@/components/training-section"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

export function ClientContent() {
  const { selectedSpot, hydrateStore } = useSpotStore()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    hydrateStore()
  }, [hydrateStore])

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)

    try {
      const data = await getForecastData(selectedSpot)

      if (!data || data.length === 0) {
        throw new Error("No hi ha dades disponibles")
      }

      setRefreshKey((prev) => prev + 1)
      toast({
        title: "Dades actualitzades",
        description: `La previsió per ${selectedSpot} s'ha refrescat correctament.`,
      })
    } catch (error) {
      console.error("Error refreshing weather data:", error)
      toast({
        variant: "destructive",
        title: "No s'han pogut actualitzar les dades",
        description: "Torna-ho a provar d'aquí uns instants.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <EnhancedApiStatus />

      <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
        <button
          className="flex items-center justify-center rounded-md bg-blue-100 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">
            {isRefreshing ? "Actualitzant dades..." : "Actualitza dades meteorològiques"}
          </span>
          <span className="sm:hidden">{isRefreshing ? "Actualitzant..." : "Actualitza dades"}</span>
        </button>
        <button
          className="flex items-center justify-center rounded-md bg-green-100 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-green-700 transition hover:bg-green-200"
          onClick={() => document.getElementById("wind-guide")?.scrollIntoView({ behavior: "smooth" })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span className="hidden sm:inline">Mostra guia de vents</span>
          <span className="sm:hidden">Guia de vents</span>
        </button>
      </div>

      <div className="mb-4 sm:mb-8">
        <SpotSelector />
      </div>

      <AlertsBanner />

      <div className="mb-4 sm:mb-8 rounded-xl bg-white p-3 sm:p-6 shadow-md">
        <CurrentConditions key={`conditions-${refreshKey}`} />
      </div>

      <WindDirectionLegend />

      <Tabs defaultValue="previsio" className="mb-4 sm:mb-8">
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="previsio" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Previsió avançada</span>
            <span className="sm:hidden">Previsió</span>
          </TabsTrigger>
          <TabsTrigger value="condicions" className="text-xs sm:text-sm">Condicions</TabsTrigger>
          <TabsTrigger value="mida" className="text-xs sm:text-sm">Mida d'Estel</TabsTrigger>
        </TabsList>
        <TabsContent value="previsio" className="mt-4">
          <WindForecast key={`forecast-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="condicions" className="mt-4">
          <WindChart key={`chart-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="mida" className="mt-4">
          <KiteRecommendation key={`kite-${refreshKey}`} />
        </TabsContent>
      </Tabs>

      <div className="mb-4 sm:mb-8">
        <TideInformation />
      </div>

      <div className="mb-4 sm:mb-8 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <OptimalSessions />
        <SpotDetails />
      </div>

      <Tabs defaultValue="trends" className="mb-4 sm:mb-8">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="trends">Tendències</TabsTrigger>
        </TabsList>
        <TabsContent value="trends" className="mt-4">
          <TrendChart />
        </TabsContent>
      </Tabs>

      <div className="mb-4 sm:mb-8 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <AdditionalInfo />
        <HistoricalStats />
      </div>

      <div id="wind-guide" className="mb-4 sm:mb-8">
        <WindGuide />
      </div>

      <div className="mb-4 sm:mb-8">
        <TrainingSection />
      </div>
    </>
  )
}