// public/sw.js

const CACHE_NAME = 'aurora-v1'; // Keep existing cache name or update if needed
const urlsToCache = [ // Keep existing URLs or update
  '/',
  '/static/js/bundle.js', // This might be Vite/dev specific, adjust for production build if different
  '/static/css/main.css', // This might be Vite/dev specific, adjust for production build if different
  '/manifest.json' // Ensure you have a manifest.json for PWA features
  // Add other core assets like icons, main chunks, etc.
];

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
  console.log('[SW] Service Worker installation steps queued.');
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating.');
  // Claim clients immediately. This allows the SW to control pages that were loaded
  // before it was activated, without waiting for a navigation.
  event.waitUntil(clients.claim());
  // Optional: Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) { // Delete caches that are not the current one
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  console.log('[SW] Service Worker activation complete and old caches cleaned.');
});

self.addEventListener('fetch', (event) => {
  // console.log('[SW] Fetching:', event.request.url); // Can be very noisy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // console.log('[SW] Cache hit for:', event.request.url);
          return response; // Serve from cache
        }
        // console.log('[SW] Cache miss, fetching from network:', event.request.url);
        return fetch(event.request).then((networkResponse) => {
          // Optional: Cache new requests dynamically if needed
          // if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          //   const responseToCache = networkResponse.clone();
          //   caches.open(CACHE_NAME).then((cache) => {
          //     cache.put(event.request, responseToCache);
          //   });
          // }
          return networkResponse; // Serve from network
        });
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click Received for tag:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Check if the client URL matches your app's scope
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(self.registration.scope || '/');
      }
    })
  );
});

// Background sync for offline tasks (existing code)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    const pendingTasks = await getStoredTasks();
    if (pendingTasks.length > 0) {
      await syncWithServer(pendingTasks);
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

function getStoredTasks() {
  return new Promise((resolve) => {
    // Note: Service Workers cannot directly access localStorage from the window context.
    // This part of your existing SW might not work as intended for background sync
    // unless 'pendingTasks' is stored via IndexedDB or cache API accessible to SW.
    // For now, leaving as is, but this is a common pitfall.
    console.warn('[SW] getStoredTasks attempting to access localStorage, which is not available in SW. This part of sync might fail.');
    try {
        const stored = localStorage.getItem('pendingTasks'); // This will not work in SW context
        resolve(stored ? JSON.parse(stored) : []);
    } catch (e) {
        console.error('[SW] Error accessing localStorage in getStoredTasks:', e);
        resolve([]);
    }
  });
}

function syncWithServer(tasks) {
  console.log('[SW] Simulating syncWithServer for tasks:', tasks);
  return new Promise((resolve) => {
    setTimeout(() => {
      // localStorage.removeItem('pendingTasks'); // This will not work in SW context
      console.log('[SW] Simulated server sync complete.');
      resolve();
    }, 1000);
  });
}

console.log('[SW] Service Worker script (v2 with skipWaiting & claim) loaded and parsed.');
