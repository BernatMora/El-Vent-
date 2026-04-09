import { ClientContent } from "@/components/client-content"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-2 sm:p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 sm:mb-8 text-center">
          <h1 className="mb-2 text-2xl sm:text-4xl md:text-5xl font-bold text-blue-900">
            Els Vents de Sant Pere Pescador
          </h1>
          <p className="text-sm sm:text-lg text-blue-700">
            Prediccions meteorològiques avançades per kitesurf a partir de múltiples fonts
          </p>
          <div className="mt-2 inline-block rounded-lg bg-blue-50 p-2 text-xs text-blue-600 sm:text-sm">
            🌬️ Previsió millorada amb dades reals, ajustos locals i cache intel·ligent
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md">
          <ClientContent />
        </div>
      </div>
    </main>
  )
}