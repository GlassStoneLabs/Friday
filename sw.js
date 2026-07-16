/* Friday — offline shell. The glass never disappears; it returns to the air. */
const CACHE = "friday-v3";   // v3 — org backend; the API is never cached
const SHELL = [
  ".",
  "index.html",
  "css/friday.css",
  "js/friday.js",
  "assets/logo.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // The shell is cacheable; live state is not. Caching /api/* would serve a
  // stale directory forever (an org you just joined would never appear), and
  // /api/events is an endless stream — never hand either to the cache.
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("index.html"))
    )
  );
});
