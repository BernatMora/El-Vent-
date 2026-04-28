import webpush from "web-push"

let configured = false

function configure() {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@vent-kite.netlify.app"
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
}

export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!configure()) {
    return { ok: false, error: "VAPID keys not configured" }
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return { ok: true }
  } catch (err) {
    const e = err as { statusCode?: number; message?: string }
    if (e.statusCode === 404 || e.statusCode === 410) {
      return { ok: false, gone: true, error: e.message }
    }
    return { ok: false, error: e.message ?? "unknown" }
  }
}

export function isPushConfigured() {
  return configure()
}
