"use client"

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
import { OptimalWindowCalculator } from "@/components/optimal-window-calculator"
import { WindDirectionLegend } from "@/components/wind-direction-legend"
import { DataSourceIndicator } from "@/components/data-source-indicator"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-blue-900 md:text-5xl">Els Vents de Sant Pere Pescador</h1>
          <p className="text-lg text-blue-700">
            Descobreix els vents tradicionals i la meteorologia actual per kitesurf
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            className="flex items-center justify-center rounded-md bg-blue-100 px-6 py-3 text-blue-700 transition hover:bg-blue-200"
            onClick={() => {
              // Forzar recarga completa sin caché
              window.location.href = window.location.href.split("?")[0] + "?refresh=" + new Date().getTime()
            }}
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
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            Actualitza dades en temps real
          </button>
          <button
            className="flex items-center justify-center rounded-md bg-green-100 px-6 py-3 text-green-700 transition hover:bg-green-200"
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
          <a
            href="/comparar"
            className="flex items-center justify-center rounded-md bg-amber-100 px-6 py-3 text-amber-700 transition hover:bg-amber-200"
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
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Comparar spots
          </a>
        </div>

        <div className="mb-8">
          <SpotSelector />
        </div>

        <DataSourceIndicator />

        <AlertsBanner />

        <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
          <CurrentConditions />
        </div>

        <div className="mb-8">
          <OptimalWindowCalculator />
        </div>

        <WindDirectionLegend />

        <Tabs defaultValue="previsio" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="previsio">Previsió</TabsTrigger>
            <TabsTrigger value="condicions">Condicions</TabsTrigger>
            <TabsTrigger value="mida">Mida d'Estel</TabsTrigger>
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

        <div className="mb-8">
          <TideInformation />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <OptimalSessions />
          <SpotDetails />
        </div>

        <Tabs defaultValue="trends" className="mb-8">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="trends">Tendències</TabsTrigger>
          </TabsList>
          <TabsContent value="trends" className="mt-4">
            <TrendChart />
          </TabsContent>
        </Tabs>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <AdditionalInfo />
          <HistoricalStats />
        </div>

        <div id="wind-guide" className="mb-8">
          <WindGuide />
        </div>
      </div>
    </main>
  )
}
