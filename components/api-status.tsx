"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle } from "lucide-react"

export function ApiStatus() {
  const [lastUpdate, setLastUpdate] = useState<string>("")

  useEffect(() => {
    setLastUpdate(
      new Date().toLocaleTimeString("ca-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    )

    // Actualizar cada 5 minutos
    const interval = setInterval(() => {
      setLastUpdate(
        new Date().toLocaleTimeString("ca-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      )
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="mb-4">
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="text-green-600">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Dades simulades locals</span>
            <span className="text-xs text-muted-foreground">Patrons meteorològics realistes</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-600">
            Actiu
          </Badge>
          {lastUpdate && <span className="text-xs text-muted-foreground">{lastUpdate}</span>}
        </div>
      </CardContent>
    </Card>
  )
}