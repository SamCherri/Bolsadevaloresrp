self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Offline completo não implementado no MVP; SW usado para base instalável.
self.addEventListener('fetch', () => {});
