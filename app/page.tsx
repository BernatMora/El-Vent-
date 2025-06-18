"use client"

export const dynamic = 'force-dynamic';

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
import { ApiStatus } from "@/components/api-status"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-2 sm:p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 sm:mb-8 text-center">
          <h1 className="mb-2 text-2xl sm:text-4xl md:text-5xl font-bold text-blue-900">
            Els Vents de Sant Pere Pescador
          </h1>
          <p className="text-sm sm:text-lg text-blue-700">
            Descobreix els vents tradicionals i la meteorologia actual per kitesurf
          </p>
        </div>

        <ApiStatus />

        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
          <button className="flex items-center justify-center rounded-md bg-blue-100 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-blue-700 transition hover:bg-blue-200">
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
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span className="hidden sm:inline">Actualitza dades meteorològiques</span>
            <span className="sm:hidden">Actualitza dades</span>
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
          <CurrentConditions />
        </div>

        <WindDirectionLegend />

        <Tabs defaultValue="previsio" className="mb-4 sm:mb-8">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="previsio" className="text-xs sm:text-sm">Previsió</TabsTrigger>
            <TabsTrigger value="condicions" className="text-xs sm:text-sm">Condicions</TabsTrigger>
            <TabsTrigger value="mida" className="text-xs sm:text-sm">Mida d'Estel</TabsTrigger>
          </TabsList>
          <TabsContent value="previsio" className="mt-4">
            <WindForecast />
          </TabsContent>
          <TabsContent value="condicions" className="mt-4">
            <WindChart />
          </TabsContent>
          <TabsContent value="mida" className="mt-4">
            <KiteRecommendation />
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
      </div>
    </main>
  )
}