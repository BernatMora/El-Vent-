"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, Zap, AlertCircle, Database } from "lucide-react"

export function ApiStatus() {
  const [apiStatus, setApiStatus] = useState<"loading" | "real" | "realistic" | "fallback" | "error">("loading")
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [dataSource, setDataSource] = useState<string>("")

  useEffect(() => {
    // Verificar el estado de la API
    const checkApiStatus = async () => {
      try {
        const hasWindyKey = process.env.NEXT_PUBLIC_WINDY_API_KEY || process.env.WINDY_API_KEY || false

        if (hasWindyKey) {
          // Intentar determinar si tenemos acceso a datos reales
          try {
            const response = await fetch("/api/test-windy", { method: "POST" })
            const result = await response.json()

            if (response.ok) {
              if (result.dataSource === "real") {
                setApiStatus("real")
                setDataSource("Windy Point Forecast API")
              } else {
                setApiStatus("realistic")
                setDataSource("Generació realista amb Windy Plugins API")
              }
            } else {
              setApiStatus("fallback")
              setDataSource("Dades simulades")
            }
          } catch {
            setApiStatus("realistic")
            setDataSource("Generació realista")
          }
        } else {
          setApiStatus("fallback")
          setDataSource("Dades simulades")
        }

        setLastUpdate(
          new Date().toLocaleTimeString("ca-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        )
      } catch (error) {
        setApiStatus("error")
        setDataSource("Error de configuració")
      }
    }

    checkApiStatus()

    // Verificar cada 5 minutos
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const getStatusInfo = () => {
    switch (apiStatus) {
      case "real":
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: "Dades reals de Windy",
          variant: "default" as const,
          color: "text-green-600",
          badgeText: "Temps real",
          badgeClass: "bg-green-600",
        }
      case "realistic":
        return {
          icon: <Zap className="h-4 w-4" />,
          text: "Dades realistes generades",
          variant: "default" as const,
          color: "text-blue-600",
          badgeText: "Realista",
          badgeClass: "bg-blue-600",
        }
      case "fallback":
        return {
          icon: <Database className="h-4 w-4" />,
          text: "Dades simulades",
          variant: "secondary" as const,
          color: "text-amber-600",
          badgeText: "Simulat",
          badgeClass: "",
        }
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: "Error de configuració",
          variant: "destructive" as const,
          color: "text-red-600",
          badgeText: "Error",
          badgeClass: "",
        }
      default:
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: "Carregant...",
          variant: "outline" as const,
          color: "text-gray-600",
          badgeText: "...",
          badgeClass: "",
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Card className="mb-4">
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className={statusInfo.color}>{statusInfo.icon}</div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{statusInfo.text}</span>
            {dataSource && <span className="text-xs text-muted-foreground">{dataSource}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant} className={statusInfo.badgeClass}>
            {statusInfo.badgeText}
          </Badge>
          {lastUpdate && <span className="text-xs text-muted-foreground">{lastUpdate}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
