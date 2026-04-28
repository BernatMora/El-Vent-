import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

interface SubscribeBody {
  endpoint: string
  keys: { p256dh: string; auth: string }
  prefs?: {
    minWind?: number
    alertDayBefore?: boolean
    alertMorning?: boolean
    offshoreWarnings?: boolean
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubscribeBody
    if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const supabase = await createClient()
    const prefs = body.prefs ?? {}
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: body.endpoint,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          min_wind: prefs.minWind ?? 15,
          alert_day_before: prefs.alertDayBefore ?? true,
          alert_morning: prefs.alertMorning ?? true,
          offshore_warnings: prefs.offshoreWarnings ?? true,
        },
        { onConflict: "endpoint" },
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = (await req.json()) as { endpoint: string }
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown" },
      { status: 500 },
    )
  }
}
