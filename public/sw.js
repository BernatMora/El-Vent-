/// <reference lib="webworker" />

const CACHE_NAME = "el-vent-v3"

const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
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
