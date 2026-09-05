const CACHE = 'caption-confidence-v4';
const PAGES = ['/', '/demo/', '/privacy/', '/terms/', '/404.html'];
const SHELL = [...PAGES, '/assets/caption-instrument-768.webp', '/favicon.svg', '/apple-touch-icon.png'];

self.addEventListener('install', (event) => event.waitUntil(
  caches.open(CACHE).then(async (cache) => {
    await cache.addAll(SHELL);
    const markup = await Promise.all(PAGES.map(async (path) => (await (await cache.match(path)).text())));
    const assets = new Set(markup.flatMap((html) => [...html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)]
      .map((match) => match[1])
      .filter((path) => /\.(?:css|js|jpg|png|svg|webp)$/.test(path))));
    await cache.addAll([...assets]);
  }).then(() => self.skipWaiting())
));

self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      void caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    }
    return response;
  })));
});
