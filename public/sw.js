// public/sw.js

// PWA Manifest injection point - required for vite-plugin-pwa
const manifest = self.__WB_MANIFEST || [];

const CACHE_NAME = 'aurora-v1.8'; // Updated version

// Extract valid URLs from manifest
const manifestUrls = manifest
  .filter(entry => entry && typeof entry.url === 'string')
  .map(entry => entry.url);

const urlsToCache = [
  '/', // Cache the root HTML
  '/manifest.json', // Cache the manifest (ensure it exists)
  ...manifestUrls // Include valid PWA manifest URLs
];

// Basic Service Worker without external dependencies
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Caching app shell. URLs to cache:', urlsToCache);
        
        // Cache files individually with error handling
        const cachePromises = urlsToCache.map(async (url) => {
          try {
            await cache.add(url);
            console.log('[SW] Successfully cached:', url);
          } catch (error) {
            console.warn('[SW] Failed to cache:', url, error.message);
            // Don't throw - continue with other files
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('[SW] Caching process completed.');
      })
      .then(() => {
        console.log('[SW] Attempting skipWaiting().');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation process failed:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating.');
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
        // Return a fallback response for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
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

// Handle messages from the main thread
self.addEventListener('message', async (event) => {
  if (!event.data || !event.data.type) {
    return;
  }

  // Handler for showing immediate local notifications
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, options = {} } = event.data;
    console.log('[SW] Showing notification:', title);
    
    try {
      await self.registration.showNotification(title, {
        body: body,
        icon: options.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || `notification-${Date.now()}`,
        requireInteraction: false,
        silent: false,
        data: options.data || {},
        actions: options.actions || []
      });
      
      console.log('[SW] Notification shown successfully');
    } catch (error) {
      console.error('[SW] Failed to show notification:', error);
    }
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let title = 'Task Reminder';
  let options = {
    body: 'You have a new task notification.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'task-reminder',
    requireInteraction: false,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[SW] Push data:', data);
      
      title = data.title || title;
      options.body = data.body || options.body;
      options.icon = data.icon || options.icon;
      options.tag = data.tag || options.tag;
      options.data = { ...options.data, ...data.data };
    } catch (e) {
      console.error('[SW] Failed to parse push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

console.log('[SW] Service Worker script loaded and parsed.');