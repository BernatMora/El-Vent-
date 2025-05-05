"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function ForceRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataSource, setDataSource] = useState("openweathermap")

  useEffect(() => {
    // Obtener la fuente de datos guardada
    const savedSource = localStorage.getItem("dataSource")
    if (savedSource) {
      setDataSource(savedSource)
    }
  }, [])

  const handleForceRefresh = () => {
    setIsRefreshing(true)

    // Añadir un parámetro de timestamp a la URL para evitar caché
    const timestamp = new Date().getTime()
    window.location.href = window.location.pathname + `?source=${dataSource}&refresh=${timestamp}`
  }

  return (
    <Button
      className="w-full flex items-center justify-center gap-2 bg-blue-600 px-6 py-6 text-white transition hover:bg-blue-700 text-lg"
      onClick={handleForceRefresh}
      disabled={isRefreshing}
    >
      <RefreshCw className={`h-6 w-6 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing
        ? `Obtenint dades de ${dataSource === "openweathermap" ? "OpenWeatherMap" : "Open-Meteo"}...`
        : `Actualitzar dades meteorològiques (${dataSource === "openweathermap" ? "OpenWeatherMap" : "Open-Meteo"})`}
    </Button>
  )
}
