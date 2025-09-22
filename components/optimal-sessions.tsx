"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"

export function OptimalSessions() {
  const { selectedSpot } = useSpotStore()

  // Datos de sesiones óptimas para cada spot
  const spotSessions: Record<string, { morning: boolean; afternoon: boolean; evening: boolean; bestDays: string[] }> = {
    "la-ballena": {
      morning: false,
      afternoon: true,
      evening: true,
      bestDays: ["Martes", "Miércoles", "Jueves"],
    },
    "kitesurf-point": {
      morning: true,
      afternoon: true,
      evening: false,
      bestDays: ["Lunes", "Martes", "Viernes"],
    },
    "can-martinet": {
      morning: false,
      afternoon: true,
      evening: false,
      bestDays: ["Miércoles", "Jueves", "Domingo"],
    },
    "la-rubina": {
      morning: true,
      afternoon: true,
      evening: true,
      bestDays: ["Lunes", "Miércoles", "Sábado"],
    },
  }

  const sessions = spotSessions[selectedSpot] || spotSessions["la-ballena"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions Òptimes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`rounded-lg border p-3 text-center ${sessions.morning ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="text-sm font-medium">Matí</div>
              <div className="mt-1">
                {sessions.morning ? (
                  <Badge variant="success" className="bg-green-600">
                    Recomanat
                  </Badge>
                ) : (
                  <Badge variant="outline">No òptim</Badge>
                )}
              </div>
            </div>
            <div
              className={`rounded-lg border p-3 text-center ${sessions.afternoon ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="text-sm font-medium">Migdia</div>
              <div className="mt-1">
                {sessions.afternoon ? (
                  <Badge variant="success" className="bg-green-600">
                    Recomanat
                  </Badge>
                ) : (
                  <Badge variant="outline">No òptim</Badge>
                )}
              </div>
            </div>
            <div
              className={`rounded-lg border p-3 text-center ${sessions.evening ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="text-sm font-medium">Tarda</div>
              <div className="mt-1">
                {sessions.evening ? (
                  <Badge variant="success" className="bg-green-600">
                    Recomanat
                  </Badge>
                ) : (
                  <Badge variant="outline">No òptim</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 text-sm font-medium">Millors dies de la setmana</div>
            <div className="flex flex-wrap gap-2">
              {sessions.bestDays.map((day) => (
                <Badge key={day} variant="outline" className="bg-blue-50 text-blue-700">
                  {day}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
