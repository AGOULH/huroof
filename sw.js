/* لعبة الحروف - Service Worker */
const CACHE = 'huroof-v7';
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
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  // دع الطلبات الخارجية (خطوط Google / Firebase) تمر للشبكة مباشرة
  if (url.origin !== self.location.origin) return;

  const isDoc =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html');

  if (isDoc) {
    // الشبكة أولاً للصفحة: المستخدم يحصل دائماً على آخر نسخة عند الاتصال، ويرجع للكاش دون اتصال
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // باقي الأصول: الكاش أولاً (سريع) مع تحديث في الخلفية
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
