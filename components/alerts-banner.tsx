"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSpotStore } from "@/lib/store"
import { type ForecastHour, getForecastData } from "@/lib/api"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"

type AlertItem = {
  type: "danger" | "warning" | "info"
  title: string
  description: string
}

export function AlertsBanner() {
  const { selectedSpot } = useSpotStore()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAlerts() {
      try {
        setLoading(true)
        const data = await getForecastData(selectedSpot)

        // Reiniciar alertas
        const newAlerts: AlertItem[] = []

        // Comprobar si hay datos
        if (data && data.length > 0) {
          const today = data[0]

          // Comprobar viento fuerte (solo si realmente hay viento)
          const maxWind = Math.max(...today.hours.map((h: ForecastHour) => h.windSpeed))
          if (maxWind > 25) {
            newAlerts.push({
              type: "warning",
              title: "Alerta de vent fort",
              description: `S'esperen vents de fins a ${Math.round(maxWind)} nusos avui. Precaució per a riders principiants.`,
            })
          }

          // CORRECCIÓ: Vents offshore per Sant Pere Pescador
          // Offshore = vents de terra cap a mar
          // Per Sant Pere (costa orientada al sud-est):
          // - Offshore: N, NW, W (315°-45° aprox) - PERILLOSOS
          // - Onshore: E, SE, S (45°-225° aprox) - SEGURS
          // - Side-shore: NE, SW - ACCEPTABLES
          const offshoreHours = today.hours.filter((h: ForecastHour) => {
            const dir = h.windDirection
            const speed = h.windSpeed
            // Offshore: direccions entre 315° i 45° (N, NW, W) Y amb vent > 8 kn
            return speed > 8 && (dir >= 315 || dir <= 45)
          })

          if (offshoreHours.length > 0) {
            const maxOffshoreWind = Math.max(...offshoreHours.map((h: ForecastHour) => h.windSpeed))
            const offshoreDirection = offshoreHours[0].windDirection
            let directionName = "Nord"
            if (offshoreDirection >= 315 || offshoreDirection <= 15) directionName = "Tramuntana (N)"
            else if (offshoreDirection > 15 && offshoreDirection <= 45) directionName = "Gregal (NE)"
            else if (offshoreDirection >= 270 && offshoreDirection < 315) directionName = "Mestral (NW)"
            else if (offshoreDirection >= 225 && offshoreDirection < 270) directionName = "Ponent (W)"

            newAlerts.push({
              type: "danger",
              title: "Alerta de vent offshore",
              description: `S'esperen vents ${directionName} de ${Math.round(maxOffshoreWind)} kn (de terra a mar). Navega amb precaució i mai sol.`,
            })
          }

          // Alerta de viento muy débil
          const avgWind = today.hours.reduce((sum: number, h: ForecastHour) => sum + h.windSpeed, 0) / today.hours.length
          if (avgWind < 5) {
            newAlerts.push({
              type: "info",
              title: "Condicions de poc vent",
              description: `S'esperen vents febles avui (mitjana ${Math.round(avgWind)} kn). Ideal per a principiants o per practicar maniobres.`,
            })
          }

          // Alerta de condiciones perfectas para kitesurf
          // Condicions ideals: vent onshore/side-onshore (E, SE, NE) entre 12-20 kn
          const perfectHours = today.hours.filter((h: ForecastHour) => {
            const speed = h.windSpeed
            const dir = h.windDirection
            // Condicions perfectes: 12-20 kn, vent onshore (E, SE) o side-onshore (NE)
            return speed >= 12 && speed <= 20 && 
                   ((dir >= 45 && dir <= 135) || // E, SE
                    (dir >= 15 && dir <= 75))    // NE inclòs
          })

          if (perfectHours.length >= 3) {
            const avgPerfectWind = Math.round(perfectHours.reduce((sum: number, h: ForecastHour) => sum + h.windSpeed, 0) / perfectHours.length)
            newAlerts.push({
              type: "info",
              title: "Condicions excel·lents per kitesurf",
              description: `S'esperen ${perfectHours.length} hores amb condicions ideals (${avgPerfectWind} kn mitjana, vent favorable del mar). Perfecte per navegar!`,
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
          } else if (selectedSpot === "la-rubina" && maxWind > 10) {
            newAlerts.push({
              type: "info",
              title: "Informació de La Rubina",
              description: "Spot menys massificat entre Sant Pere i Roses. Platja àmplia ideal per sessions llargues.",
            })
          }

          // Informació sobre direcció del vent actual
          if (today.hours.length > 0) {
            const currentHour = today.hours[Math.floor(today.hours.length / 2)] // Hora del migdia aprox
            const currentDir = currentHour.windDirection
            const currentSpeed = currentHour.windSpeed
            
            if (currentSpeed > 5) {
              let windType = ""
              let windDescription = ""
              
              if (currentDir >= 45 && currentDir <= 135) {
                windType = "onshore"
                windDescription = "del mar cap a terra - Ideal per kitesurf"
              } else if (currentDir >= 315 || currentDir <= 45) {
                windType = "offshore"
                windDescription = "de terra cap a mar - Precaució!"
              } else if (currentDir > 135 && currentDir < 225) {
                windType = "side-shore"
                windDescription = "paral·lel a la costa - Acceptable"
              } else {
                windType = "variable"
                windDescription = "direcció variable"
              }

              // Només mostrar si és informatiu (no repetir alertes de perill)
              if (windType === "onshore" && currentSpeed >= 8) {
                newAlerts.push({
                  type: "info",
                  title: "Vent favorable detectat",
                  description: `Vent ${windDescription} de ${currentSpeed} kn. Bones condicions per navegar.`,
                })
              }
            }
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
              : alert.type === "info" && alert.title.includes("favorable")
                ? "border-blue-200 bg-blue-50"
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