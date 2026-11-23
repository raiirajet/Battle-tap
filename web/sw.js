/* BattleTap offline PWA cache. HTTPS served by GitHub Pages. */
const CACHE = 'battle-tap-pwa-dev';
const SHELL = ['./', './index.html', './flutter_bootstrap.js', './main.dart.js',
  './manifest.json', './icons/Icon-192.png', './icons/Icon-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((name) => name.startsWith('battle-tap-pwa-') && name !== CACHE)
      .map((name) => caches.delete(name))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put('./index.html', copy)));
      }
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
    }
    return response;
  })));
});
