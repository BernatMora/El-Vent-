"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { WindForecast } from "@/components/wind-forecast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendChart } from "@/components/trend-chart"
import { AlertsBanner } from "@/components/alerts-banner"
import { CurrentConditions } from "@/components/current-conditions"
import { WindGuide } from "@/components/wind-guide"
import { WindChart } from "@/components/wind-chart"
import { PwaInstallBanner } from "@/components/pwa-install-banner"
import { SessionOverview } from "@/components/session-overview"
import { WaveInfo } from "@/components/wave-info"
import { TideInfo } from "@/components/tide-info"
import { NotificationSettings } from "@/components/notification-settings"
import { PredictionAccuracy } from "@/components/prediction-accuracy"
import { WindAlerts } from "@/components/wind-alerts"
import { GoNoGoIndicator } from "@/components/go-no-go-indicator"
import { TramuntanaAlert } from "@/components/tramuntana-alert"
import { ForecastVsRealChart } from "@/components/forecast-vs-real-chart"
import { MobileStatusBar } from "@/components/mobile-status-bar"
import { AquariusMeteo } from "@/components/aquarius-meteo"
import { getForecastData } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

const SPOT = "sant-pere-pescador"

export function ClientContent() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)

    try {
      const data = await getForecastData(SPOT, { forceRefresh: true })

      if (!data || data.length === 0) {
        throw new Error("No hi ha dades disponibles")
      }

      setRefreshKey((prev) => prev + 1)
      toast({
        title: "Dades actualitzades",
        description: "La previsió s'ha refrescat correctament.",
      })
    } catch (error) {
      console.error("Error actualitzant dades meteorològiques:", error)
      toast({
        variant: "destructive",
        title: "No s'han pogut actualitzar les dades",
        description: "Torna-ho a provar d'aquí uns instants.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!isHydrated) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    )
  }

  return (
    <>
      {/* Verdict primer de tot — el més important pel kiter al mòbil */}
      <div className="mb-3 sm:mb-6">
        <GoNoGoIndicator key={`gonogo-${refreshKey}`} />
      </div>

      <div className="sticky top-2 z-20 mb-3 rounded-xl border bg-slate-50/95 p-1.5 shadow-sm backdrop-blur sm:mb-6 sm:rounded-2xl sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
          <button
            className="flex min-h-[44px] items-center justify-center rounded-xl bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition active:scale-[0.98] hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-3 sm:text-base"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {isRefreshing ? "Actualitzant dades..." : "Actualitza dades meteorològiques"}
            </span>
            <span className="sm:hidden">{isRefreshing ? "Actualitzant..." : "Actualitza"}</span>
          </button>
          <button
            className="hidden min-h-[44px] items-center justify-center rounded-xl bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-200 sm:flex sm:px-6 sm:py-3 sm:text-base"
            onClick={() => document.getElementById("wind-guide")?.scrollIntoView({ behavior: "smooth" })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
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
            Mostra guia de vents
          </button>
        </div>
      </div>

      <AlertsBanner />
      <SessionOverview key={`session-${refreshKey}`} />

      <div className="mb-3 sm:mb-6">
        <TramuntanaAlert key={`tramuntana-${refreshKey}`} />
      </div>

      <div className="mb-3 sm:mb-6">
        <WindAlerts />
      </div>

      <div className="mb-3 sm:mb-8 rounded-xl bg-white p-2 sm:p-6 shadow-md dark:bg-slate-900">
        <CurrentConditions key={`conditions-${refreshKey}`} />
      </div>

      <div className="mb-3 sm:mb-6">
        <AquariusMeteo />
      </div>

      <Tabs defaultValue="previsio" className="mb-3 sm:mb-8">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="previsio" className="min-h-[40px] px-2 py-2 text-xs leading-tight sm:text-sm">
            <span className="hidden sm:inline">Previsio avancada</span>
            <span className="sm:hidden">Previsio</span>
          </TabsTrigger>
          <TabsTrigger value="condicions" className="min-h-[40px] px-2 py-2 text-xs sm:text-sm">Condicions</TabsTrigger>
        </TabsList>
        <TabsContent value="previsio" className="mt-4">
          <WindForecast key={`forecast-${refreshKey}`} />
        </TabsContent>
        <TabsContent value="condicions" className="mt-4">
          <WindChart key={`chart-${refreshKey}`} />
        </TabsContent>
      </Tabs>

      <div className="mb-3 grid gap-3 sm:mb-8 sm:gap-4 md:grid-cols-2">
        <WaveInfo key={`wave-${refreshKey}`} />
        <TideInfo />
      </div>

      <div className="mb-3 sm:mb-8">
        <TrendChart key={`trend-${refreshKey}`} />
      </div>

      <PwaInstallBanner />

      <div id="wind-guide" className="mb-3 sm:mb-8">
        <WindGuide />
      </div>

      <div className="mb-3 grid gap-3 sm:mb-8 sm:gap-4 md:grid-cols-2">
        <NotificationSettings />
        <PredictionAccuracy />
      </div>

      <div className="mb-3 sm:mb-8">
        <ForecastVsRealChart key={`fvsr-${refreshKey}`} />

      <MobileStatusBar />
      </div>
    </>
  )
}
