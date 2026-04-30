"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ExternalLink, RefreshCw } from "lucide-react"

interface AquariusResponse {
  urls: string[]
  source: string
  cachedAt?: string
  error?: string
}

export function AquariusMeteo() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AquariusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/aquarius-meteo")
      const json: AquariusResponse = await res.json()
      if (!res.ok || !json.urls?.length) {
        throw new Error(json.error || "Sense dades")
      }
      setData(json)
      setRefreshKey((k) => k + 1)
    } catch (e: any) {
      setError(e?.message || "Error carregant dades del camping")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold">
              Anemòmetre Camping Aquàrius
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              Lectura local de la platja · referència alternativa a Meteocat
            </span>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" />
          )}
        </button>

        {open && (
          <div className="mt-3 space-y-3">
            {loading && !data ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                {error}
              </div>
            ) : data?.urls?.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.urls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center justify-center rounded-md border bg-white p-1"
                  >
                    {/* Bust cache amb refreshKey perquè el navegador torni a demanar la imatge */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${url}?k=${refreshKey}`}
                      alt="Lectura meteo Camping Aquàrius"
                      className="max-h-16 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>
                {data?.cachedAt
                  ? `Actualitzat ${new Date(data.cachedAt).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={load}
                  disabled={loading}
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                  <span className="ml-1">Actualitzar</span>
                </Button>
                <a
                  href="https://www.campingaquarius.com/la-camara-web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-muted"
                >
                  Web <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <p className="text-[10px] italic text-muted-foreground">
              Les dades són imatges generades pel servidor del Camping Aquàrius i s'actualitzen cada
              pocs minuts. No es processen els valors numèricament.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
