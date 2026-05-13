const CACHE_NAME = 'kono-elm-shell-v4';
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const ASSETS_TO_CACHE = [
  '/',
  '/en',
  '/reader',
  '/continue-reading',
  '/en/continue-reading',
  '/favicon.ico',
  '/favicon.png',
  '/manifest.json?lang=ar',
  '/manifest.json?lang=en',
  '/icon.png',
  '/icon-top.png',
  '/apple-icon.png',
  PDFJS_CDN,
  PDFJS_WORKER_CDN,
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Tajawal:wght@200;300;400;500;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME && !name.startsWith('kono-elm-pdf-cache'))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For Archive.org page images, try cache first then network
  if (url.hostname === 'archive.org' && url.pathname.includes('/page/n')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;

        // If not in cache, fetch from network
        return fetch(event.request).then((networkResponse) => {
          return networkResponse;
        }).catch(() => {
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // For navigation requests, try network then fallback to cache (Shell)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        const path = url.pathname;
        if (path.includes('/reader')) {
          return caches.match('/reader');
        }
        if (path.includes('/continue-reading')) {
           return caches.match(path.startsWith('/en') ? '/en/continue-reading' : '/continue-reading');
        }
        if (path.startsWith('/en')) {
          return caches.match('/en');
        }
        return caches.match('/');
      })
    );
    return;
  }

  // For other requests (scripts, fonts, images)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
