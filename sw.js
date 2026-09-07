/* 宿曜經・三九祕宿：快取只管理本工具所在路徑。 */
const PREFIX = 'xiuyao-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + 'e4f1a41392ca';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './icons/favicon-32.png', './icons/cover-1024.png'
];
const ASSETS = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  const page = new URL(request.url); page.search = ''; page.hash = '';
  if (request.mode === 'navigate' && (page.href === self.registration.scope || page.href === new URL('./index.html', self.registration.scope).href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) {
          try { await cache.put('./index.html', response.clone()); } catch (_) { /* 空間不足時仍可線上使用。 */ }
          return response;
        }
        return await cache.match('./index.html') || response;
      } catch (_) {
        return await cache.match('./index.html') || new Response('首次使用請先連線載入工具。', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }
  if (ASSETS.has(url.href)) event.respondWith(caches.open(CACHE).then(cache => cache.match(request)).then(cached => cached || fetch(request)));
});
