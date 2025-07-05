const CACHE_NAME = 'house-cache-v6';
// Precache core files so the app works offline.
const ASSETS = [
  './',
  'index.html',
  'main.js',
  'style.css',
  'provinces.js',
  'chart.umd.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
