"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSpotStore } from "@/lib/store"
import { windCalibration } from "@/lib/calibration"
import { Wind, CheckCircle } from "lucide-react"

interface WindReportDialogProps {
  currentModelData?: {
    windSpeed: number
    windDirection: number
  }
  onReportSubmitted?: () => void
}

export function WindReportDialog({ currentModelData, onReportSubmitted }: WindReportDialogProps) {
  const { selectedSpot } = useSpotStore()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [report, setReport] = useState({
    windSpeed: "",
    windDirection: "E",
    comment: "",
    confidence: "high"
  })

  const handleSubmit = async () => {
    const windSpeedNum = Number.parseInt(report.windSpeed)

    if (isNaN(windSpeedNum) || windSpeedNum < 0 || windSpeedNum > 50) {
      alert("Si us plau, introdueix una velocitat de vent vàlida (0-50 kn)")
      return
    }

    setLoading(true)

    try {
      // Convertir dirección de texto a grados
      const directionMap: Record<string, number> = {
        N: 0, NE: 45, E: 90, SE: 135,
        S: 180, SW: 225, W: 270, NW: 315
      }

      const directionDegrees = directionMap[report.windDirection] || 90

      // Añadir observación al sistema de calibración
      const observation = windCalibration.addObservation({
        spot: selectedSpot,
        reportedWindSpeed: windSpeedNum,
        reportedDirection: directionDegrees,
        modelWindSpeed: currentModelData?.windSpeed || 0,
        modelDirection: currentModelData?.windDirection || 0,
        userId: `user-${Date.now()}`
      })

      console.log("Observación añadida:", observation)

      // Mostrar éxito
      setSuccess(true)
      
      // Notificar al componente padre
      if (onReportSubmitted) {
        onReportSubmitted()
      }

      // Resetear formulario después de un momento
      setTimeout(() => {
        setReport({
          windSpeed: "",
          windDirection: "E",
          comment: "",
          confidence: "high"
        })
        setSuccess(false)
        setOpen(false)
      }, 2000)
      
    } catch (error) {
      console.error("Error enviando reporte:", error)
      alert("Error enviant el reporte. Si us plau, torna-ho a intentar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Wind className="mr-2 h-4 w-4" />
          Reportar vent actual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reportar condicions actuals</DialogTitle>
          <DialogDescription>
            Comparteix les condicions reals de vent per ajudar a calibrar les previsions
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-green-800">Reporte enviat!</h3>
              <p className="text-sm text-green-600 mt-1">
                Gràcies per ajudar a millorar la precisió de les previsions
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="windSpeed" className="text-right">
                  Vent (kn)
                </Label>
                <Input
                  id="windSpeed"
                  value={report.windSpeed}
                  onChange={(e) => setReport({ ...report, windSpeed: e.target.value })}
                  type="number"
                  min="0"
                  max="50"
                  className="col-span-3"
                  placeholder="Ex: 12"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="windDirection" className="text-right">
                  Direcció
                </Label>
                <Select
                  value={report.windDirection}
                  onValueChange={(value) => setReport({ ...report, windDirection: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona direcció" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N">Tramuntana (N)</SelectItem>
                    <SelectItem value="NE">Gregal (NE)</SelectItem>
                    <SelectItem value="E">Llevant (E)</SelectItem>
                    <SelectItem value="SE">Xaloc (SE)</SelectItem>
                    <SelectItem value="S">Migjorn (S)</SelectItem>
                    <SelectItem value="SW">Llebeig (SW)</SelectItem>
                    <SelectItem value="W">Ponent (W)</SelectItem>
                    <SelectItem value="NW">Mestral (NW)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confidence" className="text-right">
                  Confiança
                </Label>
                <Select
                  value={report.confidence}
                  onValueChange={(value) => setReport({ ...report, confidence: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta - Mesurat amb instrument</SelectItem>
                    <SelectItem value="medium">Mitjana - Observació visual</SelectItem>
                    <SelectItem value="low">Baixa - Estimació aproximada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comment" className="text-right">
                  Comentari
                </Label>
                <Textarea
                  id="comment"
                  value={report.comment}
                  onChange={(e) => setReport({ ...report, comment: e.target.value })}
                  className="col-span-3"
                  placeholder="Condicions adicionals, ràfegues, etc. (opcional)"
                  rows={2}
                />
              </div>
            </div>

            {currentModelData && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="text-sm font-medium mb-1">Previsió del model:</div>
                <div className="text-sm text-muted-foreground">
                  {currentModelData.windSpeed} kn, {currentModelData.windDirection}°
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading || !report.windSpeed}
              >
                {loading ? "Enviant..." : "Enviar reporte"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}