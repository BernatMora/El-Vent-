"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DataSourceIndicator() {
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Intentar obtener la fuente de datos de la última respuesta
    checkDataSource()

    // Configurar un intervalo para verificar la fuente de datos cada 5 minutos
    const interval = setInterval(checkDataSource, 300000) // 5 minutos

    return () => clearInterval(interval)
  }, [])

  const checkDataSource = async () => {
    try {
      setLoading(true)
      // Añadir un timestamp para evitar caché
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/wind-data?spot=aquarius&_t=${timestamp}&check=true`, {
        method: "HEAD",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

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
    // Recargar la página con un parámetro para evitar caché
    window.location.href = window.location.href.split("?")[0] + "?refresh=" + new Date().getTime()
  }

  return (
    <div className="mb-4">
      <Alert variant="info" className="bg-blue-50 border-blue-200">
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
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
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Actualitzant..." : "Actualitzar dades"}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
