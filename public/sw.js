/// <reference lib="WebWorker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// This is the injection point for the precache manifest.
// The build process will replace this with an array of assets to cache.
precacheAndRoute(self.__WB_MANIFEST);

// This ensures that the new service worker takes control of the page as soon as it's activated.
self.skipWaiting();
clientsClaim();

// Clean up old, unused caches from previous versions of the service worker.
cleanupOutdatedCaches();

// --- Custom Push Notification Logic ---

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'Aurora';
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: data.url || '/',
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Default to '/' if no URL was provided in the notification data
  const targetUrl = event.notification.data?.url ?? '/';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // If a window is already open, focus it and navigate.
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then((c) => {
          if (c && 'navigate' in c) {
            return c.navigate(urlToOpen);
          }
          return c;
        });
      }
      // Otherwise, open a new window.
      return self.clients.openWindow(urlToOpen);
    })
  );
});
});