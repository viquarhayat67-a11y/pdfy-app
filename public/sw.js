const CACHE_NAME = 'pdfy-studio-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Vite bundles these dynamically, but caching the root allows the app shell to register offline
];

// 1. INSTALL EVENT: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Force activation immediately
});

// 2. ACTIVATE EVENT: Clear out old cache versions when updating code
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH EVENT: Cache-First Strategy with Network Fallback
// Perfect for local utilities because it guarantees instant loading speeds
self.addEventListener('fetch', (event) => {
  // Only handle standard HTTP/HTTPS requests (ignores internal extension schemes)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch a fresh copy in the background to update the cache for next time
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore network failures when completely offline */});
        
        return cachedResponse;
      }

      // If asset isn't cached yet, fetch from network and dynamically store it
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});