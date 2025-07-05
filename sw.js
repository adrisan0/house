const CACHE_NAME = 'house-cache-v4';
// Precache core files so the app works offline, including map assets
// required by jsVectorMap.
const ASSETS = [
  './',
  'index.html',
  'main.js',
  'provinces.js',
  'province_codes.js',
  'jsvectormap/jsvectormap.min.js',
  'jsvectormap/jsvectormap.min.css',
  'jsvectormap/spain.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
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
