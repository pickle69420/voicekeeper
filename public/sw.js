const CACHE_NAME = "voicekeeper-v1";
const STATIC_CACHE = "voicekeeper-static-v1";
const DYNAMIC_CACHE = "voicekeeper-dynamic-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/memories",
  "/train",
  "/progress",
  "/settings",
  "/about",
  "/manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip API requests and external resources
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return;
  }

  // For navigation requests, try network first, then cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the new response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/");
          });
        })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then((response) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response);
          });
        });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache the response
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
    })
  );
});

// Handle background sync for offline recordings
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-recordings") {
    event.waitUntil(syncRecordings());
  }
});

async function syncRecordings() {
  // Get pending recordings from IndexedDB
  // Upload them when online
  console.log("Syncing offline recordings...");
}

// Handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Time to record a memory!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      { action: "record", title: "Record Now" },
      { action: "dismiss", title: "Later" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "VoiceKeeper", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "record") {
    event.waitUntil(clients.openWindow("/?action=record"));
  } else if (event.action === "dismiss") {
    // Just close
  } else {
    event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
  }
});
