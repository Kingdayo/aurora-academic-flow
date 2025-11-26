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
    priority: 'high',
    data: {
      url: data.url || '/',
      taskId: data.taskId,
      notification_type: data.notification_type,
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  const urlToOpen = data.url ? new URL(data.url, self.location.origin).href : '/';

  if (data.notification_type === 'task_reminder' && data.taskId) {
    // Custom logic for task reminder clicks
    // For example, navigate to the specific task
    const taskUrl = `/tasks/${data.taskId}`;
    event.waitUntil(self.clients.openWindow(taskUrl));
    return;
  }

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then((c) => c.navigate(urlToOpen));
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});