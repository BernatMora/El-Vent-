"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HistoricalStats() {
  const stats = {
    avgWind: 16,
    maxWind: 30,
    windyDays: 215,
    bestMonth: "Juliol",
  }

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
