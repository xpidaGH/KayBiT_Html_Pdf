// KayBiT Editor Service Worker for Offline Functionality & Asset Caching
const CACHE_NAME = 'kaybit-editor-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css'
];

// Install Event: Pre-cache essential app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching KayBiT application shell');
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[ServiceWorker] Optional precache asset warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing stale cache version:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Serve cached assets when offline, update cache dynamically
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass cache for API POST endpoints (e.g., PDF generation, remote sync)
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first with Cache Fallback for HTML navigation & dynamic static assets
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful GET responses for static assets/pages
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache when offline
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigating to an HTML page while offline, return cached index.html
        if (request.mode === 'navigate') {
          const fallbackIndex = await caches.match('/index.html') || await caches.match('/');
          if (fallbackIndex) {
            return fallbackIndex;
          }
        }

        // Return offline JSON response for failed fetch API requests
        return new Response(
          JSON.stringify({ offline: true, error: 'You are currently working in offline mode.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
  );
});
