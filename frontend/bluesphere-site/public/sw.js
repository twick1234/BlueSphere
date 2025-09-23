/**
 * BlueSphere Service Worker
 * Advanced caching and offline support for marine monitoring platform
 */

const CACHE_VERSION = 'v1.0.0'
const STATIC_CACHE = `bluesphere-static-${CACHE_VERSION}`
const DATA_CACHE = `bluesphere-data-${CACHE_VERSION}`
const IMAGE_CACHE = `bluesphere-images-${CACHE_VERSION}`

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/sharks',
  '/mapping',
  '/analytics',
  '/styles/globals.css',
  '/manifest.json',
  '/offline.html'
]

// Marine data API patterns to cache
const DATA_API_PATTERNS = [
  /\/api\/obs/,
  /\/api\/stations/,
  /\/api\/sharks/,
  /\/api\/alerts/
]

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker')

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll([...STATIC_ASSETS, ...EXTERNAL_RESOURCES])
      }),

      // Cache shell for offline experience
      caches.open(DATA_CACHE).then((cache) => {
        console.log('[SW] Preparing data cache')
        return cache.put('/offline.html', new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>BlueSphere - Offline</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                color: white;
                text-align: center;
              }
              .offline-container {
                max-width: 500px;
                padding: 2rem;
              }
              .offline-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
              }
              h1 {
                font-size: 2rem;
                margin-bottom: 1rem;
              }
              p {
                font-size: 1.1rem;
                opacity: 0.9;
                line-height: 1.6;
              }
              .retry-btn {
                background: white;
                color: #0ea5e9;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                font-size: 1rem;
                font-weight: 600;
                margin-top: 1.5rem;
                cursor: pointer;
                transition: transform 0.2s;
              }
              .retry-btn:hover {
                transform: translateY(-2px);
              }
            </style>
          </head>
          <body>
            <div class="offline-container">
              <div class="offline-icon">🌊</div>
              <h1>BlueSphere Offline</h1>
              <p>You're currently offline, but you can still access cached marine data and previously viewed pages.</p>
              <button class="retry-btn" onclick="window.location.reload()">
                Try Again
              </button>
            </div>
          </body>
          </html>
        `))
      })
    ]).then(() => {
      console.log('[SW] Installation complete')
      self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('bluesphere-') &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DATA_CACHE &&
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Activation complete')
      self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }

  // Handle different types of requests with appropriate strategies
  if (request.method === 'GET') {
    // Static assets - Cache First
    if (isStaticAsset(request.url)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE))
    }

    // Marine data APIs - Network First with fallback
    else if (isDataAPI(request.url)) {
      event.respondWith(networkFirstWithFallback(request, DATA_CACHE))
    }

    // Images - Cache First with network fallback
    else if (isImage(request.url)) {
      event.respondWith(cacheFirst(request, IMAGE_CACHE))
    }

    // Navigation requests - Network First with offline fallback
    else if (request.mode === 'navigate') {
      event.respondWith(networkFirstWithOfflineFallback(request))
    }

    // Default - Network First
    else {
      event.respondWith(networkFirst(request, STATIC_CACHE))
    }
  }
})

// Caching strategies
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url)
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
      console.log('[SW] Cached from network:', request.url)
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Cache first failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
      console.log('[SW] Network first - cached:', request.url)
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

async function networkFirstWithFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      // Cache with TTL for marine data (5 minutes)
      const ttl = Date.now() + (5 * 60 * 1000)
      const responseWithTTL = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cache-ttl': ttl.toString()
        }
      })
      cache.put(request, responseWithTTL.clone())
      console.log('[SW] Marine data cached with TTL:', request.url)
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for marine data, checking cache:', request.url)
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      const ttl = cachedResponse.headers.get('sw-cache-ttl')
      if (ttl && Date.now() > parseInt(ttl)) {
        console.log('[SW] Cached marine data expired:', request.url)
        return new Response(JSON.stringify({
          error: 'Data temporarily unavailable',
          cached: true,
          expired: true
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      console.log('[SW] Serving cached marine data:', request.url)
      return cachedResponse
    }

    // Return empty data structure for marine APIs
    return new Response(JSON.stringify({
      error: 'Offline - no cached data available',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('[SW] Navigation offline, serving offline page')
    return caches.match('/offline.html')
  }
}

// Helper functions
function isStaticAsset(url) {
  return url.includes('.css') ||
         url.includes('.js') ||
         url.includes('.woff') ||
         url.includes('.woff2') ||
         url.includes('leaflet') ||
         STATIC_ASSETS.some(asset => url.endsWith(asset))
}

function isDataAPI(url) {
  return DATA_API_PATTERNS.some(pattern => pattern.test(url))
}

function isImage(url) {
  return url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.jpeg') ||
         url.includes('.gif') ||
         url.includes('.webp') ||
         url.includes('.avif') ||
         url.includes('.svg')
}

// Background sync for marine data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'marine-data-sync') {
    console.log('[SW] Background sync: marine-data-sync')
    event.waitUntil(syncMarineData())
  }
})

async function syncMarineData() {
  try {
    // Attempt to refresh critical marine data when connection is restored
    const criticalEndpoints = [
      '/api/alerts/active',
      '/api/stations?active=true',
      '/api/sharks/tracking'
    ]

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint)
        if (response.ok) {
          const cache = await caches.open(DATA_CACHE)
          cache.put(endpoint, response.clone())
          console.log('[SW] Synced marine data:', endpoint)
        }
      } catch (error) {
        console.log('[SW] Sync failed for:', endpoint, error)
      }
    }

    // Notify clients that sync completed
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'MARINE_DATA_SYNCED',
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.log('[SW] Marine data sync error:', error)
  }
}

// Push notifications for marine alerts
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    console.log('[SW] Push notification received:', data)

    if (data.type === 'marine-alert') {
      const options = {
        body: data.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'marine-alert',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Details'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: data
      }

      event.waitUntil(
        self.registration.showNotification(data.title || 'Marine Alert', options)
      )
    }
  } catch (error) {
    console.log('[SW] Push notification error:', error)
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/alerts?id=' + event.notification.data.alertId)
    )
  }
})

console.log('[SW] Service Worker loaded')