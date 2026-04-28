// Netlify Scheduled Function — runs every hour during daytime hours
// Calls the /api/push/check-windows endpoint to detect optimal kitesurf windows
// and dispatch push notifications to subscribed users.
//
// Schedule (cron): every hour from 06:00 to 21:00 UTC.
// Adjust to your timezone if needed.

import type { Config } from "@netlify/functions"

export default async () => {
  const url = process.env.URL || process.env.DEPLOY_PRIME_URL
  const secret = process.env.CRON_SECRET
  if (!url) {
    return new Response("Missing site URL", { status: 500 })
  }
  if (!secret) {
    return new Response("Missing CRON_SECRET", { status: 500 })
  }

  try {
    const r = await fetch(`${url}/api/push/check-windows`, {
      method: "POST",
      headers: {
        "x-cron-secret": secret,
        "content-type": "application/json",
      },
    })
    const text = await r.text()
    return new Response(text, { status: r.status })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 },
    )
  }
}

export const config: Config = {
  schedule: "0 6-21 * * *",
}
