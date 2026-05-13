/**
 * Stoneware App - Service Worker
 *
 * Macht die App offlinefähig durch intelligentes Caching.
 * - Erst-Installation: Kernfiles werden gespeichert
 * - Jeder Request: Aus Cache wenn vorhanden, sonst Netzwerk, sonst Cache-Fallback
 * - Bei neuer Version: Alter Cache wird aufgeräumt
 *
 * WICHTIG: Bei Code-Änderungen an der App muss die CACHE_VERSION erhöht werden
 * (z.B. von 'v1' auf 'v2'), damit Browser den neuen Code laden.
 */

const CACHE_VERSION = 'stoneware-v1';

// Diese Dateien werden bei der Installation sofort gecacht
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

// 1. INSTALL: Beim ersten Aufruf werden die Kernfiles im Cache abgelegt
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('SW install: precache failed', err))
  );
});

// 2. ACTIVATE: Alte Caches werden aufgeraeumt
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. FETCH: Stale-While-Revalidate-Strategie
//    - Cache zuerst liefern (sofortige Antwort)
//    - Im Hintergrund aktualisieren
//    - Bei Offline: Cache als Fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Nur GET-Requests cachen
  if (request.method !== 'GET') return;

  // Keine chrome-extension:// etc. anfassen
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          // Nur erfolgreiche Antworten cachen
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, responseClone).catch(() => { /* silently ignore */ });
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // Offline-Fallback

      // Wenn im Cache: sofort zurueckgeben (schnell!) und im Hintergrund aktualisieren
      return cachedResponse || networkFetch;
    })
  );
});

// Bonus: Erlaubt der App, dem SW Befehle zu schicken (z.B. fuer Updates)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
