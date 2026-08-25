/* service-worker.js — cache app shell agar bisa dibuka offline & install ke HP */
var CACHE = 'keuangan-v1';
var ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'finance-core.js',
  'config.js',
  'manifest.webmanifest',
  'icon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (res) {
        // simpan salinan dinamis (kecuali request ke Apps Script)
        if (res.ok && res.type === 'basic' && !/script\.googleusercontent\.com|google\.com\/macros/.test(e.request.url)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return caches.match('./'); });
    })
  );
});
