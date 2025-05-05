"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function ForceRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataSource, setDataSource] = useState("openweathermap")
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)

  useEffect(() => {
    // Obtener la fuente de datos guardada
    const savedSource = localStorage.getItem("dataSource")
    if (savedSource) {
      setDataSource(savedSource)
    }

    // Verificar si necesitamos una actualización automática al cargar
    const lastRefreshTime = localStorage.getItem("lastForceRefresh")
    setLastRefresh(lastRefreshTime)

    const now = new Date().getTime()
    // Si han pasado más de 30 minutos desde la última actualización forzada, hacerlo automáticamente
    if (!lastRefreshTime || now - Number.parseInt(lastRefreshTime) > 30 * 60 * 1000) {
      console.log("Realizando actualización automática al cargar la página")
      setTimeout(() => {
        handleForceRefresh()
      }, 1000) // Pequeño retraso para permitir que la página se cargue primero
    }
  }, [])

  const handleForceRefresh = () => {
    setIsRefreshing(true)

    // Limpiar cualquier caché de localStorage
    localStorage.removeItem("lastDataRefresh")

    // Registrar el momento de esta actualización forzada
    const timestamp = new Date().getTime()
    localStorage.setItem("lastForceRefresh", timestamp.toString())

    // Limpiar caché del navegador para esta página
    if ("caches" in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name)
        }
      })
    }

    // Recargar la página con parámetros para evitar caché
    window.location.href = window.location.pathname + `?source=${dataSource}&refresh=${timestamp}&force=true`
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
