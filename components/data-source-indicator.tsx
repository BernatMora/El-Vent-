"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function DataSourceIndicator() {
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Intentar obtener la fuente de datos de la última respuesta
    checkDataSource()
  }, [])

  const checkDataSource = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/wind-data?spot=la-ballena", { method: "HEAD" })
      const source = response.headers.get("X-Data-Source")

      if (source) {
        setDataSource(source)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (error) {
      console.error("Error al verificar la fuente de datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    checkDataSource()
    window.location.reload()
  }

  if (!dataSource) return null

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Font de dades:</span>
        <Badge
          variant={dataSource === "openweathermap" ? "default" : "outline"}
          className={dataSource === "openweathermap" ? "bg-green-600" : ""}
        >
          {dataSource === "openweathermap" ? "OpenWeatherMap" : dataSource === "cache" ? "Caché" : "Dades locals"}
        </Badge>
        {lastUpdated && <span>Actualitzat: {lastUpdated}</span>}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-1 text-xs"
      >
        <RefreshCw className="h-3 w-3" />
        {loading ? "Actualitzant..." : "Actualitzar dades"}
      </Button>
    </div>
  )
}
