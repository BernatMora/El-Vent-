"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"

export function HistoricalStats() {
  const { selectedSpot } = useSpotStore()

  // Estadísticas históricas para cada spot
  const spotStats: Record<string, { avgWind: number; maxWind: number; windyDays: number; bestMonth: string }> = {
    aquarius: {
      avgWind: 16,
      maxWind: 28,
      windyDays: 210,
      bestMonth: "Julio",
    },
    "la-gaviota": {
      avgWind: 15,
      maxWind: 26,
      windyDays: 200,
      bestMonth: "Agosto",
    },
  }

  const stats = spotStats[selectedSpot] || spotStats["aquarius"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadístiques Històriques</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <div className="text-xs font-medium text-muted-foreground">Vent mitjà anual</div>
            <div className="mt-1 text-2xl font-bold">{stats.avgWind} kn</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs font-medium text-muted-foreground">Vent màxim registrat</div>
            <div className="mt-1 text-2xl font-bold">{stats.maxWind} kn</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs font-medium text-muted-foreground">Dies navegables/any</div>
            <div className="mt-1 text-2xl font-bold">{stats.windyDays}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs font-medium text-muted-foreground">Millor mes</div>
            <div className="mt-1 text-2xl font-bold">{stats.bestMonth}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
