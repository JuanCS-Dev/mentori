/**
 * Mentori Service Worker
 *
 * Provides offline functionality:
 * - Cache static assets (CSS, JS, images)
 * - Cache question data for offline use
 * - Background sync for pending actions
 */

const CACHE_NAME = "mentori-v1";
const DATA_CACHE_NAME = "mentori-data-v1";

// Static assets to cache immediately
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

// API/data patterns to cache
const DATA_PATTERNS = [/\/data\/.*\.json$/];

// ===== INSTALL =====

self.addEventListener("install", (event) => {
  console.warn("[SW] Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.warn("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.warn("[SW] Installation complete");
        return self.skipWaiting();
      })
      .catch((_error) => {
        console.error("[SW] Installation failed:", _error);
      }),
  );
});

// ===== ACTIVATE =====

self.addEventListener("activate", (event) => {
  console.warn("[SW] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
            .map((name) => {
              console.warn("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        console.warn("[SW] Activation complete");
        return self.clients.claim();
      }),
  );
});

// ===== FETCH =====

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) return;

  // Check if it's a data request
  const isDataRequest = DATA_PATTERNS.some((pattern) =>
    pattern.test(url.pathname),
  );

  if (isDataRequest) {
    // Network first, then cache for data
    event.respondWith(networkFirstStrategy(request, DATA_CACHE_NAME));
  } else if (request.destination === "document") {
    // Network first for HTML
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
  } else {
    // Cache first for static assets
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  }
});

// ===== STRATEGIES =====

async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cached, but update in background
    updateCache(request, cacheName);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_error) {
    console.error("[SW] Fetch failed:", _error);
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (_error) {
    console.warn("[SW] Network failed, trying cache:", request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for document requests
    if (request.destination === "document") {
      const offlineResponse = await caches.match("/");
      if (offlineResponse) return offlineResponse;
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function updateCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
  } catch (_error) {
    // Silently fail - we already have cached version
  }
}

// ===== BACKGROUND SYNC =====

self.addEventListener("sync", (event) => {
  console.warn("[SW] Sync event:", event.tag);

  if (event.tag === "sync-progress") {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Get pending actions from IndexedDB
  // This would be implemented with the syncService
  console.warn("[SW] Syncing progress...");
}

// ===== PUSH NOTIFICATIONS =====

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || "Nova atualização disponível",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      { action: "open", title: "Abrir" },
      { action: "close", title: "Fechar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Mentori", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    const url = event.notification.data?.url || "/";
    event.waitUntil(self.clients.openWindow(url));
  }
});

// ===== MESSAGE HANDLING =====

self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CACHE_QUESTIONS":
      cacheQuestionData(payload);
      break;

    case "CLEAR_CACHE":
      clearAllCaches();
      break;

    default:
      console.warn("[SW] Unknown message:", type);
  }
});

async function cacheQuestionData(urls) {
  const cache = await caches.open(DATA_CACHE_NAME);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.warn("[SW] Cached:", url);
      }
    } catch (_error) {
      console.error("[SW] Failed to cache:", url, _error);
    }
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.warn("[SW] All caches cleared");
}

console.warn("[SW] Service Worker loaded");
