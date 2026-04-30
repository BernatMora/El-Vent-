import { CalibrationStatus } from "@/components/calibration-status"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Calibratge - Els Vents de Sant Pere Pescador",
  description: "Calibratge automàtic de previsions amb dades reals de Meteocat",
}

export default function CalibratgePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Calibratge automàtic</h1>
              <p className="text-sm text-muted-foreground">
                Compara la previsió amb el vent real de Meteocat cada 30 minuts
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <CalibrationStatus />

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h2 className="font-medium mb-2">Com funciona?</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Cada 30 minuts el sistema agafa la previsió d&apos;Open-Meteo per a l&apos;hora
              actual al kitesurf-point.
            </li>
            <li>
              Llegeix les dades reals de l&apos;estació Meteocat (XEMA) de Sant Pere
              Pescador (o l&apos;estació de fallback més propera).
            </li>
            <li>
              Calcula els factors <em>real / previst</em> per a vent i ràfega, i els
              agrupa per direcció (Tramuntana, Garbí, etc.).
            </li>
            <li>
              Aplica una mitjana mòbil exponencial per absorbir errors puntuals i
              augmenta la confiança a mesura que arriben mostres.
            </li>
            <li>
              Les previsions futures es corregeixen automàticament amb aquests
              factors quan hi ha prou confiança (≥ 20%).
            </li>
          </ol>
          <p className="mt-4 text-sm">
            <strong>Nota:</strong> ja no cal calibratge manual. Pots forçar una passada
            amb el botó <em>Calibrar ara</em> si vols actualitzar abans dels 30 min.
          </p>
        </div>
      </main>
    </div>
  )
}
