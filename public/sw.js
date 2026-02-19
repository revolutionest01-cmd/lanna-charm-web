// Service Worker for Cache Management & Version Control
// This SW handles cache busting and automatic updates

const CACHE_PREFIX = 'lanna-charm-cache';
const CACHE_VERSION = 'v1.0.0'; // Fixed version to prevent cache issues
const CURRENT_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Assets to cache - excluding HTML and API calls to enable updates
const ASSETS_TO_CACHE = [
  '/robots.txt',
  '/sitemap.xml',
  '/site.webmanifest',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CURRENT_CACHE)
      .then((cache) => {
        console.log(`[SW] Caching assets in ${CURRENT_CACHE}`);
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.warn('[SW] Cache installation failed:', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CURRENT_CACHE && cacheName.startsWith(CACHE_PREFIX)) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip third-party requests (external APIs)
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Skip data URLs and chrome extensions
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  // HTML files - network first, then cache (allows updates)
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache non-200 responses
          if (!response || response.status !== 200) {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache successful responses
          caches.open(CURRENT_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((response) => {
              return response || new Response('Offline - Page not cached', {
                status: 503,
                statusText: 'Service Unavailable',
              });
            });
        })
    );
  }
  
  // Asset files (JS, CSS, images) - cache first, network fallback
  else if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            // Return cached version and update in background
            fetch(request)
              .then((freshResponse) => {
                if (freshResponse && freshResponse.status === 200) {
                  caches.open(CURRENT_CACHE).then((cache) => {
                    cache.put(request, freshResponse);
                  });
                }
              })
              .catch(() => {
                // Failed to fetch fresh version, that's OK
              });
            return response;
          }
          
          // Not in cache, fetch from network
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Cache successful responses
              const responseToCache = response.clone();
              caches.open(CURRENT_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
              
              return response;
            })
            .catch((error) => {
              console.warn('[SW] Fetch failed for:', request.url, error);
              
              // Return placeholder for failed assets
              if (request.destination === 'image') {
                return new Response(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="12">Offline</text></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
              
              throw error;
            });
        })
    );
  }
  
  // Other requests - network first
  else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CURRENT_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
