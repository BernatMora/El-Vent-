"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function TrendChart() {
  const { selectedSpot } = useSpotStore()

  // Dades simulades per la tendència del vent
  const trendData = [
    { day: "Dll", wind: 12 },
    { day: "Dm", wind: 15 },
    { day: "Dc", wind: 18 },
    { day: "Dj", wind: 14 },
    { day: "Dv", wind: 16 },
    { day: "Ds", wind: 20 },
    { day: "Dg", wind: 22 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendència Setmanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="wind" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
