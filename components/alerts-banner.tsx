"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSpotStore } from "@/lib/store"
import { getForecastData } from "@/lib/api"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"

export function AlertsBanner() {
  const { selectedSpot } = useSpotStore()
  const [alerts, setAlerts] = useState<{ type: string; title: string; description: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAlerts() {
      try {
        setLoading(true)
        const data = await getForecastData(selectedSpot)

        // Reiniciar alertas
        const newAlerts = []

        // Comprobar si hay datos
        if (data && data.length > 0) {
          const today = data[0]

          // Comprobar viento fuerte
          const maxWind = Math.max(...today.hours.map((h: any) => h.windSpeed))
          if (maxWind > 25) {
            newAlerts.push({
              type: "warning",
              title: "Alerta de vent fort",
              description: `S'esperen vents de fins a ${Math.round(maxWind)} nusos avui. Precaució per a riders principiants.`,
            })
          }

          // Comprobar viento offshore (dirección entre 225 y 315 grados)
          const offshoreHours = today.hours.filter((h: any) => {
            const dir = h.windDirection
            return dir >= 225 && dir <= 315
          })

          if (offshoreHours.length > 0) {
            newAlerts.push({
              type: "danger",
              title: "Alerta de vent offshore",
              description: "S'esperen vents de terra a mar en algunes hores. Navega amb precaució i mai sol.",
            })
          }

          // Alerta de spot específico
          if (selectedSpot === "kitesurf-point") {
            newAlerts.push({
              type: "info",
              title: "Informació de Kitesurf Point",
              description:
                "Recorda que aquesta zona és més adequada per a principiants. Respecta les zones de navegació.",
            })
          } else if (selectedSpot === "can-martinet") {
            newAlerts.push({
              type: "info",
              title: "Informació de Can Martinet",
              description: "Aquesta zona pot tenir corrents més forts. Recomanat per a riders amb experiència.",
            })
          }
        }

        setAlerts(newAlerts)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    checkAlerts()
  }, [selectedSpot])

  if (loading || alerts.length === 0) return null

  return (
    <div className="mb-8 space-y-4">
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          variant={alert.type === "danger" ? "destructive" : alert.type === "warning" ? "default" : "info"}
        >
          {alert.type === "danger" ? (
            <AlertCircle className="h-4 w-4" />
          ) : alert.type === "warning" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
