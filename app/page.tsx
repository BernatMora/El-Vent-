import { ClientContent } from "@/components/client-content"

const highlights = [
  { value: "3 dies", label: "previsió" },
  { value: "Offline", label: "disponible" },
  { value: "Instal·lable", label: "com app" },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50 to-slate-100 p-2 pb-safe sm:p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-900 via-blue-800 to-cyan-700 p-4 text-white shadow-xl sm:mb-8 sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="text-center lg:text-left">
              <div className="mb-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-sky-100 sm:text-xs">
                Sant Pere Pescador · Kitesurf
              </div>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl md:text-5xl">
                Els Vents de Sant Pere Pescador
              </h1>
              <p className="max-w-2xl text-sm text-blue-50 sm:text-base md:text-lg">
                Previsió de vent i mar més clara, ràpida i instal·lable com una app, preparada per consultar-la fins i tot amb poca cobertura abans d'entrar a l'aigua.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-left">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
                  <div className="text-sm font-semibold sm:text-base">{item.value}</div>
                  <div className="text-[11px] text-sky-100 sm:text-xs">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rounded-2xl bg-white/90 p-3 shadow-xl ring-1 ring-slate-200/70 backdrop-blur sm:p-4 md:p-6">
          <ClientContent />
        </div>
      </div>
    </main>
  )
}