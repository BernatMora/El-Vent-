import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SpotComparison } from "@/components/spot-comparison"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function CompararPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <Link href="/" passHref>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tornar a l'inici
            </Button>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-blue-900 md:text-5xl">Comparació de Spots</h1>
          <p className="text-lg text-blue-700">Descobreix quin spot té les millors condicions per kitesurf</p>
        </div>

        <SpotComparison />

        <div className="mt-8 rounded-lg border bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold">Com interpretar la comparació</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">Colors de vent</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gray-400">0 kn</Badge>
                <Badge className="bg-gray-500">&lt;8 kn</Badge>
                <Badge className="bg-green-600">8-12 kn</Badge>
                <Badge className="bg-blue-600">12-18 kn</Badge>
                <Badge className="bg-amber-500">18-25 kn</Badge>
                <Badge className="bg-red-500">&gt;25 kn</Badge>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Recomanacions</h3>
              <ul className="ml-6 list-disc space-y-1 text-sm">
                <li>
                  <span className="font-medium">Condicions òptimes:</span> Vent entre 12-20 nusos, ideal per a la
                  majoria de riders.
                </li>
                <li>
                  <span className="font-medium">Condicions acceptables:</span> Vent entre 8-12 o 20-25 nusos, adequat
                  segons nivell i equip.
                </li>
                <li>
                  <span className="font-medium">Vent insuficient:</span> Menys de 8 nusos, difícil mantenir l'estel en
                  l'aire.
                </li>
                <li>
                  <span className="font-medium">Vent massa fort:</span> Més de 25 nusos, recomanat només per a experts.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Hores òptimes</h3>
              <p className="text-sm">
                Indica el nombre d'hores durant el dia amb condicions de vent favorables (entre 10-25 nusos). Un nombre
                més alt significa més temps disponible per navegar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
