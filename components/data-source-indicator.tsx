"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export function DataSourceIndicator() {
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    // Intentar obtener la fuente de datos de la última respuesta
    const checkDataSource = async () => {
      try {
        const response = await fetch("/api/wind-data?spot=la-ballena", { method: "HEAD" })
        const source = response.headers.get("X-Data-Source")

        if (source) {
          setDataSource(source)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (error) {
        console.error("Error al verificar la fuente de datos:", error)
      }
    }

    checkDataSource()
  }, [])

  if (!dataSource) return null

  return (
    <div className="mb-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
      <span>Font de dades:</span>
      <Badge
        variant={dataSource === "openweathermap" ? "default" : "outline"}
        className={dataSource === "openweathermap" ? "bg-green-600" : ""}
      >
        {dataSource === "openweathermap" ? "OpenWeatherMap" : dataSource === "cache" ? "Caché" : "Dades locals"}
      </Badge>
      {lastUpdated && <span>Actualitzat: {lastUpdated}</span>}
    </div>
  )
}
