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

      <div className="mb-4 rounded-2xl border bg-slate-50/80 p-2 shadow-sm sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
          <button
            className="flex items-center justify-center rounded-xl bg-blue-100 px-4 py-2 text-sm text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-3 sm:text-base"
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
            className="flex items-center justify-center rounded-xl bg-green-100 px-4 py-2 text-sm text-green-700 transition hover:bg-green-200 sm:px-6 sm:py-3 sm:text-base"
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
        <p className="mt-2 px-1 text-center text-[11px] text-slate-500 sm:hidden">
          Actualitza la previsió o obre la guia ràpida abans de baixar a la platja.
        </p>
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
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="previsio" className="px-2 py-2 text-[11px] leading-tight sm:text-sm">
            <span className="hidden sm:inline">Previsió avançada</span>
            <span className="sm:hidden">Previsió</span>
          </TabsTrigger>
          <TabsTrigger value="condicions" className="px-2 py-2 text-[11px] sm:text-sm">Condicions</TabsTrigger>
          <TabsTrigger value="mida" className="px-2 py-2 text-[11px] sm:text-sm">Mida d'estel</TabsTrigger>
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
        <TabsList className="grid w-full grid-cols-1 rounded-xl bg-slate-100 p-1">
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