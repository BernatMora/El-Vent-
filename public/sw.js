/// <reference lib="webworker" />

const CACHE_NAME = "el-vent-v2"
const RUNTIME_CACHE = "el-vent-runtime-v2"

// Recursos estàtics per cachejar durant la instal·lació
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
]

// Instal·lació: cachejar recursos estàtics
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activació: netejar caches antics
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        cacheNames.filter((name) => !currentCaches.includes(name))
      )
      .then((toDelete) =>
        Promise.all(toDelete.map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  )
})

// Estratègia de fetch: Network First per API, Cache First per estàtics
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar peticions que no siguin GET
  if (request.method !== "GET") return

  // API de previsió: Network First amb fallback a cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request))
    return
  }

  // Recursos estàtics i pàgines: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request))
})

// Network First: intentar xarxa, si falla usar cache
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    // Retornar resposta offline per API
    return new Response(
      JSON.stringify({
        error: "Sense connexió",
        offline: true,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

// Stale While Revalidate: servir cache immediatament, actualitzar en segon pla
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  return cached || (await fetchPromise) || new Response("Sense connexió", { status: 503 })
}
