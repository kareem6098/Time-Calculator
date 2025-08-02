const CACHE_NAME = 'time-calculator-v1';
const urlsToCache = [
    './', // Caches the root URL (index.html or the main page)
    'index.html', // Explicitly cache the HTML file
    'manifest.json', // Cache the manifest file
    // Cache the icons (assuming they are in an 'icons' folder)
    'icons/icon-72x72.png',
    'icons/icon-96x96.png',
    'icons/icon-128x128.png',
    'icons/icon-144x144.png',
    'icons/icon-152x152.png',
    'icons/icon-192x192.png',
    'icons/icon-384x384.png',
    'icons/icon-512x512.png',
    // Tailwind CSS is loaded from a CDN, so we don't cache it directly here.
    // If you wanted to cache it, you'd add its full CDN URL.
];

// Install event: Caches all necessary assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event: Serves cached content or fetches from network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request).catch(() => {
                    // This catch block handles network errors (e.g., offline)
                    // You could return an offline page here if you had one
                    console.log('Network request failed and no cache found for:', event.request.url);
                    // For now, just return an empty response or throw an error
                    return new Response('');
                });
            })
    );
});
