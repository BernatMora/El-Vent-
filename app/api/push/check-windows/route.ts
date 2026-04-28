import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendPush, isPushConfigured } from "@/lib/push-server"
import { getOpenMeteoForecast } from "@/lib/open-meteo-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SPOT = "sant-pere-pescador"
const ALLOWED_DIRECTIONS = ["E", "SE", "NE", "N", "S"]

function getDirectionName(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  const idx = Math.round(((deg % 360) / 22.5)) % 16
  return dirs[idx]
}

function isAllowedDir(deg: number) {
  const name = getDirectionName(deg)
  return ALLOWED_DIRECTIONS.some((d) => name.startsWith(d))
}

interface OptimalWindow {
  date: string
  startHour: number
  endHour: number
  avgWind: number
  direction: string
  windowKey: string
}

function findOptimalWindows(
  days: Awaited<ReturnType<typeof getOpenMeteoForecast>>,
  minWind: number,
): OptimalWindow[] {
  const out: OptimalWindow[] = []
  for (const day of days) {
    let runStart: number | null = null
    let runSpeeds: number[] = []
    let runDirs: number[] = []
    const sortedHours = [...day.hours].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    )
    for (const h of sortedHours) {
      const hour = new Date(h.time).getHours()
      const ok = h.windSpeed >= minWind && isAllowedDir(h.windDirection) && hour >= 9 && hour <= 21
      if (ok) {
        if (runStart === null) runStart = hour
        runSpeeds.push(h.windSpeed)
        runDirs.push(h.windDirection)
      } else if (runStart !== null) {
        if (runSpeeds.length >= 2) {
          const avg = runSpeeds.reduce((a, b) => a + b, 0) / runSpeeds.length
          const avgDir =
            runDirs.reduce((a, b) => a + b, 0) / runDirs.length
          out.push({
            date: day.date,
            startHour: runStart,
            endHour: runStart + runSpeeds.length,
            avgWind: Math.round(avg),
            direction: getDirectionName(avgDir),
            windowKey: `${day.date}-${runStart}-${runStart + runSpeeds.length}`,
          })
        }
        runStart = null
        runSpeeds = []
        runDirs = []
      }
    }
    if (runStart !== null && runSpeeds.length >= 2) {
      const avg = runSpeeds.reduce((a, b) => a + b, 0) / runSpeeds.length
      const avgDir = runDirs.reduce((a, b) => a + b, 0) / runDirs.length
      out.push({
        date: day.date,
        startHour: runStart,
        endHour: runStart + runSpeeds.length,
        avgWind: Math.round(avg),
        direction: getDirectionName(avgDir),
        windowKey: `${day.date}-${runStart}-${runStart + runSpeeds.length}`,
      })
    }
  }
  return out
}

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  // Protect with secret header (Netlify scheduled function will pass it)
  const secret = req.headers.get("x-cron-secret")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 503 },
    )
  }

  const supabase = await createClient()
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, min_wind")
  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 })
  }
  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no subscribers" })
  }

  const days = await getOpenMeteoForecast(SPOT)

  let sent = 0
  let pruned = 0
  const today = new Date().toISOString().split("T")[0]

  for (const sub of subs) {
    const windows = findOptimalWindows(days, sub.min_wind ?? 15).filter(
      (w) => w.date >= today,
    )
    if (windows.length === 0) continue

    // First window only (most imminent)
    const w = windows[0]

    // Avoid duplicates
    const { data: existing } = await supabase
      .from("push_notifications_log")
      .select("id")
      .eq("subscription_id", sub.id)
      .eq("window_key", w.windowKey)
      .maybeSingle()
    if (existing) continue

    const dateLabel =
      w.date === today
        ? "Avui"
        : new Date(w.date).toLocaleDateString("ca-ES", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })

    const result = await sendPush(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      {
        title: `Vent ${w.avgWind} kn ${w.direction} a Sant Pere`,
        body: `${dateLabel} ${w.startHour}h-${w.endHour}h sembla bon moment per navegar`,
        tag: w.windowKey,
        url: "/",
      },
    )

    if (result.ok) {
      sent++
      await supabase
        .from("push_notifications_log")
        .insert({ subscription_id: sub.id, window_key: w.windowKey })
    } else if (result.gone) {
      pruned++
      await supabase.from("push_subscriptions").delete().eq("id", sub.id)
    }
  }

  return NextResponse.json({ ok: true, sent, pruned, subscribers: subs.length })
}
