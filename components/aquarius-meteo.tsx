"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ExternalLink, RefreshCw } from "lucide-react"

interface AquariusResponse {
  urls: string[]
  source: string
  cachedAt?: string
  error?: string
}

export function AquariusMeteo() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AquariusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = async () => {
    try {
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
    load()
    // La web origen refresca cada 30s; mantenim 60s per estalviar peticions
    const interval = setInterval(load, 60 * 1000)

    const onVisibility = () => {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold">
              Anemòmetre Camping Aquàrius
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              Lectura local de la platja · referència alternativa a Meteocat
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => {
                setLoading(true)
                load()
              }}
              disabled={loading}
              aria-label="Actualitzar"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <a
              href="https://www.campingaquarius.com/la-camara-web"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
            >
              Web <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-3">
          {loading && !data ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ) : error && !data ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {error}
            </div>
          ) : data?.urls?.length ? (
            <div className="flex flex-col gap-3">
              {data.urls[0] && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Velocitat del vent
                  </span>
                  <div className="flex w-full items-center justify-center rounded-md border bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${data.urls[0]}?k=${refreshKey}`}
                      alt="Velocitat del vent"
                      className="w-full max-w-2xl object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
              {data.urls[1] && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Direcció del vent
                  </span>
                  <div className="flex w-full items-center justify-center rounded-md border bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${data.urls[1]}?k=${refreshKey}`}
                      alt="Direcció del vent"
                      className="max-h-40 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>
            {data?.cachedAt
              ? `Actualitzat ${new Date(data.cachedAt).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </span>
          <span className="italic">Imatges originals · refresc auto cada 60s</span>
        </div>
      </CardContent>
    </Card>
  )
}
