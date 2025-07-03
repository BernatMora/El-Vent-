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

          // Comprobar viento fuerte (solo si realmente hay viento)
          const maxWind = Math.max(...today.hours.map((h: any) => h.windSpeed))
          if (maxWind > 25) {
            newAlerts.push({
              type: "warning",
              title: "Alerta de vent fort",
              description: `S'esperen vents de fins a ${Math.round(maxWind)} nusos avui. Precaució per a riders principiants.`,
            })
          }

          // CORRECCIÓ: Comprobar viento offshore SOLO si hay viento significativo (>8 kn)
          const offshoreHours = today.hours.filter((h: any) => {
            const dir = h.windDirection
            const speed = h.windSpeed
            // Offshore: direcciones entre 225° y 315° (SW, W, NW) Y con viento > 8 kn
            return speed > 8 && dir >= 225 && dir <= 315
          })

          if (offshoreHours.length > 0) {
            const maxOffshoreWind = Math.max(...offshoreHours.map((h: any) => h.windSpeed))
            newAlerts.push({
              type: "danger",
              title: "Alerta de vent offshore",
              description: `S'esperen vents de terra a mar de ${Math.round(maxOffshoreWind)} kn en algunes hores. Navega amb precaució i mai sol.`,
            })
          }

          // Alerta de viento muy débil (nuevo)
          const avgWind = today.hours.reduce((sum: number, h: any) => sum + h.windSpeed, 0) / today.hours.length
          if (avgWind < 5) {
            newAlerts.push({
              type: "info",
              title: "Condicions de poc vent",
              description: `S'esperen vents febles avui (mitjana ${Math.round(avgWind)} kn). Ideal per a principiants o per practicar maniobres.`,
            })
          }

          // Alerta de spot específico (solo si es relevante)
          if (selectedSpot === "kitesurf-point" && maxWind > 12) {
            newAlerts.push({
              type: "info",
              title: "Informació de Kitesurf Point",
              description: "Recorda que aquesta zona és més adequada per a principiants. Respecta les zones de navegació.",
            })
          } else if (selectedSpot === "can-martinet" && maxWind > 15) {
            newAlerts.push({
              type: "info",
              title: "Informació de Can Martinet",
              description: "Aquesta zona pot tenir corrents més forts. Recomanat per a riders amb experiència.",
            })
          }

          // Alerta de condiciones perfectas (nuevo)
          const perfectHours = today.hours.filter((h: any) => {
            const speed = h.windSpeed
            const dir = h.windDirection
            // Condiciones perfectas: 12-20 kn, viento del E/SE/NE (onshore/side-onshore)
            return speed >= 12 && speed <= 20 && 
                   ((dir >= 45 && dir <= 135) || (dir >= 315 || dir <= 45))
          })

          if (perfectHours.length >= 3) {
            newAlerts.push({
              type: "info",
              title: "Condicions excel·lents per kitesurf",
              description: `S'esperen ${perfectHours.length} hores amb condicions ideals (12-20 kn, vent favorable). Perfecte per navegar!`,
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
          variant={alert.type === "danger" ? "destructive" : alert.type === "warning" ? "default" : "default"}
          className={
            alert.type === "info" && alert.title.includes("excel·lents") 
              ? "border-green-200 bg-green-50" 
              : ""
          }
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