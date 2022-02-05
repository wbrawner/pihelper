const filesToCache = [
    '/',
    '/index.html',
    '/static/css/style.css',
    '/static/icons/icon-128x128.png',
    '/static/icons/icon-144x144.png',
    '/static/icons/icon-152x152.png',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-384x384.png',
    '/static/icons/icon-512x512.png',
    '/static/icons/icon-72x72.png',
    '/static/icons/icon-96x96.png',
    '/static/icons/icon-maskable-128x128.png',
    '/static/icons/icon-maskable-144x144.png',
    '/static/icons/icon-maskable-152x152.png',
    '/static/icons/icon-maskable-192x192.png',
    '/static/icons/icon-maskable-384x384.png',
    '/static/icons/icon-maskable-512x512.png',
    '/static/icons/icon-maskable-72x72.png',
    '/static/icons/icon-maskable-96x96.png'
];

const staticCacheName = 'pages-cache-v1';

// TODO: Import this properly
type InstallEvent = any;

self.addEventListener('install', (event: InstallEvent) => {
    console.log('Attempting to install service worker and cache static assets');
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                return cache.addAll(filesToCache);
            })
    );
});

self.addEventListener('fetch', (event: InstallEvent) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            caches.open(staticCacheName).then((cache) => {
                if (event.request.url.match(/^https?/)) {
                    cache.add(event.request.url);
                }
            })
            return response || fetch(event.request);
        })
    );
});
