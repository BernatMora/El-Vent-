"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface AquariusResponse {
  speedUrl: string
  directionUrl: string | null
  source: string
  cachedAt?: string
  error?: string
}

interface MeteocatSimple {
  windSpeed: number | null
  windGust: number | null
  windDirection: number | null
  stationName?: string
  stationCode?: string
  lastUpdate?: string
  source?: string
}

export function AquariusMeteo() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AquariusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [meteocat, setMeteocat] = useState<MeteocatSimple | null>(null)

  const load = async () => {
    try {
      setError(null)
      // Respect user preference: if user prefers Aquarius, skip Meteocat
      const pref = typeof window !== 'undefined' ? localStorage.getItem('preferredWindSource') || 'auto' : 'auto'
      if (pref !== 'aquarius') {
        try {
          const cur = await fetch("/api/current")
          if (cur.ok) {
            const curJson = await cur.json()
            const c = curJson.current
            // Use real station data (Meteocat) when available
            if (c && c.isReal && (curJson.stationCode === "U2" || String(curJson.source || "").includes("Meteocat"))) {
              const mc: MeteocatSimple = {
                windSpeed: c.windSpeed ?? null,
                windGust: c.windGust ?? null,
                windDirection: c.windDirection ?? null,
                stationName: curJson.station || c.stationName,
                stationCode: curJson.stationCode || c.stationCode,
                lastUpdate: c.lastUpdate,
                source: curJson.source || c.source,
              }
              // Show Meteocat summary instead of images
              setMeteocat(mc)
              setLoading(false)
              return
            }
          }
        } catch (e) {
          // ignore and fall back to aquarium images
        }
      }

      const res = await fetch("/api/aquarius-meteo")
      const json: AquariusResponse = await res.json()
      if (!res.ok || !json.speedUrl) {
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

  const proxyImage = (url: string) => {
    const params = new URLSearchParams({ img: url, k: refreshKey.toString() })
    return `/api/aquarius-image?${params}`
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
              Anemòmetre de la platja
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              Lectura local · referència alternativa a Meteocat
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
          </div>
        </div>

        <div className="mt-3">
          {loading && !data && !meteocat ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ) : error && !data && !meteocat ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {error}
            </div>
          ) : meteocat ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Dades Meteocat ({meteocat.stationCode || meteocat.stationName})</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Velocitat</div>
                  <div className="text-xl font-bold">{meteocat.windSpeed ?? '—'}</div>
                  <div className="text-[11px] text-muted-foreground">nusos</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Ratxa</div>
                  <div className="text-xl font-bold">{meteocat.windGust ?? '—'}</div>
                  <div className="text-[11px] text-muted-foreground">nusos</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Direcció</div>
                  <div className="text-xl font-bold">{meteocat.windDirection ?? '—'}°</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Última lectura: {meteocat.lastUpdate ? new Date(meteocat.lastUpdate).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
            </div>
          ) : data?.speedUrl || data?.directionUrl ? (
            <div className="flex flex-col gap-3">
              {data.speedUrl && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Velocitat del vent
                  </span>
                  <div className="flex w-full items-center justify-center rounded-md border bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proxyImage(data.speedUrl)}
                      alt="Velocitat del vent"
                      className="w-full max-w-2xl object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
              {data.directionUrl && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Direcció del vent
                  </span>
                  <div className="flex w-full items-center justify-center rounded-md border bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proxyImage(data.directionUrl)}
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
