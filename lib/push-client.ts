/**
 * Web Push subscription helpers (client-side)
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export interface PushPrefs {
  minWind: number
  alertDayBefore: boolean
  alertMorning: boolean
  offshoreWarnings: boolean
}

export async function getServerPublicKey(): Promise<string | null> {
  try {
    const r = await fetch("/api/push/vapid-public-key")
    if (!r.ok) return null
    const j = await r.json()
    return j.publicKey ?? null
  } catch {
    return null
  }
}

export async function subscribeToPush(prefs: PushPrefs): Promise<{ ok: boolean; error?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Push no suportat al navegador" }
  }
  const publicKey = await getServerPublicKey()
  if (!publicKey) {
    return { ok: false, error: "El servidor no té configurades les claus VAPID" }
  }
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }
  const json = sub.toJSON() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  const r = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      prefs,
    }),
  })
  if (!r.ok) {
    const j = await r.json().catch(() => ({}))
    return { ok: false, error: j.error ?? `HTTP ${r.status}` }
  }
  return { ok: true }
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
  if (!("serviceWorker" in navigator)) return { ok: false }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return { ok: true }
  const json = sub.toJSON() as { endpoint: string }
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint }),
  })
  await sub.unsubscribe()
  return { ok: true }
}

export async function updatePushPrefs(prefs: PushPrefs): Promise<{ ok: boolean }> {
  if (!("serviceWorker" in navigator)) return { ok: false }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return { ok: false }
  const json = sub.toJSON() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, prefs }),
  })
  return { ok: true }
}
