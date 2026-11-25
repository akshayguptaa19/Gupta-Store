// Gupta General Store — Auto-cleanup and Self-Unregister Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// IMPORTANT: Do NOT add a 'fetch' listener. Without a fetch listener,
// Chromium handles all network requests natively and will never intercept
// or crash on Next.js RSC requests or chunks.
