"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DataSourceIndicator() {
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string>("openweathermap")
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Intentar obtener la fuente de datos guardada
    const savedSource = localStorage.getItem("dataSource")
    if (savedSource) {
      setSelectedSource(savedSource)
    }

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

      // Usar la API seleccionada
      const apiUrl =
        selectedSource === "open-meteo"
          ? `/api/open-meteo?spot=aquarius&_t=${timestamp}&check=true`
          : `/api/wind-data?spot=aquarius&_t=${timestamp}&check=true`

      const response = await fetch(apiUrl, {
        method: "GET",
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

  const handleSourceChange = (value: string) => {
    setSelectedSource(value)
    localStorage.setItem("dataSource", value)

    // Recargar la página con la nueva fuente
    const timestamp = new Date().getTime()
    window.location.href = window.location.href.split("?")[0] + `?source=${value}&refresh=${timestamp}`
  }

  const handleRefresh = () => {
    checkDataSource()
    // Recargar la página con un parámetro para evitar caché
    const timestamp = new Date().getTime()
    window.location.href = window.location.href.split("?")[0] + `?source=${selectedSource}&refresh=${timestamp}`
  }

  return (
    <div className="mb-4">
      <Alert variant="info" className="bg-blue-50 border-blue-200">
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>Font de dades:</span>
            <Badge
              variant={dataSource === "openweathermap" || dataSource === "open-meteo" ? "default" : "outline"}
              className={
                dataSource === "openweathermap" ? "bg-green-600" : dataSource === "open-meteo" ? "bg-blue-600" : ""
              }
            >
              {dataSource === "openweathermap"
                ? "OpenWeatherMap (3h)"
                : dataSource === "open-meteo"
                  ? "Open-Meteo (1h)"
                  : dataSource === "fallback"
                    ? "Dades locals"
                    : "Carregant..."}
            </Badge>
            {lastUpdated && <span>Actualitzat: {lastUpdated}</span>}
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedSource} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Seleccionar font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openweathermap">OpenWeatherMap (3h)</SelectItem>
                <SelectItem value="open-meteo">Open-Meteo (1h)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Actualitzant..." : "Actualitzar"}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
