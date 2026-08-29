/* Service Worker for NPI Website - Offline Caching & Performance */

const CACHE_NAME = 'npi-v1';
const ASSETS_CACHE = 'npi-assets-v1';
const API_CACHE = 'npi-api-v1';

const CACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
];

const API_ENDPOINTS = [
  '/news',
  '/teachers',
  '/photos',
  '/get-notices',
  '/departments',
  '/videos',
  '/portfolio',
];

const STATIC_ASSETS = [
  /\.(js|css)$/,
  /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
  /\.(woff|woff2|ttf|eot)$/,
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CACHE_URLS.filter(url => url !== '/offline.html'));
        console.log('Cache install complete');
      } catch (err) {
        console.error('Cache install failed:', err);
      }
    })()
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== ASSETS_CACHE && name !== API_CACHE)
          .map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
      
      // Take control of all pages immediately
      return self.clients.claim();
    })()
  );
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          
          if (response.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
          }
          
          return response;
        } catch (error) {
          const cached = await caches.match(request);
          return cached || new Response(
            JSON.stringify({ error: 'Offline', cached: !!cached }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
      })()
    );
    return;
  }

  // Static assets - Cache first, fallback to network
  if (STATIC_ASSETS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        try {
          const response = await fetch(request);
          
          if (response.ok) {
            const cache = await caches.open(ASSETS_CACHE);
            cache.put(request, response.clone());
          }
          
          return response;
        } catch (error) {
          return new Response('Asset not available', { status: 404 });
        }
      })()
    );
    return;
  }

  // HTML pages - Network first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
          }
          
          return response;
        } catch (error) {
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          
          // Return offline page if available
          return caches.match('/offline.html') || new Response(
            'Page not available offline',
            { status: 503 }
          );
        }
      })()
    );
    return;
  }

  // Default - network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    })();
  }
});
