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
