"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ForceRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataSource, setDataSource] = useState("openweathermap")
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [showAlert, setShowAlert] = useState(false)

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

    // Verificar si venimos de una actualización forzada
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("force") === "true") {
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 5000) // Ocultar después de 5 segundos
    }
  }, [])

  // Modificar la función handleForceRefresh para asegurar que limpia toda la caché
  const handleForceRefresh = () => {
    setIsRefreshing(true)

    // Limpiar TODOS los datos de localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("Data") || key.includes("cache") || key.includes("forecast") || key.includes("wind")) {
        localStorage.removeItem(key)
      }
    })

    // Limpiar específicamente las claves relacionadas con datos
    localStorage.removeItem("lastDataRefresh")
    localStorage.removeItem("forecastData")
    localStorage.removeItem("windData")
    localStorage.removeItem("optimalWindows")

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

    // Limpiar la caché de Service Worker si existe
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_CACHE",
      })
    }

    // Recargar la página con parámetros para evitar caché
    window.location.href =
      window.location.pathname + `?source=${dataSource}&refresh=${timestamp}&force=true&nocache=${Math.random()}`
  }

  return (
    <>
      {showAlert && (
        <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
          <AlertDescription>
            Dades actualitzades correctament! Les dades meteorològiques s'han actualitzat amb èxit.
          </AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full flex items-center justify-center gap-2 bg-blue-600 px-6 py-6 text-white transition hover:bg-blue-700 text-lg"
        onClick={handleForceRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-6 w-6 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing
          ? `Obtenint dades noves de ${dataSource === "openweathermap" ? "OpenWeatherMap" : "Open-Meteo"}...`
          : `Actualitzar dades meteorològiques (${dataSource === "openweathermap" ? "OpenWeatherMap" : "Open-Meteo"})`}
      </Button>
    </>
  )
}
