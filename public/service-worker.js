// Service Worker for FRIGO PWA
const CACHE_NAME = 'frigo-cache-v1';

// Core assets that must be cached for the PWA to function
const APP_SHELL = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/site.webmanifest',
  '/offline.html'
];

// App routes to cache for offline use
const ROUTES_TO_CACHE = [
  '/generate',
  '/meal-plan',
  '/recipes',
  '/about',
  '/login',
  '/register'
];

// Cache to hold dynamic content
const DYNAMIC_CACHE = 'frigo-dynamic-v1';

// Install event - cache key assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  // Cache files individually to avoid failing if one file is missing
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        
        // Add each file separately - if one fails, the others will still be cached
        const cachePromises = [...APP_SHELL, ...ROUTES_TO_CACHE].map(url => {
          return cache.add(url).catch(error => {
            console.warn(`[Service Worker] Failed to cache: ${url}`, error);
            // Continue despite the error
            return Promise.resolve();
          });
        });
        
        return Promise.all(cachePromises);
      })
      .catch(err => {
        console.error('[Service Worker] Cache error:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  // Clear old cache versions
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE);
          })
          .map(cacheName => {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Helper function to determine if a URL should be cached
const shouldCache = (url) => {
  const parsedUrl = new URL(url);
  
  // Never cache API requests, authentication endpoints, etc.
  const shouldNotCache = [
    '/api/',
    '/auth/',
    'chrome-extension://'
  ].some(path => url.includes(path));
  
  if (shouldNotCache) return false;
  
  // Cache app files from the same origin
  return parsedUrl.origin === self.location.origin;
};

// Fetch event - network first with fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Check if this is an app shell asset
  const isAppShell = APP_SHELL.some(item => {
    return url.pathname === item || url.pathname.endsWith(item);
  });
  
  // Check if this is an HTML request
  const isHTMLRequest = event.request.headers.get('accept')?.includes('text/html');
  
  // For navigation/HTML requests (main pages)
  if (isHTMLRequest || ROUTES_TO_CACHE.includes(url.pathname)) {
    event.respondWith(
      // Try network first
      fetch(event.request)
        .then(response => {
          // If successful, clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request)
            .then(cachedResponse => {
              // If in cache, return it, otherwise show offline page
              return cachedResponse || caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // For app shell resources (CSS, JS, images that are part of the core app)
  if (isAppShell) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // Return from cache if available, otherwise fetch from network
        return cachedResponse || fetch(event.request).then(response => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(error => {
          console.warn(`Failed to fetch ${event.request.url}:`, error);
          // Return default offline page for HTML, or a placeholder for other resources
          if (isHTMLRequest) {
            return caches.match('/offline.html');
          }
          return new Response('Resource not available offline');
        });
      })
    );
    return;
  }
  
  // For other requests that should be cached (images, etc.)
  if (shouldCache(event.request.url)) {
    event.respondWith(
      // Try from network first
      fetch(event.request)
        .then(response => {
          // Cache the response for future use
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if available
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || Promise.reject('no-match');
          });
        })
    );
  }
});