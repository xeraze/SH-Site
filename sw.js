const SHELL = new URL("./", self.location).href;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  let hash = 0;
  for (const ch of url.pathname) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  }
  const byContent = 1800 + (hash % 5) * 1400;
  const byLoad = Math.random() * 5200;
  const spike = Math.random() < 0.18 ? 9000 + Math.random() * 13000 : 0;
  const delay = Math.max(1200, byContent + byLoad + spike);

  // Заголовки отдаём сразу (старая страница уходит, белый екран),
  // а тело віддаємо з затримкою — як справжнє повільне завантаження.
  const { readable, writable } = new TransformStream();

  (async () => {
    await wait(delay);
    try {
      const res = await fetch(SHELL, { cache: "no-store" });
      await res.body.pipeTo(writable);
    } catch {
      const writer = writable.getWriter();
      writer.write(
        new TextEncoder().encode(
          '<html><head><meta charset="utf-8"><title>Помилка</title></head><body><h1>Сторінка тимчасово недоступна</h1></body></html>',
        ),
      );
      writer.close();
    }
  })();

  event.respondWith(
    new Response(readable, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );
});
