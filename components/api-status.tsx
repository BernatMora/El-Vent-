"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, Database, CheckCircle, AlertCircle } from "lucide-react"

export function ApiStatus() {
  const [apiStatus, setApiStatus] = useState<"loading" | "real" | "fallback" | "error">("loading")
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [dataSource, setDataSource] = useState<string>("")

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("/api/current")

        if (response.ok) {
          const data = await response.json()
          setApiStatus("real")
          setDataSource(data.source || data.current?.source || "Dades meteorològiques")
        } else {
          throw new Error("API response not ok")
        }
      } catch (error) {
        setApiStatus("fallback")
        setDataSource("Dades simulades")
      }

      setLastUpdate(
        new Date().toLocaleTimeString("ca-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      )
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
          text: "Dades meteorològiques reals",
          variant: "default" as const,
          color: "text-green-600",
          badgeText: "En línia",
          badgeClass: "bg-green-600",
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
          text: "Error de connexió",
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
