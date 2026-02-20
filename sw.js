// Minimal service worker (optional). If you don't want a service worker, you can omit this file.
const CACHE = 'urble-static-v1';
const FILES = ['/', 'index.html', 'styles.css', 'app.js', 'words.json', 'manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});