// Self-destructing Service Worker cleanup for legacy PWA deployments.
// Any browser with an older cached sw.js will fetch this update, purge stale caches,
// unregister itself, and allow fresh online Firebase-backed assets to load cleanly.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch {}
      try {
        await self.registration.unregister();
      } catch {}
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => {
          try {
            client.navigate(client.url);
          } catch {}
        });
      } catch {}
    })()
  );
});
