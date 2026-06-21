/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { base, build, files, version } from '$service-worker';

const self = globalThis.self as unknown as ServiceWorkerGlobalScope;

// App-shell cache: rotated on every deploy.
const SHELL = `shell-${version}`;
// Runtime cache for third-party GETs (map tiles, fonts) — kept across deploys.
const RUNTIME = 'runtime-v1';

// Prerendered entry pages (base-aware) so the app shell works offline too.
const PAGES = [`${base}/`, `${base}/404.html`, `${base}/embed/`];
const ASSETS = [...build, ...files, ...PAGES];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== SHELL && key !== RUNTIME) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache live weather data — always go to the network.
  if (url.hostname.endsWith('open-meteo.com')) return;

  // Same-origin app shell: cache-first (precached at install).
  if (url.origin === self.location.origin) {
    if (ASSETS.includes(url.pathname)) {
      event.respondWith(
        caches.match(req).then((hit) => hit ?? fetch(req)),
      );
      return;
    }
    // SPA navigations: serve the prerendered shell when offline.
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req).catch(async () => {
          const cache = await caches.open(SHELL);
          return (
            (await cache.match(req)) ??
            (await cache.match(`${base}/`)) ??
            (await cache.match(`${base}/404.html`)) ??
            Response.error()
          );
        }),
      );
      return;
    }
    return;
  }

  // Cross-origin (tiles, fonts, leaflet CDN): stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached ?? network;
    })(),
  );
});
