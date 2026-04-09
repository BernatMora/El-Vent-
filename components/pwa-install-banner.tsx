"use client"

import { useEffect, useState } from "react"
import { Download, Share2, Smartphone, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateOnlineStatus = () => setIsOnline(window.navigator.onLine)
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    const iosDevice = /iPad|iPhone|iPod/.test(window.navigator.userAgent)

    setIsStandalone(standalone)
    setIsIos(iosDevice)
    updateOnlineStatus()

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    setIsInstalling(true)
    await installPrompt.prompt()
    await installPrompt.userChoice.catch(() => null)
    setInstallPrompt(null)
    setIsInstalling(false)
  }

  const showInstallCta = !isStandalone && !!installPrompt
  const showIosHint = !isStandalone && isIos && !installPrompt

  return (
    <div className="mb-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-3 shadow-sm sm:mb-6 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={isOnline ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
              {isOnline ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
              {isOnline ? "En línia" : "Sense connexió"}
            </Badge>
            <Badge variant="outline" className="border-sky-200 bg-white text-sky-700">
              <Smartphone className="mr-1 h-3 w-3" />
              Mode app mòbil
            </Badge>
          </div>

          <p className="text-sm text-slate-700">
            {isOnline
              ? "Pots instal·lar El Vent al mòbil i obrir-lo com una app ràpida des de la pantalla d'inici."
              : "Ara mateix estàs sense cobertura. L'app intentarà mostrar les últimes dades guardades al dispositiu."}
          </p>
        </div>

        {showInstallCta ? (
          <Button onClick={handleInstall} disabled={isInstalling} className="sm:self-start">
            <Download className="mr-2 h-4 w-4" />
            {isInstalling ? "Preparant..." : "Instal·la l'app"}
          </Button>
        ) : isStandalone ? (
          <span className="text-xs font-medium text-emerald-700">Ja la tens instal·lada ✅</span>
        ) : showIosHint ? (
          <div className="rounded-xl border border-sky-200 bg-white/80 px-3 py-2 text-xs text-sky-800 sm:max-w-xs">
            <div className="mb-1 flex items-center gap-1 font-medium">
              <Share2 className="h-3.5 w-3.5" />
              Instal·lació a l'iPhone
            </div>
            <p>A Safari, toca <strong>Comparteix</strong> i després <strong>"Afegeix a la pantalla d'inici"</strong>.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
