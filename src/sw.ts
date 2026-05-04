/// <reference lib="WebWorker" />
/// <reference types="vite/client" />

// Custom Service Worker — gerenciado pelo vite-plugin-pwa em modo
// `injectManifest`. Mantemos o stack do Workbox (precache + runtime caching)
// e adicionamos handlers de Web Push + click.

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope;

// -----------------------------------------------------------------------------
// Precache + app-shell navigation
// -----------------------------------------------------------------------------
cleanupOutdatedCaches();
// __WB_MANIFEST é injetado em build pelo vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

const navigationDenylist = [/^\/api\//, /^\/auth\//, /^\/rest\//];
registerRoute(
  new NavigationRoute(
    async ({ event }) => {
      const fetchEvent = event as FetchEvent;
      // Fall back to app shell
      const shell = await caches.match("/organizai/index.html");
      return shell ?? fetch(fetchEvent.request);
    },
    { denylist: navigationDenylist }
  )
);

// -----------------------------------------------------------------------------
// Runtime caching: TMDB + Supabase Storage + fontes
// -----------------------------------------------------------------------------
registerRoute(
  ({ url }) => /image\.tmdb\.org/.test(url.hostname),
  new CacheFirst({
    cacheName: "tmdb-images",
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) =>
    /\.supabase\.co$/.test(url.hostname) &&
    url.pathname.startsWith("/storage/v1/object/public/"),
  new CacheFirst({
    cacheName: "storage-photos",
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) =>
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts",
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) => url.hostname === "rsms.me",
  new CacheFirst({
    cacheName: "inter-font",
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// -----------------------------------------------------------------------------
// SKIP_WAITING (acionado pelo updatePrompt)
// -----------------------------------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// -----------------------------------------------------------------------------
// PUSH HANDLER
// -----------------------------------------------------------------------------
interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

self.addEventListener("push", (event) => {
  const e = event as PushEvent;
  let payload: PushPayload | null = null;

  try {
    payload = e.data?.json() ?? null;
  } catch {
    const txt = e.data?.text() ?? "";
    if (txt) payload = { title: "OrganizAI", body: txt };
  }

  if (!payload) {
    payload = {
      title: "OrganizAI",
      body: "Algo novo te espera no app",
    };
  }

  const title = payload.title || "OrganizAI";
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon ?? "/organizai/pwa-192.png",
    badge: "/organizai/pwa-192.png",
    tag: payload.tag,
    // @ts-expect-error - vibrate is widely supported but missing in TS lib types
    vibrate: [200, 80, 200],
    data: { url: payload.url ?? "/" },
    requireInteraction: false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// -----------------------------------------------------------------------------
// NOTIFICATION CLICK
// -----------------------------------------------------------------------------
self.addEventListener("notificationclick", (event) => {
  const e = event as NotificationEvent;
  e.notification.close();
  const target = (e.notification.data?.url as string | undefined) ?? "/";
  const fullUrl = new URL(`/organizai${target}`, self.location.origin).toString();

  e.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Já tem janela aberta? foca + navega
      for (const client of allClients) {
        if (client.url.includes("/organizai/")) {
          client.focus();
          // tenta navegar pro URL alvo
          if ("navigate" in client) {
            try {
              await (client as WindowClient).navigate(fullUrl);
            } catch {
              /* fallback: apenas foca */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(fullUrl);
    })()
  );
});
