"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ForceRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    // Verificar si los datos son antiguos (más de 5 minutos)
    const checkDataAge = () => {
      const lastRefreshTime = localStorage.getItem("lastDataRefresh")
      if (lastRefreshTime) {
        const lastTime = new Date(Number.parseInt(lastRefreshTime))
        setLastRefresh(lastTime)

        const now = new Date()
        const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60)

        // Si han pasado más de 5 minutos, mostrar alerta
        if (diffMinutes > 5) {
          setShowAlert(true)
        }
      }
    }

    checkDataAge()

    // Verificar cada minuto
    const interval = setInterval(checkDataAge, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleForceRefresh = () => {
    setIsRefreshing(true)

    // Limpiar caché del navegador para esta página
    if ("caches" in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName)
        })
      })
    }

    // Limpiar localStorage y sessionStorage
    localStorage.removeItem("lastDataRefresh")

    // Forzar recarga completa sin caché
    const timestamp = new Date().getTime()
    localStorage.setItem("lastDataRefresh", timestamp.toString())

    // Recargar la página con parámetros para evitar caché
    window.location.href = window.location.pathname + "?nocache=true&t=" + timestamp
  }

  return (
    <>
      {showAlert && (
        <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Dades possiblement desactualitzades</AlertTitle>
          <AlertDescription className="text-amber-700">
            Les dades no s'han actualitzat en els últims 5 minuts. Recomanem actualitzar per obtenir les dades més
            recents.
            <Button
              variant="outline"
              className="mt-2 bg-amber-100 border-amber-300 hover:bg-amber-200"
              onClick={handleForceRefresh}
            >
              Actualitzar ara
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full flex items-center justify-center gap-2 bg-blue-600 px-6 py-6 text-white transition hover:bg-blue-700 text-lg"
        onClick={handleForceRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-6 w-6 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Actualitzant dades..." : "Actualitzar totes les dades ara"}
      </Button>

      {lastRefresh && !showAlert && (
        <p className="text-center text-sm text-muted-foreground mt-2">
          Última actualització: {lastRefresh.toLocaleTimeString()}
        </p>
      )}
    </>
  )
}
