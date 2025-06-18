"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSpotStore } from "@/lib/store"
import { windCalibration, type WindObservation } from "@/lib/calibration"
import { Users, Clock, Wind, TrendingUp } from "lucide-react"

export function UserReportsPanel() {
  const { selectedSpot } = useSpotStore()
  const [reports, setReports] = useState<WindObservation[]>([])
  const [calibrationInfo, setCalibrationInfo] = useState<any>(null)

  useEffect(() => {
    const updateReports = () => {
      const recentReports = windCalibration.getRecentObservations(selectedSpot, 6)
      setReports(recentReports)
      
      const info = windCalibration.getCalibrationInfo(selectedSpot)
      setCalibrationInfo(info)
    }

    updateReports()
    
    // Actualizar cada minuto
    const interval = setInterval(updateReports, 60000)
    
    return () => clearInterval(interval)
  }, [selectedSpot])

  const getDirectionName = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  const getTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60))
    if (minutes < 60) return `Fa ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Fa ${hours}h`
    return `Fa ${Math.floor(hours / 24)}d`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Users className="mr-2 h-5 w-5 text-blue-600" />
          Reportes d'usuaris
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calibrationInfo && calibrationInfo.observationCount > 0 && (
          <div className="mb-4 rounded-lg border bg-blue-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Factor de calibració actiu</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>Velocitat: {(calibrationInfo.speedMultiplier * 100).toFixed(0)}%</div>
              <div>Direcció: {calibrationInfo.directionOffset > 0 ? '+' : ''}{calibrationInfo.directionOffset.toFixed(0)}°</div>
              <div className="col-span-2">Basat en {calibrationInfo.observationCount} observacions</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">
                      {report.reportedWindSpeed} kn {getDirectionName(report.reportedDirection)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(report.timestamp)}
                  </div>
                </div>
                
                {report.modelWindSpeed > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Model: {report.modelWindSpeed} kn</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        Math.abs(report.reportedWindSpeed - report.modelWindSpeed) <= 2 
                          ? 'border-green-200 text-green-700' 
                          : 'border-amber-200 text-amber-700'
                      }`}
                    >
                      {report.reportedWindSpeed > report.modelWindSpeed ? '+' : ''}
                      {(report.reportedWindSpeed - report.modelWindSpeed).toFixed(0)} kn
                    </Badge>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No hi ha reportes recents per aquest spot.
              <br />
              Sigues el primer en reportar les condicions actuals!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}