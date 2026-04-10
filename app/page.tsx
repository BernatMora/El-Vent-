import { ClientContent } from "@/components/client-content"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { Gauge, Waves, Wind } from "lucide-react"

const highlights = [
  { value: "10 kn", label: "mínim útil", Icon: Wind },
  { value: "3 dies", label: "previsió", Icon: Gauge },
  { value: "Offline", label: "consulta ràpida", Icon: Waves },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-2 pb-safe sm:p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <section className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-blue-800 to-cyan-700 p-4 text-white shadow-xl animate-in fade-in-50 slide-in-from-top-2 duration-500 sm:mb-8 sm:p-6 md:p-8">
          <div className="absolute top-3 right-3 z-10">
            <DarkModeToggle />
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="text-center lg:text-left">
              <div className="mb-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-sky-100 sm:text-xs">
                Sant Pere Pescador · Kitesurf
              </div>
              <div className="mb-2 text-sm font-semibold text-cyan-100 sm:text-base">
                Bernat Mora
              </div>
              <h1 className="mb-2 text-2xl font-bold sm:text-4xl md:text-5xl">
                Els Vents de Sant Pere Pescador
              </h1>
              <p className="max-w-2xl text-sm text-blue-50 sm:text-base md:text-lg">
                Previsió de vent i mar clara i ràpida, pensada per decidir en segons si avui compensa sortir i quina franja pot donar la millor sessió.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-left">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-lg">
                    <item.Icon className="mb-2 h-4 w-4 text-cyan-200" />
                    <div className="text-sm font-semibold sm:text-base">{item.value}</div>
                    <div className="text-[11px] text-sky-100 sm:text-xs">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-slate-950/20 p-4 text-left backdrop-blur-md">
              <div className="space-y-3 text-sm text-sky-50">
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="font-semibold">Semàfor de sessió</div>
                  <div className="mt-1 text-sky-100">Verd, groc o vermell per saber ràpid si val la pena anar-hi.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="font-semibold">Llindar real</div>
                  <div className="mt-1 text-sky-100">Per sota de 10 kn ja queda marcat com a massa fluix.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="font-semibold">Vista clara</div>
                  <div className="mt-1 text-sky-100">Gràfiques i resum ràpid per mirar-ho des del mòbil o des del cotxe.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 p-3 shadow-xl ring-1 ring-slate-200/70 dark:ring-slate-700/70 backdrop-blur sm:p-4 md:p-6">
          <ClientContent />
        </div>
      </div>
    </main>
  )
}