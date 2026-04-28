"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, BellRing, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  subscribeToPush,
  unsubscribeFromPush,
  updatePushPrefs,
} from "@/lib/push-client"

interface NotificationPreferences {
  enabled: boolean
  minWind: number
  alertDayBefore: boolean
  alertMorning: boolean
  offshoreWarnings: boolean
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: false,
  minWind: 15,
  alertDayBefore: true,
  alertMorning: true,
  offshoreWarnings: true,
}

const STORAGE_KEY = "el-vent-notification-prefs"

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS)
  const [isSupported, setIsSupported] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const supported = "Notification" in window && "serviceWorker" in navigator
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }

    // Load saved preferences
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) })
      } catch {
        // ignore
      }
    }
  }, [])

  const savePrefs = (newPrefs: NotificationPreferences) => {
    setPrefs(newPrefs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs))
    if (newPrefs.enabled && permission === "granted") {
      // Sincronitza preferències al servidor (sense bloquejar)
      updatePushPrefs({
        minWind: newPrefs.minWind,
        alertDayBefore: newPrefs.alertDayBefore,
        alertMorning: newPrefs.alertMorning,
        offshoreWarnings: newPrefs.offshoreWarnings,
      }).catch(() => {})
    }
  }

  const requestPermission = async () => {
    if (!isSupported) return

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result === "granted") {
      const sub = await subscribeToPush({
        minWind: prefs.minWind,
        alertDayBefore: prefs.alertDayBefore,
        alertMorning: prefs.alertMorning,
        offshoreWarnings: prefs.offshoreWarnings,
      })
      if (!sub.ok) {
        // Fallback: notificacions locals només
        console.warn("Push subscription failed:", sub.error)
      }
      savePrefs({ ...prefs, enabled: true })
      // Show test notification
      showTestNotification()
    }
  }

  const toggleEnabled = (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      requestPermission()
    } else if (!enabled) {
      unsubscribeFromPush().catch(() => {})
      savePrefs({ ...prefs, enabled })
    } else {
      savePrefs({ ...prefs, enabled })
    }
  }

  const showTestNotification = async () => {
    if (!("serviceWorker" in navigator)) return

    const registration = await navigator.serviceWorker.ready
    await registration.showNotification("El Vent - Notificacions activades", {
      body: "Rebras alertes quan hi hagi bones condicions de vent per navegar.",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: "test-notification",
    })
  }

  if (!isSupported) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {prefs.enabled && permission === "granted" ? (
              <BellRing className="h-5 w-5 text-amber-600" />
            ) : (
              <Bell className="h-5 w-5 text-amber-600" />
            )}
            <CardTitle className="text-lg text-amber-900">Alertes de vent</CardTitle>
          </div>
          {prefs.enabled && permission === "granted" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-amber-700">
          Rep notificacions quan hi hagi bones condicions previstes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {permission === "denied" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <BellOff className="mb-1 inline h-4 w-4" /> Les notificacions estan bloquejades. 
            Canvia els permisos a la configuracio del navegador.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-enabled" className="text-amber-900">
                Activar alertes
              </Label>
              <Switch
                id="notifications-enabled"
                checked={prefs.enabled && permission === "granted"}
                onCheckedChange={toggleEnabled}
              />
            </div>

            {showSettings && prefs.enabled && permission === "granted" && (
              <div className="space-y-4 border-t border-amber-200 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-amber-800">Vent minim per alertar</Label>
                    <span className="text-sm font-medium text-amber-900">{prefs.minWind} kn</span>
                  </div>
                  <Slider
                    value={[prefs.minWind]}
                    onValueChange={([v]) => savePrefs({ ...prefs, minWind: v })}
                    min={12}
                    max={25}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-amber-600">
                    Nomes rebras alerta si la previsio supera aquest llindar
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alert-day-before" className="text-sm text-amber-800">
                      Alerta el dia abans (20:00)
                    </Label>
                    <Switch
                      id="alert-day-before"
                      checked={prefs.alertDayBefore}
                      onCheckedChange={(v) => savePrefs({ ...prefs, alertDayBefore: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="alert-morning" className="text-sm text-amber-800">
                      Alerta al mati (7:00)
                    </Label>
                    <Switch
                      id="alert-morning"
                      checked={prefs.alertMorning}
                      onCheckedChange={(v) => savePrefs({ ...prefs, alertMorning: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="offshore-warnings" className="text-sm text-amber-800">
                      Avisos de vent offshore
                    </Label>
                    <Switch
                      id="offshore-warnings"
                      checked={prefs.offshoreWarnings}
                      onCheckedChange={(v) => savePrefs({ ...prefs, offshoreWarnings: v })}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
