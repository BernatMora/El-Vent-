"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"

export function SpotDetails() {
  const { selectedSpot } = useSpotStore()

  // Detalles para cada spot
  const spotDetails: Record<
    string,
    { description: string; bestWindDirection: string; bestTide: string; access: string }
  > = {
    "la-ballena": {
      description: "Zona principal de kitesurf en Sant Pere Pescador, con amplio espacio para montar el equipo.",
      bestWindDirection: "NE, E, SE",
      bestTide: "Media y alta",
      access: "Fácil, con parking cercano",
    },
    "kitesurf-point": {
      description: "Zona norte con condiciones más suaves, ideal para principiantes y días de viento moderado.",
      bestWindDirection: "E, SE",
      bestTide: "Media",
      access: "Medio, camino de arena",
    },
    "can-martinet": {
      description: "Zona sur con vientos más constantes, preferida por riders experimentados.",
      bestWindDirection: "NE, E",
      bestTide: "Baja y media",
      access: "Difícil, camino estrecho",
    },
    "la-rubina": {
      description: "Spot entre Sant Pere Pescador i Roses, menys massificat amb platja àmplia i bones condicions.",
      bestWindDirection: "E, NE, SE",
      bestTide: "Totes les marees",
      access: "Mitjà, des de la carretera principal",
    },
  }

  const details = spotDetails[selectedSpot] || spotDetails["la-ballena"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalls del Spot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm">{details.description}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-muted-foreground">Millor direcció del vent</div>
              <div className="mt-1 font-medium">{details.bestWindDirection}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-muted-foreground">Millor marea</div>
              <div className="mt-1 font-medium">{details.bestTide}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-muted-foreground">Accés</div>
              <div className="mt-1 font-medium">{details.access}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
