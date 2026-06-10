"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useCurrentReadings } from "@/hooks/use-current-readings"

interface AquariusImages {
  speedUrl: string
  directionUrl: string | null
  cachedAt?: string
}

export function AquariusMeteo() {
  const { data: meteocat, loading: meteocatLoading } = useCurrentReadings()
  const [images, setImages] = useState<AquariusImages | null>(null)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [imagesError, setImagesError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const needsAquarius = meteocat === null && !meteocatLoading

  const loadImages = async () => {
    try {
      setImagesError(null)
      setImagesLoading(true)
      const res = await fetch("/api/aquarius-meteo")
      const json = await res.json()
      if (!res.ok || !json.speedUrl) throw new Error(json.error || "Sense dades")
      setImages(json)
      setRefreshKey((k) => k + 1)
    } catch (e: any) {
      setImagesError(e?.message || "Error carregant imatges")
    } finally {
      setImagesLoading(false)
    }
  }

  useEffect(() => {
    if (needsAquarius) loadImages()
  }, [needsAquarius])

  const proxyImage = (url: string) => {
    const params = new URLSearchParams({ img: url, k: refreshKey.toString() })
    return `/api/aquarius-image?${params}`
  }

  const loading = meteocatLoading || imagesLoading
  const showMeteocat = meteocat !== null
  const showImages = images !== null

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold">
              Anemòmetre de la platja
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              {showMeteocat ? "Dades Meteocat" : "Lectura local · referència alternativa a Meteocat"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => {
                if (showMeteocat) return
                setImagesLoading(true)
                loadImages()
              }}
              disabled={loading || showMeteocat}
              aria-label="Actualitzar"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          {loading && !showMeteocat && !showImages ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ) : imagesError && !showImages && !showMeteocat ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {imagesError}
            </div>
          ) : showMeteocat ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Dades Meteocat ({meteocat.stationCode || meteocat.stationName})</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Velocitat</div>
                  <div className="text-xl font-bold">{meteocat.windSpeed ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground">nusos</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Ratxa</div>
                  <div className="text-xl font-bold">{meteocat.windGust ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground">nusos</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Direcció</div>
                  <div className="text-xl font-bold">{meteocat.windDirection ?? "—"}°</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Última lectura: {meteocat.timestamp ? new Date(meteocat.timestamp).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" }) : "-"}</div>
            </div>
          ) : showImages ? (
            <div className="flex flex-col gap-3">
              {images.speedUrl && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Velocitat del vent
                  </span>
                  <div className="flex w-full items-center justify-center rounded-md border bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proxyImage(images.speedUrl)}
                      alt="Velocitat del vent"
                      className="w-full max-w-2xl object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
              {images.directionUrl && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Direcció del vent
                  </span>
                  <div className="flex w-full items-center justify-center rounded-md border bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proxyImage(images.directionUrl)}
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

        {showImages && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>
              {images?.cachedAt
                ? `Actualitzat ${new Date(images.cachedAt).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </span>
            <span className="italic">Imatges originals · refresc auto cada 60s</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
