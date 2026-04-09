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
      description: "Zona principal de kitesurf a Sant Pere Pescador, amb força espai per preparar el material.",
      bestWindDirection: "NE, E, SE",
      bestTide: "Mitja i alta",
      access: "Fàcil, amb aparcament proper",
    },
    "kitesurf-point": {
      description: "Zona nord amb condicions més suaus, ideal per a principiants i dies de vent moderat.",
      bestWindDirection: "E, SE",
      bestTide: "Mitja",
      access: "Mitjà, camí de sorra",
    },
    "can-martinet": {
      description: "Zona sud amb vents més constants, preferida per riders amb més experiència.",
      bestWindDirection: "NE, E",
      bestTide: "Baixa i mitja",
      access: "Difícil, camí estret",
    },
    "la-rubina": {
      description: "Spot entre Sant Pere Pescador i Roses, menys massificat i amb platja àmplia per a sessions llargues.",
      bestWindDirection: "E, NE, SE",
      bestTide: "Totes les marees",
      access: "Mitjà, des de la carretera principal",
    },
  }

  const details = spotDetails[selectedSpot] || spotDetails["kitesurf-point"]

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
