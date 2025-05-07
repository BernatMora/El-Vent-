"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WifiOff } from "lucide-react"

interface OfflineModeBannerProps {
  onRetry: () => void
}

export function OfflineModeBanner({ onRetry }: OfflineModeBannerProps) {
  return (
    <Alert variant="destructive">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>Mode sense connexió</AlertTitle>
      <AlertDescription>
        No s'ha pogut connectar amb el servidor. Mostrant dades des de la memòria cau.
      </AlertDescription>
    </Alert>
  )
}
