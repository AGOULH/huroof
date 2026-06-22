/* لعبة الحروف - Service Worker */
const CACHE = 'huroof-v4';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((res) => {
            // cache same-origin successful responses for next time
            try {
              const url = new URL(req.url);
              if (url.origin === self.location.origin && res && res.status === 200) {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(req, copy));
              }
            } catch (err) {}
            return res;
          })
          .catch(() => caches.match('./index.html'))
      );
    })
  );
});
