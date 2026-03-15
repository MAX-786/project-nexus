/**
 * Nexus Service Worker
 *
 * Strategy:
 *  - Static assets (JS/CSS/fonts/images from /_next/static/*): cache-first with
 *    a long-lived cache so repeat visits are instant.
 *  - Navigation requests (HTML pages): network-first with a stale fallback so
 *    users can still read previously-visited pages while offline.
 *  - Everything else (API routes, Supabase calls): network-only so data is
 *    always fresh.
 */

const CACHE_VERSION = 'nexus-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PAGES_CACHE = `${CACHE_VERSION}-pages`
// Derive the app namespace so old versioned caches are cleaned up regardless
// of which version string is current (e.g. 'nexus-v1' → 'nexus-').
const APP_NAMESPACE = CACHE_VERSION.split('-v')[0] + '-'

const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\/fonts\//,
  /\.(?:png|jpg|jpeg|svg|ico|webp|avif|woff2?)$/,
]

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  // Activate the new SW immediately rather than waiting for all tabs to close.
  self.skipWaiting()
})

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(APP_NAMESPACE) && key !== STATIC_CACHE && key !== PAGES_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  // Claim all open clients so the new SW controls them without a reload.
  self.clients.claim()
})

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept same-origin requests.
  if (url.origin !== self.location.origin) return

  // Skip non-GET requests (POST to server actions, etc.).
  if (request.method !== 'GET') return

  // Skip Supabase / API routes — always go to network.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  // Static assets → cache-first
  if (STATIC_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // HTML navigation → network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGES_CACHE))
    return
  }
})

// ─── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    return cached ?? Response.error()
  }
}
