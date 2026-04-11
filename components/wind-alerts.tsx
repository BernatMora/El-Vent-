"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type ForecastDay, getForecastData } from "@/lib/api"

const SPOT = "sant-pere-pescador"
const WIND_THRESHOLD = 12 // kn - llindar mínim per navegar

function getNotificationPermission(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("el-vent:notifications") === "on"
}

function setNotificationPermission(on: boolean) {
  localStorage.setItem("el-vent:notifications", on ? "on" : "off")
}

async function sendNotification(title: string, body: string) {
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission()
    if (perm !== "granted") return
  }
  new Notification(title, { body, icon: "/icons/icon-192.svg" })
}

export function WindAlerts() {
  const [enabled, setEnabled] = useState(false)
  const [lastAlert, setLastAlert] = useState<string | null>(null)

  useEffect(() => {
    setEnabled(getNotificationPermission())
  }, [])

  useEffect(() => {
    if (!enabled) return

    async function check() {
      try {
        const data = await getForecastData(SPOT)
        if (!data[0]?.hours) return

        const now = new Date()
        const currentHour = now.getHours()
        const upcomingGood = data[0].hours.filter((h) => {
          const hour = parseInt(h.time.split(":")[0])
          return hour > currentHour && hour <= currentHour + 3 && h.windSpeed >= WIND_THRESHOLD
        })

        if (upcomingGood.length > 0) {
          const window = `${upcomingGood[0].time}–${upcomingGood[upcomingGood.length - 1].time}`
          const avg = Math.round(upcomingGood.reduce((s, h) => s + h.windSpeed, 0) / upcomingGood.length)
          const msg = `Vent bo les pròximes hores: ${window}, ~${avg} kn`
          const alertKey = `${data[0].date}-${window}`

          if (alertKey !== lastAlert) {
            sendNotification("🪁 Bon vent a la vista!", msg)
            setLastAlert(alertKey)
          }
        }
      } catch {
        // ignore
      }
    }

    check()
    const interval = setInterval(check, 30 * 60 * 1000) // cada 30 min
    return () => clearInterval(interval)
  }, [enabled, lastAlert])

  const toggle = async () => {
    if (!enabled) {
      if ("Notification" in window && Notification.permission !== "granted") {
        const perm = await Notification.requestPermission()
        if (perm !== "granted") return
      }
      setEnabled(true)
      setNotificationPermission(true)
    } else {
      setEnabled(false)
      setNotificationPermission(false)
    }
  }

  return (
    <Card className="border-sky-100">
      <CardContent className="flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center gap-2">
          {enabled ? (
            <Bell className="h-4 w-4 text-sky-600" />
          ) : (
            <BellOff className="h-4 w-4 text-slate-400" />
          )}
          <div>
            <div className="text-sm font-medium">Alertes de vent</div>
            <div className="text-xs text-muted-foreground">
              {enabled
                ? `Notificació quan hi hagi ≥${WIND_THRESHOLD} kn a les properes 3h`
                : "Activa per rebre alertes de bon vent"}
            </div>
          </div>
        </div>
        <button
          onClick={toggle}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            enabled
              ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {enabled ? "Activat" : "Activar"}
        </button>
      </CardContent>
    </Card>
  )
}
