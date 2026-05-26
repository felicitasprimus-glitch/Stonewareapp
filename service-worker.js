// ============================================================
// Stoneware App - Service Worker (selbst-aktualisierend)
// Ersetzt die bisherige service-worker.js.
// Du musst hier nichts mehr aendern - Updates kommen ab jetzt
// automatisch an, sobald du eine neue Version auf GitHub laedst.
// ============================================================

const VERSION = "stoneware-v2";

// App-Grundgeruest, das fuer den Offline-Start vorgehalten wird
const APP_SHELL = ["./", "./index.html", "./manifest.json"];

// --- Installation: Grundgeruest cachen + sofort uebernehmen ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting(); // neue Version nicht warten lassen, sofort aktiv
});

// --- Aktivierung: alte Caches loeschen + Kontrolle uebernehmen ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// --- Abruf-Strategie ---
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const accept = req.headers.get("accept") || "";
  const isHTML = req.mode === "navigate" || accept.includes("text/html");

  if (isHTML) {
    // Seiten immer zuerst aus dem Netz -> jede Aenderung kommt sofort an.
    // Kein Netz? Dann die gespeicherte Version anzeigen.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() =>
          caches.match("./index.html").then((r) => r || caches.match("./"))
        )
    );
    return;
  }

  // Bilder, manifest usw.: schnell aus dem Cache, im Hintergrund frisch nachladen.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fromNet = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fromNet;
    })
  );
});
