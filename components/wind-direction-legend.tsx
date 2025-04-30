"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"

export function WindDirectionLegend() {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-sm">
          <Info className="mr-2 h-4 w-4 text-blue-600" />
          Llegenda de direcció del vent
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: "rotate(0deg)" }}
            >
              <path
                d="M12 4L4 20L12 17L20 20L12 4Z"
                fill="#3b82f6"
                stroke="#3b82f6"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ml-1">Vent del Nord (N)</span>
          </div>
          <div className="flex items-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: "rotate(90deg)" }}
            >
              <path
                d="M12 4L4 20L12 17L20 20L12 4Z"
                fill="#3b82f6"
                stroke="#3b82f6"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ml-1">Vent de l'Est (E)</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Les fletxes indiquen la direcció CAP A ON va el vent. Per exemple, un vent del Nord (N) bufa des del Nord cap
          al Sud.
        </p>
      </CardContent>
    </Card>
  )
}
