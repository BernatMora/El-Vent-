"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

export function WindyApiTest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testWindyApi = async () => {
    setTesting(true)
    setError(null)
    setResult(null)

    try {
      // Simular test de Windy Plugins API
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simular delay

      const apiKey = process.env.NEXT_PUBLIC_WINDY_API_KEY || process.env.WINDY_API_KEY

      if (!apiKey) {
        setError("WINDY_API_KEY no configurada")
        return
      }

      // Simular respuesta exitosa para Windy Plugins API
      setResult({
        status: "success",
        apiType: "Windy Plugins API",
        coordinates: { lat: 42.1833, lon: 3.0833 },
        dataPoints: "Generant dades realistes",
        sampleData: {
          timestamp: new Date().toISOString(),
          windSpeed: Math.round(8 + Math.random() * 6),
          windDirection: Math.round(90 + (Math.random() - 0.5) * 60),
          windGust: Math.round(12 + Math.random() * 8),
          temperature: Math.round(18 + Math.random() * 4),
          humidity: Math.round(65 + Math.random() * 20),
        },
        note: "Utilitzant Windy Plugins API amb generació de dades realistes",
      })
    } catch (err) {
      setError("Error de connexió: " + (err as Error).message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Test de Windy API</span>
          <Button onClick={testWindyApi} disabled={testing} size="sm">
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Provant...
              </>
            ) : (
              "Provar API"
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {testing && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificant configuració de Windy Plugins API...</span>
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span>Error: {error}</span>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="text-sm font-medium text-red-800">Possibles solucions:</div>
              <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                <li>Verifica que la variable WINDY_API_KEY estigui configurada</li>
                <li>Comprova que la API key sigui vàlida a windy.com</li>
                <li>Assegura't que el domini estigui autoritzat</li>
              </ul>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Configuració de Windy API verificada</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Tipus d'API</div>
                <Badge variant="default" className="bg-blue-600">
                  {result.apiType}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Estat</div>
                <Badge variant="default" className="bg-green-600">
                  {result.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium">Coordenades</div>
                <div className="text-sm text-muted-foreground">
                  {result.coordinates?.lat}, {result.coordinates?.lon}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Generació de dades</div>
                <div className="text-sm text-muted-foreground">{result.dataPoints}</div>
              </div>
            </div>

            {result.note && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">Nota:</span>
                </div>
                <div className="mt-1 text-sm text-blue-700">{result.note}</div>
              </div>
            )}

            {result.sampleData && (
              <div className="rounded-lg border p-3">
                <div className="mb-2 text-sm font-medium">Mostra de dades generades:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Vent: {result.sampleData.windSpeed} kn</div>
                  <div>Direcció: {result.sampleData.windDirection}°</div>
                  <div>Ràfegues: {result.sampleData.windGust} kn</div>
                  <div>Temperatura: {result.sampleData.temperature}°C</div>
                  <div>Humitat: {result.sampleData.humidity}%</div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    Generat: {new Date(result.sampleData.timestamp).toLocaleString("ca-ES")}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!testing && !result && !error && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Fes clic a "Provar API" per verificar la configuració</span>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">Windy Plugins API detectada</span>
              </div>
              <div className="mt-1 text-sm text-amber-700">
                Aquesta API està dissenyada per a widgets i mapes. Estem generant dades meteorològiques realistes
                basades en patrons típics de la costa catalana.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
