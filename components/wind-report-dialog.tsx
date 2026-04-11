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
import { windCalibration } from "@/lib/calibration"
import { addUserObservation } from "@/lib/api"
import { predictionHistory } from "@/lib/prediction-history"
import { Wind, CheckCircle, Brain, BarChart3 } from "lucide-react"

interface WindReportDialogProps {
  currentModelData?: {
    windSpeed: number
    windDirection: number
  }
  onReportSubmitted?: () => void
}

const SPOT = "sant-pere-pescador"

export function WindReportDialog({ currentModelData, onReportSubmitted }: WindReportDialogProps) {
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

      // 1. Añadir observación al sistema de calibración
      const observation = windCalibration.addObservation({
        spot: SPOT,
        reportedWindSpeed: windSpeedNum,
        reportedDirection: directionDegrees,
        modelWindSpeed: currentModelData?.windSpeed || 0,
        modelDirection: currentModelData?.windDirection || 0,
        userId: `user-${Date.now()}`
      })

      // 2. Añadir observación al sistema de Machine Learning
      if (currentModelData) {
        addUserObservation(SPOT, {
          reportedWindSpeed: windSpeedNum,
          reportedDirection: directionDegrees,
          modelWindSpeed: currentModelData.windSpeed,
          modelWindDirection: currentModelData.windDirection
        })
      }

      // 3. Registrar a l'historic de precisio per calcular accuracy
      const gustEstimate = Math.round(windSpeedNum * 1.3)
      predictionHistory.reportActualConditions(
        SPOT,
        windSpeedNum,
        directionDegrees,
        gustEstimate
      )

      console.log("Observacio afegida a tots els sistemes:", observation)

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
      console.error("Error enviant el report:", error)
      alert("Error enviant el report. Si us plau, torna-ho a intentar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 px-3 py-2 text-xs hover:bg-blue-700 sm:px-4 sm:text-sm">
          <Wind className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Comparteix vent actual</span>
          <span className="sm:hidden">Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Wind className="h-5 w-5 text-blue-600" />
            Reportar condicions actuals
          </DialogTitle>
          <DialogDescription className="text-sm">
            Comparteix el vent real que tens ara perquè l'ajust local sigui més útil.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <Brain className="h-6 w-6 text-purple-600" />
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-green-800">Report enviat!</h3>
              <p className="mt-1 text-sm text-green-600">
                Gracies. L'ajust local tindra en compte aquesta observacio.
              </p>
              <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-600">
                Aquesta dada s'ha afegit a l'historic de precisio per mesurar la qualitat de les prediccions.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="windSpeed" className="text-right text-sm">
                  Vent (kn)
                </Label>
                <Input
                  id="windSpeed"
                  value={report.windSpeed}
                  onChange={(e) => setReport({ ...report, windSpeed: e.target.value })}
                  type="number"
                  min="0"
                  max="50"
                  className="col-span-3 text-sm"
                  placeholder="Ex: 12"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="windDirection" className="text-right text-sm">
                  Direcció
                </Label>
                <Select
                  value={report.windDirection}
                  onValueChange={(value) => setReport({ ...report, windDirection: value })}
                >
                  <SelectTrigger className="col-span-3 text-sm">
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
                <Label htmlFor="confidence" className="text-right text-sm">
                  Confiança
                </Label>
                <Select
                  value={report.confidence}
                  onValueChange={(value) => setReport({ ...report, confidence: value })}
                >
                  <SelectTrigger className="col-span-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta - Mesurat</SelectItem>
                    <SelectItem value="medium">Mitjana - Visual</SelectItem>
                    <SelectItem value="low">Baixa - Estimació</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comment" className="text-right text-sm">
                  Comentari
                </Label>
                <Textarea
                  id="comment"
                  value={report.comment}
                  onChange={(e) => setReport({ ...report, comment: e.target.value })}
                  className="col-span-3 text-sm"
                  placeholder="Condicions adicionals (opcional)"
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

            <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Ajust local de la previsió</span>
              </div>
              <div className="text-xs text-purple-700">
                El teu report no substitueix el model: ajuda a afinar-lo per aquest spot quan hi ha observacions recents.
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || !report.windSpeed}
                className="text-sm"
              >
                {loading ? "Enviant..." : "Enviar report"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
