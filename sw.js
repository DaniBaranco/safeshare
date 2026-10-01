// sw.js — Service Worker de SafeShare.
// Estrategia: precache del "app shell" para que funcione sin conexión,
// network-first en navegaciones y recursos propios, stale-while-revalidate
// en el resto.
// Nota de privacidad: aquí solo se cachean los ARCHIVOS de la app. El dato
// cifrado vive únicamente en el fragmento de la URL, que nunca llega al
// service worker ni a la caché.

const VERSION = 'v5';
const CACHE = `safeshare-${VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/fonts.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './js/app.js',
  './js/config.js',
  './js/core/crypto.js',
  './js/core/detector.js',
  './js/core/link.js',
  './js/services/clipboard.js',
  './js/services/share.js',
  './js/services/pwa.js',
  './js/ui/dom.js',
  './js/ui/toast.js',
  './js/ui/reveal.js',
  './js/ui/header.js',
  './js/ui/mode.js',
  './js/ui/theme.js',
  './js/features/create.js',
  './js/features/open.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-180.png',
  './icons/favicon-32.png',
  './fonts/inter-400.woff2',
  './fonts/inter-500.woff2',
  './fonts/inter-700.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (req.mode === 'navigate' || sameOrigin) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() =>
        caches.match(req).then((cached) =>
          cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
