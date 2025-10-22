"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface SourceStatus {
  name: string
  status: "available" | "unavailable" | "checking"
  priority: number
  description: string
  official: boolean
}

export function WeatherSources() {
  const [sources, setSources] = useState<SourceStatus[]>([
    {
      name: "Meteocat",
      status: "checking",
      priority: 0,
      description: "Servei Meteorològic de Catalunya (Oficial)",
      official: true
    },
    {
      name: "Open-Meteo",
      status: "checking",
      priority: 1,
      description: "Dades meteorològiques globals gratuïtes",
      official: false
    },
    {
      name: "WeatherAPI",
      status: "checking",
      priority: 2,
      description: "Servei meteorològic comercial",
      official: false
    },
    {
      name: "OpenWeatherMap",
      status: "checking",
      priority: 3,
      description: "Servei meteorològic global",
      official: false
    }
  ])

  useEffect(() => {
    const checkSources = async () => {
      const updatedSources = [...sources]

      // Verificar Meteocat
      try {
        const meteocatResponse = await fetch("https://api.meteo.cat/xema/v1/estacions/CG")
        updatedSources[0].status = meteocatResponse.ok ? "available" : "unavailable"
      } catch {
        updatedSources[0].status = "unavailable"
      }

      // Verificar Open-Meteo
      try {
        const openMeteoResponse = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=42.18&longitude=3.08&hourly=temperature_2m&forecast_days=1"
        )
        updatedSources[1].status = openMeteoResponse.ok ? "available" : "unavailable"
      } catch {
        updatedSources[1].status = "unavailable"
      }

      // WeatherAPI i OpenWeatherMap requereixen API keys
      updatedSources[2].status = "unavailable"
      updatedSources[3].status = "unavailable"

      setSources(updatedSources)
    }

    checkSources()

    // Verificar cada 10 minutos
    const interval = setInterval(checkSources, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "unavailable":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "checking":
        return <Clock className="h-4 w-4 text-gray-400 animate-pulse" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-600">Disponible</Badge>
      case "unavailable":
        return <Badge variant="secondary">No disponible</Badge>
      case "checking":
        return <Badge variant="outline">Verificant...</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fonts de dades meteorològiques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources
          .sort((a, b) => a.priority - b.priority)
          .map((source) => (
            <div
              key={source.name}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(source.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{source.name}</span>
                    {source.official && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Oficial
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{source.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(source.status)}
                <Badge variant="outline" className="text-xs">
                  P{source.priority}
                </Badge>
              </div>
            </div>
          ))}

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> El sistema utilitzarà automàticament la font disponible amb prioritat més alta.
            Meteocat té prioritat màxima per ser la font oficial de Catalunya.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
