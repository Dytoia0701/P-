// Two caches (v37):
//  - CACHE_NAME holds the app code and changes with every release.
//  - DATA_CACHE holds the notes, questions and spec data (about 2.5 MB). Its name is a fingerprint of those files, so a
//    code-only update does not download them again. update-data-hash.py sets DATA_HASH whenever data.js or specs.js change.
const CACHE_NAME = 'bridge-protocol-v38';
const DATA_HASH = '0fc74eb7d487';
const DATA_CACHE = 'bridge-data-' + DATA_HASH;
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
const DATA_FILES = ['./data.js', './specs.js'];
const DATA_PATHS = DATA_FILES.map(f => new URL(f, self.location).pathname);

self.addEventListener('install', event => {
  event.waitUntil(Promise.all([
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)),
    // Only fetch data files this data cache does not already hold.
    caches.open(DATA_CACHE).then(async cache => {
      for (const f of DATA_FILES) { if (!(await cache.match(f))) await cache.add(f); }
    })
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k =>
      (k.startsWith('bridge-protocol-') && k !== CACHE_NAME) || (k.startsWith('bridge-data-') && k !== DATA_CACHE)
    ).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for same-origin GETs: instant offline-capable loads, and the cache is refreshed in the background.
// Navigations that miss both cache and network fall back to the cached app shell instead of the browser's offline error page.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(DATA_PATHS.includes(url.pathname) ? DATA_CACHE : CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    const network = fetch(req).then(response => {
      if (response && response.ok && response.type === 'basic') {
        cache.put(req, response.clone()).catch(() => {});
      }
      return response;
    }).catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    const fresh = await network;
    if (fresh) return fresh;
    if (req.mode === 'navigate') {
      const shell = await caches.match('./index.html');
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain' } });
  })());
});
