import { ClientContent } from "@/components/client-content"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { Gauge, Settings2 } from "lucide-react"
import Link from "next/link"

const highlights = [
  { value: "7 dies", label: "previsio", Icon: Gauge },
  { value: "Calibrat", label: "dades reals", Icon: Settings2 },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 px-2 pt-2 pb-24 sm:p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <section className="relative mb-3 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-900 via-blue-800 to-cyan-700 px-3 py-3 text-white shadow-lg sm:mb-8 sm:rounded-3xl sm:p-6 md:p-8">
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 sm:top-3 sm:right-3 sm:gap-2">
            <Link
              href="/calibratge"
              className="rounded-full bg-white/15 p-2 text-sky-100 transition-colors hover:bg-white/25 active:bg-white/30"
              title="Calibratge"
            >
              <Settings2 className="h-4 w-4" />
            </Link>
            <DarkModeToggle />
          </div>
          {/* Mobile: minimal header */}
          <div className="sm:hidden">
            <div className="text-[10px] uppercase tracking-wider text-cyan-100/80">Sant Pere · Kitesurf</div>
            <div className="text-base font-bold leading-tight">El Vent</div>
          </div>
          {/* Tablet/Desktop: full hero */}
          <div className="hidden text-center sm:block">
            <div className="mb-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-sky-100">
              Sant Pere Pescador · Kitesurf
            </div>
            <div className="mb-4 text-base font-semibold text-cyan-100">
              Bernat Mora
            </div>
            <div className="mx-auto grid max-w-xs grid-cols-2 gap-2 text-left">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-lg">
                  <item.Icon className="mb-2 h-4 w-4 text-cyan-200" />
                  <div className="text-base font-semibold">{item.value}</div>
                  <div className="text-xs text-sky-100">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 p-2 shadow-xl ring-1 ring-slate-200/70 dark:ring-slate-700/70 backdrop-blur sm:p-4 md:p-6">
          <ClientContent />
        </div>
      </div>
    </main>
  )
}
