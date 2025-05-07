"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ForceRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataSource, setDataSource] = useState("open-meteo")
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    // Obtener la fuente de datos guardada
    const savedSource = localStorage.getItem("dataSource")
    if (savedSource) {
      setDataSource(savedSource)
    } else {
      // Si no hay fuente guardada, establecer Open-Meteo como predeterminada
      localStorage.setItem("dataSource", "open-meteo")
    }

    // Verificar si venimos de una actualización forzada
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("force") === "true") {
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 5000) // Ocultar después de 5 segundos
    }
  }, [])

  const handleForceRefresh = () => {
    setIsRefreshing(true)

    // Limpiar TODOS los datos de localStorage
    localStorage.clear()

    // Registrar el momento de esta actualización forzada
    const timestamp = new Date().getTime()
    localStorage.setItem("lastForceRefresh", timestamp.toString())
    localStorage.setItem("dataSource", dataSource)

    // Limpiar caché del navegador para esta página
    if ("caches" in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name)
        }
      })
    }

    // Recargar la página con parámetros para evitar caché
    window.location.href =
      window.location.pathname + `?source=${dataSource}&refresh=${timestamp}&force=true&nocache=${Math.random()}`
  }

  const toggleDataSource = () => {
    const newSource = dataSource === "openweathermap" ? "open-meteo" : "openweathermap"
    setDataSource(newSource)
    localStorage.setItem("dataSource", newSource)
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

      <div className="flex flex-col gap-2">
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

        <Button variant="outline" onClick={toggleDataSource} className="w-full">
          Canviar a{" "}
          {dataSource === "openweathermap" ? "Open-Meteo (dades horaries)" : "OpenWeatherMap (dades cada 3 hores)"}
        </Button>
      </div>
    </>
  )
}
