// Define a cache name for versioning. Increment this when you make changes to your cached assets.
const CACHE_NAME = 'production-supervisor-tools-v1.0';

// List all the files you want to cache.
// These should include your HTML, CSS, JavaScript, and icon files.
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
  // Note: External CDN links (Tailwind, Font Awesome, html2canvas) are generally not cached by your service worker.
  // They are typically handled by the browser's HTTP cache.
];

// --- Install Event ---
// This event is fired when the service worker is first installed.
// It's used to open a cache and add all the specified assets to it.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and caching static assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Add all the files from urlsToCache to the cache.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become active.
        // This ensures new service worker takes control immediately.
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed:', error);
      })
  );
});

// --- Activate Event ---
// This event is fired when the service worker is activated.
// It's primarily used to clean up old caches, ensuring only the latest version is used.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating and cleaning up old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If a cache name is not the current one, delete it.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients (tabs/windows) immediately.
      return self.clients.claim();
    })
  );
});

// --- Fetch Event ---
// This event is fired every time the browser requests a resource.
// It intercepts network requests and serves content from the cache if available.
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests and not interfere with other types (like POST).
  if (event.request.method !== 'GET') {
    return;
  }

  // Check if the request is for an asset in our cache.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the resource is found in the cache, return it.
        if (response) {
          // console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // If the resource is not in the cache, fetch it from the network.
        // Also, clone the request as it's a stream and can only be consumed once.
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest)
          .then((networkResponse) => {
            // Check if we received a valid response.
            // A response is valid if it's not null, has a status of 200, and is not an opaque response (e.g., cross-origin).
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response as it's a stream and can only be consumed once.
            // One copy goes to the browser, and the other goes to the cache.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Cache the fetched resource for future use.
                // console.log('Service Worker: Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed:', event.request.url, error);
            // You can provide a fallback response here for offline users, e.g., an offline page.
            // For now, we'll just return a rejected promise.
            // return caches.match('/offline.html'); // Example: serve an offline page
          });
      })
  );
});
