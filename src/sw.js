// Service worker — cache versionné par version d'app (ADR-02, hors ligne d'abord).
const VERSION = "{{APP_VERSION}}";
const CACHE = `budget-familial-${VERSION}`;
const PRECACHE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "horloge.js",
  "stockage.js",
  "manifest.webmanifest",
  "domain/domaine.js",
  "domain/exportImport.js",
  "domain/ofx.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ??
        fetch(e.request).then((rep) => {
          if (rep.ok) {
            const clone = rep.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return rep;
        }),
    ),
  );
});
