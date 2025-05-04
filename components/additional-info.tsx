"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSpotStore } from "@/lib/store"

export function AdditionalInfo() {
  const { selectedSpot } = useSpotStore()

  // Información adicional para cada spot
  const spotInfo: Record<string, { temperature: number; uvIndex: number; waterTemp: number }> = {
    aquarius: { temperature: 25, uvIndex: 7, waterTemp: 22 },
    "la-gaviota": { temperature: 24, uvIndex: 6, waterTemp: 21 },
  }

  const info = spotInfo[selectedSpot] || spotInfo["aquarius"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informació Addicional</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center rounded-lg border p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-2 h-8 w-8 text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <div className="text-2xl font-bold">{info.temperature}°C</div>
            <div className="text-sm text-muted-foreground">Temperatura</div>
          </div>
          <div className="flex flex-col items-center rounded-lg border p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-2 h-8 w-8 text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2" />
              <path d="M12 21v2" />
              <path d="M4.22 4.22l1.42 1.42" />
              <path d="M18.36 18.36l1.42 1.42" />
              <path d="M1 12h2" />
              <path d="M21 12h2" />
              <path d="M4.22 19.78l1.42-1.42" />
              <path d="M18.36 5.64l1.42-1.42" />
            </svg>
            <div className="text-2xl font-bold">{info.uvIndex}</div>
            <div className="text-sm text-muted-foreground">Índex UV</div>
          </div>
          <div className="flex flex-col items-center rounded-lg border p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-2 h-8 w-8 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12h20" />
              <path d="M12 2v20" />
              <path d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M12 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M18 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
            <div className="text-2xl font-bold">{info.waterTemp}°C</div>
            <div className="text-sm text-muted-foreground">Temperatura de l'aigua</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
