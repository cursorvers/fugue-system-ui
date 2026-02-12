// FUGUE System — Service Worker
// Cache-first for static assets, Network-first for API

const CACHE_NAME = "fugue-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
];

// Install: precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: route-based strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip WebSocket upgrades
  if (url.protocol === "ws:" || url.protocol === "wss:") return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // API routes: Network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Next.js chunks and static: Cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.match(/\.(svg|png|jpg|jpeg|webp|woff2?)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: Network-first (always get fresh content)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Network-first
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy.
 * Returns cached response if available, otherwise fetches and caches.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Network-first strategy.
 * Tries network, falls back to cache, then offline page.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for HTML requests
    if (request.headers.get("accept")?.includes("text/html")) {
      const fallbackCached = await caches.match("/");
      if (fallbackCached) return fallbackCached;
    }

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
