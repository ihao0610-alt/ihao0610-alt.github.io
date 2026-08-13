const CACHE_NAME = "ccaa-memory-shell-20260814-r2";
const APP_SHELL = ["/", "/index.html", "/content/catalog.json", "/content/sources.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  const networkFirst = event.request.mode === "navigate" || url.pathname.startsWith("/content/");
  event.respondWith(caches.match(event.request).then((cached) => {
    const fresh = fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => cached ?? new Response("离线状态下尚未缓存此内容", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }));
    return networkFirst ? fresh : cached || fresh;
  }));
});
