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

const DB_NAME = 'aurora-db';
const DB_VERSION = 1;
const NOTIFICATIONS_STORE_NAME = 'scheduled_notifications';
const SETTINGS_STORE_NAME = 'settings';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(NOTIFICATIONS_STORE_NAME)) {
        db.createObjectStore(NOTIFICATIONS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SCHEDULE_TASK_NOTIFICATION') {
    const { task } = event.data;
    const dueDate = new Date(task.dueDate);
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      dueDate.setUTCHours(hours, minutes, 0, 0);
    } else {
      dueDate.setUTCHours(23, 59, 59, 999);
    }

    const delay = dueDate.getTime() - Date.now();
    if (delay > 0) {
      try {
        const db = await openDB();
        const tx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(NOTIFICATIONS_STORE_NAME);
        await store.put({ id: task.id, task, dueDate: dueDate.toISOString() });
        await tx.done;
        console.log(`Task ${task.id} saved to IndexedDB for background sync.`);
        await self.registration.sync.register(`task-notification-${task.id}`);
      } catch (error) {
        console.error('Failed to schedule notification via IndexedDB and Background Sync:', error);
      }
    }
  }
});

const VIBRATION_PATTERNS = {
  short: [200],
  long: [500],
  pulse: [100, 50, 100],
  default: [200, 100, 200],
};

async function scheduleNotificationFromSync(tag) {
    try {
        const taskId = tag.replace('task-notification-', '');
        const db = await openDB();

        const settingsTx = db.transaction(SETTINGS_STORE_NAME, 'readonly');
        const settingsStore = settingsTx.objectStore(SETTINGS_STORE_NAME);
        const settings = await settingsStore.get('user-preferences');
        await settingsTx.done;

        const notifTx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readonly');
        const notifStore = notifTx.objectStore(NOTIFICATIONS_STORE_NAME);
        const notificationData = await notifStore.get(taskId);
        await notifTx.done;

        if (notificationData) {
            const { task } = notificationData;
            const dueDate = new Date(notificationData.dueDate);
            if (dueDate.getTime() > Date.now()) {
                const options = {
                    body: task.description || 'Your task is due now.',
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    priority: 'high',
                    data: {
                        url: `/tasks/${task.id}`,
                        taskId: task.id,
                        notification_type: 'task_reminder',
                    },
                    silent: !settings?.soundEnabled,
                    sound: settings?.soundEnabled ? `/sounds/${settings.selectedSound}.mp3` : undefined,
                    vibrate: settings?.vibrationEnabled ? VIBRATION_PATTERNS[settings.selectedVibration] : undefined,
                };

                await self.registration.showNotification(`⏰ ${task.title}`, options);
            }
            const deleteTx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readwrite');
            await deleteTx.objectStore(NOTIFICATIONS_STORE_NAME).delete(taskId);
            await deleteTx.done;
        }
    } catch (error) {
        console.error('Error in scheduleNotificationFromSync:', error);
    }
}

self.addEventListener('sync', (event) => {
  if (event.tag.startsWith('task-notification-')) {
    event.waitUntil(scheduleNotificationFromSync(event.tag));
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const db = await openDB();
      const tx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readonly');
      const store = tx.objectStore(NOTIFICATIONS_STORE_NAME);
      const notifications = await store.getAll();
      await tx.done;

      for (const notif of notifications) {
        if (new Date(notif.dueDate).getTime() > Date.now()) {
          await self.registration.sync.register(`task-notification-${notif.id}`);
        }
      }
    })()
  );
});

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