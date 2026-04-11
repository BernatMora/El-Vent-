"use client"

import { useEffect, useState } from "react"
import { Waves } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { type MarineDay, getMarineForecast } from "@/lib/open-meteo-api"
import { formatDate, getWindDirectionName } from "@/lib/utils"

function getWaveLabel(height: number) {
  if (height < 0.3) return { text: "Plana", color: "text-green-700 bg-green-50" }
  if (height < 0.8) return { text: "Petita", color: "text-blue-700 bg-blue-50" }
  if (height < 1.5) return { text: "Moderada", color: "text-amber-700 bg-amber-50" }
  return { text: "Grossa", color: "text-red-700 bg-red-50" }
}

const SPOT = "sant-pere-pescador"

export function WaveInfo() {
  const [loading, setLoading] = useState(true)
  const [marine, setMarine] = useState<MarineDay[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getMarineForecast(SPOT)
      setMarine(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Waves className="h-5 w-5 text-cyan-600" />Onades</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    )
  }

  if (marine.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Waves className="h-5 w-5 text-cyan-600" />
          Onades i mar
        </CardTitle>
        <div className="text-sm text-muted-foreground">Dades reals d'Open-Meteo Marine</div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            {marine.map((day, i) => (
              <TabsTrigger key={day.date} value={i.toString()} className="text-xs sm:text-sm px-2 py-2">
                {i === 0 ? "Avui" : i === 1 ? "Demà" : formatDate(day.date).split(',')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {marine.map((day, dayIndex) => (
            <TabsContent key={day.date} value={dayIndex.toString()}>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1 sm:gap-2 rounded-md bg-gradient-to-r from-cyan-50 to-blue-50 p-2 text-center text-xs sm:text-sm font-medium text-cyan-900">
                  <div>Hora</div>
                  <div>Alçada</div>
                  <div>Període</div>
                  <div>Dir.</div>
                </div>

                {day.hours.map((h) => {
                  const waveLabel = getWaveLabel(h.waveHeight)
                  return (
                    <div key={h.time} className="grid grid-cols-4 items-center gap-1 sm:gap-2 rounded-md border p-2 text-center text-xs sm:text-sm hover:bg-gray-50 transition-colors">
                      <div className="font-medium">{h.time}</div>
                      <div>
                        <span className="font-semibold text-cyan-700">{h.waveHeight} m</span>
                        <Badge variant="outline" className={`ml-1 text-[10px] px-1 py-0 ${waveLabel.color}`}>
                          {waveLabel.text}
                        </Badge>
                      </div>
                      <div className="text-slate-700">{h.wavePeriod} s</div>
                      <div className="text-slate-700">{getWindDirectionName(h.waveDirection)}</div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
