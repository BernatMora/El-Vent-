"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wind, Upload, CheckCircle, AlertCircle, Compass } from "lucide-react"
import { getWindName, getWindDirectionCategory } from "@/lib/calibration-service"

interface ForecastData {
  windSpeed: number
  windGust: number
  direction: number
  timestamp: string
}

export function CalibrationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dades de la previsió (es carreguen automàticament)
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  
  // Dades reals (les introdueix l'usuari)
  const [realWindSpeed, setRealWindSpeed] = useState("")
  const [realWindGust, setRealWindGust] = useState("")
  const [realDirection, setRealDirection] = useState("")
  const [notes, setNotes] = useState("")
  
  // Carregar la previsió actual
  useEffect(() => {
    async function loadForecast() {
      try {
        const response = await fetch("/api/forecast")
        if (!response.ok) return
        
        const data = await response.json()
        if (data.forecast && data.forecast.length > 0) {
          // Buscar l'hora actual o la més propera
          const now = new Date()
          const currentHour = now.getHours()
          
          for (const day of data.forecast) {
            if (day.hours) {
              const hourData = day.hours.find((h: any) => h.hour === currentHour)
              if (hourData) {
                setForecast({
                  windSpeed: hourData.windSpeed,
                  windGust: hourData.windGust,
                  direction: hourData.windDirection,
                  timestamp: new Date().toISOString()
                })
                return
              }
            }
          }
          
          // Si no trobem l'hora exacta, agafem la primera disponible
          const firstDay = data.forecast[0]
          if (firstDay.hours && firstDay.hours.length > 0) {
            const firstHour = firstDay.hours[0]
            setForecast({
              windSpeed: firstHour.windSpeed,
              windGust: firstHour.windGust,
              direction: firstHour.windDirection,
              timestamp: new Date().toISOString()
            })
          }
        }
      } catch (err) {
        console.error("Error carregant previsió:", err)
      }
    }
    
    loadForecast()
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    if (!forecast) {
      setError("No hi ha dades de previsió disponibles")
      setIsLoading(false)
      return
    }
    
    try {
      const response = await fetch("/api/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forecastWindSpeed: forecast.windSpeed,
          forecastWindGust: forecast.windGust,
          forecastDirection: forecast.direction,
          realWindSpeed: Number(realWindSpeed),
          realWindGust: Number(realWindGust),
          realDirection: Number(realDirection),
          forecastTimestamp: forecast.timestamp,
          notes
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error guardant dades")
      }
      
      setSuccess(true)
      setRealWindSpeed("")
      setRealWindGust("")
      setRealDirection("")
      setNotes("")
      
      // Amagar missatge d'èxit després de 3 segons
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconegut")
    } finally {
      setIsLoading(false)
    }
  }
  
  const directionOptions = [
    { value: "0", label: "N - Tramuntana", degrees: 0 },
    { value: "45", label: "NE - Gregal", degrees: 45 },
    { value: "90", label: "E - Llevant", degrees: 90 },
    { value: "135", label: "SE - Xaloc", degrees: 135 },
    { value: "180", label: "S - Migjorn", degrees: 180 },
    { value: "225", label: "SW - Garbí/Llebeig", degrees: 225 },
    { value: "270", label: "W - Ponent", degrees: 270 },
    { value: "315", label: "NW - Mestral", degrees: 315 },
  ]
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Introduir Dades Reals
        </CardTitle>
        <CardDescription>
          Compara les dades reals del Camping Aquarius amb la previsió per millorar la precisió
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dades de la previsió (automàtiques) */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Wind className="h-4 w-4" />
              Previsió Open-Meteo (ara)
            </h3>
            {forecast ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Vent:</span>
                  <span className="ml-2 font-medium">{forecast.windSpeed} kt</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ràfega:</span>
                  <span className="ml-2 font-medium">{forecast.windGust} kt</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Direcció:</span>
                  <span className="ml-2 font-medium">
                    {forecast.direction}° ({getWindDirectionCategory(forecast.direction)})
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Carregant previsió...</p>
            )}
          </div>
          
          {/* Dades reals (introduïdes per l'usuari) */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Dades Reals (Camping Aquarius)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="realWindSpeed">Vent mitjà (kt)</Label>
                <Input
                  id="realWindSpeed"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 12"
                  value={realWindSpeed}
                  onChange={(e) => setRealWindSpeed(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="realWindGust">Ràfega màxima (kt)</Label>
                <Input
                  id="realWindGust"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 18"
                  value={realWindGust}
                  onChange={(e) => setRealWindGust(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="realDirection">Direcció del vent</Label>
                <Select value={realDirection} onValueChange={setRealDirection} required>
                  <SelectTrigger id="realDirection">
                    <SelectValue placeholder="Selecciona direcció" />
                  </SelectTrigger>
                  <SelectContent>
                    {directionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Condicions variables, núvols baixos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          {/* Missatges */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Dades guardades! Els factors de calibratge s&apos;han actualitzat.
            </div>
          )}
          
          {/* Botó */}
          <Button 
            type="submit" 
            disabled={isLoading || !forecast || !realWindSpeed || !realWindGust || !realDirection}
            className="w-full"
          >
            {isLoading ? "Guardant..." : "Guardar i Recalcular Factors"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
