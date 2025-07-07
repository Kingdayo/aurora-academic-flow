// public/sw.js

const CACHE_NAME = 'aurora-v1.1'; // Incremented cache name to help with updates
// Simplified urlsToCache for debugging SW activation.
// Ensure manifest.json exists at public root, or remove it too if unsure.
// For a Vite app, you'd typically use a plugin like vite-plugin-pwa to generate this list.
const urlsToCache = [
  '/', // Cache the root HTML
  '/manifest.json', // Cache the manifest (ensure it exists)
  // '/favicon.ico' // Often good to cache the favicon
  // Temporarily removed '/static/js/bundle.js' and '/static/css/main.css' as they are likely incorrect for Vite prod builds
];

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker (v3 - simplified cache) installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell with simplified list:', urlsToCache);
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.error('[SW] Caching failed during install for urls:', urlsToCache, error);
            // If addAll fails, the SW installation will fail.
            // This catch helps log the error but doesn't prevent install failure.
            // To allow SW to install even if some assets fail, you'd cache them individually
            // and not let the promise chain reject. For debugging, failing is okay.
            throw error; // Re-throw to ensure install fails if caching crucial assets fails
          });
      })
      .then(() => {
        console.log('[SW] Caching successful (or no critical caching errors). Attempting skipWaiting().');
        return self.skipWaiting();
      })
      .catch(error => {
        // This catch is if caches.open fails or if the re-thrown error from cache.addAll is caught.
        console.error('[SW] Overall installation process failed:', error);
        // Do not call self.skipWaiting() if installation failed critically.
      })
  );
  console.log('[SW] Service Worker installation steps queued.');
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker (v3 - simplified cache) activating.');
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
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
  // Basic cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Serve from cache
        }
        return fetch(event.request).then((networkResponse) => {
          // Optionally, dynamically cache new successful GET requests
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse; // Serve from network
        });
      })
      .catch(error => {
        console.error('[SW] Fetch error:', error, 'for request:', event.request.url);
        // Optionally, return a fallback page for offline if appropriate
        // return caches.match('/offline.html');
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click Received for tag:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
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

// Background sync for offline tasks (existing code - with noted localStorage issue)
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
    console.warn('[SW] getStoredTasks attempting to access localStorage, which is not available in SW. This part of sync might fail.');
    try {
        // This will fail as localStorage is not available.
        // const stored = localStorage.getItem('pendingTasks');
        // resolve(stored ? JSON.parse(stored) : []);
        resolve([]); // Default to empty as localStorage won't work.
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
      console.log('[SW] Simulated server sync complete.');
      resolve();
    }, 1000);
  });
}

console.log('[SW] Service Worker script (v3 - simplified cache) loaded and parsed.');
