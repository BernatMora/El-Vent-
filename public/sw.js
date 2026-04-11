/// <reference lib="webworker" />

// IMPORTANT: bump this version string on every deploy to trigger SW update
const CACHE_VERSION = "v4-" + "20260410"
const CACHE_NAME = "el-vent-" + CACHE_VERSION

const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
]

self.addEventListener("install", (event) => {
  // Force the new SW to activate immediately, don't wait for tabs to close
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  // Delete ALL old caches and take control of all clients immediately
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  )
})

// Listen for messages from the page (e.g. force update)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || "El Vent - Alerta de condicions"
  const options = {
    body: data.body || "Hi ha bones condicions de vent previstes!",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: data.tag || "wind-alert",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "Veure previsió" },
      { action: "dismiss", title: "Tancar" }
    ]
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  if (event.action === "dismiss") return
  
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || "/")
      }
    })
  )
})

// Network-First for EVERYTHING — always get fresh content when online
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        const response = await fetch(event.request)
        if (response.ok) {
          cache.put(event.request, response.clone())
        }
        return response
      } catch {
        const cached = await cache.match(event.request)
        if (cached) return cached

        // Fallback for navigation requests (offline page shell)
        if (event.request.mode === "navigate") {
          const root = await cache.match("/")
          if (root) return root
        }

        return new Response("Sense connexió", { status: 503 })
      }
    })()
  )
})
