const SHELL = new URL("./", self.location).href;
const CACHE_NAME = "sh-site-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Для SPA: завжди повертаємо shell (index.html) для навігаційних запитів
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Якщо отримали 404 або redirect — повертаємо shell
        if (!res.ok || res.redirected) {
          return fetch(SHELL, { cache: "no-store" });
        }
        return res;
      })
      .catch(() => fetch(SHELL, { cache: "no-store" })),
  );
});
