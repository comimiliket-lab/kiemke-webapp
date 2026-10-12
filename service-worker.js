// ============================================================
// SERVICE WORKER — PWA Kiểm kê (v2)
// Không cache CDN library → luôn fetch mới
// ============================================================

const CACHE_NAME = 'kiemke-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

const SKIP_CACHE_HOSTS = [
  'docs.google.com',
  'script.google.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL).catch(err => console.warn('SW install:', err)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (SKIP_CACHE_HOSTS.some(h => url.hostname.includes(h))) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});