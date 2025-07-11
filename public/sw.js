
// public/sw.js

const CACHE_NAME = 'aurora-v1.2'; // Incremented cache name for proper updates
const urlsToCache = [
  '/', // Cache the root HTML
  '/manifest.json', // Cache the manifest (ensure it exists)
];

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker (v4 - notification fixes) installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell with simplified list:', urlsToCache);
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.error('[SW] Caching failed during install for urls:', urlsToCache, error);
            throw error;
          });
      })
      .then(() => {
        console.log('[SW] Caching successful. Attempting skipWaiting().');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Overall installation process failed:', error);
      })
  );
  console.log('[SW] Service Worker installation steps queued.');
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker (v4 - notification fixes) activating.');
  event.waitUntil(
    Promise.all([
      clients.claim(),
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
    ])
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
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received for tag:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Try to find an existing window with the app
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('[SW] Focusing existing client:', client.url);
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        const appUrl = self.location.origin + '/';
        console.log('[SW] Opening new window:', appUrl);
        return clients.openWindow(appUrl);
      }
    }).catch(error => {
      console.error('[SW] Error handling notification click:', error);
    })
  );
});

// Fixed background sync - removed localStorage dependency
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event triggered with tag:', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    console.log('[SW] Starting background sync for tasks');
    
    // Get all clients (browser tabs) to communicate with them
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });
    
    // Send message to all clients to trigger task sync
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_TASKS_REQUEST',
        timestamp: Date.now()
      });
    });
    
    console.log('[SW] Background sync request sent to clients');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SYNC_TASKS_RESPONSE') {
    console.log('[SW] Received task sync response from client');
    // Handle the response if needed
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    console.log('[SW] Showing notification via message:', title);
    
    // Show the notification
    self.registration.showNotification(title, {
      body: options?.body || 'You have a new notification.',
      icon: options?.icon || '/favicon.ico',
      tag: options?.tag || 'default',
      timestamp: options?.timestamp || Date.now(),
      badge: '/favicon.ico',
      requireInteraction: true,
      ...options
    }).catch(error => {
      console.error('[SW] Error showing notification:', error);
    });
  }
});

console.log('[SW] Service Worker script (v4 - notification fixes) loaded and parsed.');
