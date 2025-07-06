
const CACHE_NAME = 'aurora-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  console.log('[SW] Service Worker installed with caching.');
  // self.skipWaiting(); // Optional: activate new SW immediately
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating.');
  // You might want to add logic here to clean up old caches
  // event.waitUntil(clients.claim()); // Optional: take control of clients immediately
});

self.addEventListener('fetch', (event) => {
  // console.log('[SW] Fetching:', event.request.url); // Can be noisy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          // console.log('[SW] Cache hit for:', event.request.url);
          return response;
        }
        // console.log('[SW] Cache miss, fetching from network:', event.request.url);
        return fetch(event.request);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click Received for tag:', event.notification.tag);
  event.notification.close(); // Close the notification

  // Example: Focus an open window or open a new one.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' || client.url.startsWith(self.registration.scope)) {
          if ('focus' in client && typeof client.focus === 'function') {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(self.registration.scope || '/');
      }
    })
  );
});

// Background sync for offline tasks
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    const pendingTasks = await getStoredTasks();
    if (pendingTasks.length > 0) {
      // Sync with server when online
      await syncWithServer(pendingTasks);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

function getStoredTasks() {
  return new Promise((resolve) => {
    const stored = localStorage.getItem('pendingTasks');
    resolve(stored ? JSON.parse(stored) : []);
  });
}

function syncWithServer(tasks) {
  return new Promise((resolve) => {
    // Simulate server sync
    setTimeout(() => {
      localStorage.removeItem('pendingTasks');
      resolve();
    }, 1000);
  });
}
