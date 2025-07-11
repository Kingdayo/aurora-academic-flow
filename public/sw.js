
// public/sw.js

const CACHE_NAME = 'aurora-v1.3'; // Incremented cache name for mobile notification fixes
const urlsToCache = [
  '/', // Cache the root HTML
  '/manifest.json', // Cache the manifest (ensure it exists)
];

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker (v5 - mobile notification fixes) installing.');
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
  console.log('[SW] Service Worker (v5 - mobile notification fixes) activating.');
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

// Enhanced background sync with mobile optimizations
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

// Handle messages from the main thread with mobile enhancements
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SYNC_TASKS_RESPONSE') {
    console.log('[SW] Received task sync response from client');
    // Handle the response if needed
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    console.log('[SW] Showing notification via message:', title);
    
    // Enhanced notification options for mobile
    const notificationOptions = {
      body: options?.body || 'You have a new notification.',
      icon: options?.icon || '/favicon.ico',
      tag: options?.tag || 'default',
      badge: '/favicon.ico',
      requireInteraction: options?.requireInteraction !== false, // Default to true for mobile
      silent: options?.silent === true, // Default to false for better mobile experience
      vibrate: options?.vibrate || [200, 100, 200], // Default vibration pattern
      actions: options?.actions || [],
      data: {
        url: self.location.origin,
        timestamp: Date.now()
      },
      ...options
    };
    
    // Show the notification with mobile-optimized settings
    self.registration.showNotification(title, notificationOptions)
      .then(() => {
        console.log('[SW] Notification shown successfully:', title);
      })
      .catch(error => {
        console.error('[SW] Error showing notification:', error);
      });
  }
});

// Add notification close handler for mobile
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  // Track notification dismissals if needed
});

console.log('[SW] Service Worker script (v5 - mobile notification fixes) loaded and parsed.');
