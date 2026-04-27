import { CalibrationForm } from "@/components/calibration-form"
import { CalibrationStatus } from "@/components/calibration-status"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Calibratge - Els Vents de Sant Pere Pescador",
  description: "Sistema de calibratge per millorar la precisió de les previsions",
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
              <h1 className="text-2xl font-bold">Calibratge de Previsions</h1>
              <p className="text-sm text-muted-foreground">
                Entrena el sistema amb dades reals per millorar la precisió
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalibrationForm />
          <CalibrationStatus />
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h2 className="font-medium mb-2">Com funciona?</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Mira les dades reals del vent a la webcam del Camping Aquarius
            </li>
            <li>
              Introdueix el vent mitjà, la ràfega màxima i la direcció que veus
            </li>
            <li>
              El sistema compara amb la previsió d&apos;Open-Meteo i calcula l&apos;error
            </li>
            <li>
              Amb cada entrada, els factors de correcció es van ajustant automàticament
            </li>
            <li>
              Les futures previsions s&apos;aplicaran els factors apresos per ser més precises
            </li>
          </ol>
          <p className="mt-4 text-sm">
            <strong>Consell:</strong> Introdueix dades regularment, especialment amb diferents direccions de vent (Tramuntana, Garbí, etc.) per tenir un calibratge complet.
          </p>
        </div>
      </main>
    </div>
  )
}
