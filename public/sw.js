// public/sw.js

// Import Supabase
import { createClient } from '@supabase/supabase-js';

// PWA Manifest injection point - required for vite-plugin-pwa
const manifest = self.__WB_MANIFEST || [];

const CACHE_NAME = 'aurora-v1.5'; // Incremented cache name for new features

// Extract valid URLs from manifest
const manifestUrls = manifest
  .filter(entry => entry && typeof entry.url === 'string')
  .map(entry => entry.url);

const urlsToCache = [
  '/', // Cache the root HTML
  '/manifest.json', // Cache the manifest (ensure it exists)
  ...manifestUrls // Include valid PWA manifest URLs
];

// Initialize Supabase client in the service worker
const supabaseUrl = "https://ptglxbqaucefcjdewsrd.supabase.co"; // Replace with your Supabase URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z2x4YnFhdWNlZmNqZGV3c3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODk0NzgsImV4cCI6MjA2Njk2NTQ3OH0.4bZPcxklqAkXQHjfM7LQjr7mMad7nbKhPixDbtNAYWM"; // Replace with your Supabase anonymous key

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Enhanced Realtime notification handling for tasks
const setupRealtimeNotifications = () => {
  const channel = supabase
    .channel('sw-tasks-notifications')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'tasks' 
    }, (payload) => {
      console.log('[SW] Realtime change received:', payload);
      handleTaskNotification(payload);
    })
    .subscribe((status) => {
      console.log('[SW] Realtime subscription status:', status);
    });

  return channel;
};

const handleTaskNotification = (payload) => {
  const { eventType, new: newTask, old: oldTask } = payload;
  
  let notificationTitle = '';
  let notificationBody = '';
  let shouldNotify = false;

  switch (eventType) {
    case 'INSERT':
      notificationTitle = 'New Task Created';
      notificationBody = `"${newTask.title}" has been added to your tasks`;
      shouldNotify = true;
      break;
      
    case 'UPDATE':
      // Notify on completion
      if (!oldTask.completed && newTask.completed) {
        notificationTitle = 'Task Completed! 🎉';
        notificationBody = `"${newTask.title}" has been marked as completed`;
        shouldNotify = true;
      }
      // Notify on due date changes
      else if (oldTask.due_date !== newTask.due_date || oldTask.due_time !== newTask.due_time) {
        notificationTitle = 'Task Due Date Updated';
        notificationBody = `Due date for "${newTask.title}" has been updated`;
        shouldNotify = true;
      }
      // Notify on high priority tasks
      else if (newTask.priority === 'high' && oldTask.priority !== 'high') {
        notificationTitle = 'High Priority Task';
        notificationBody = `"${newTask.title}" has been marked as high priority`;
        shouldNotify = true;
      }
      break;

    case 'DELETE':
      notificationTitle = 'Task Deleted';
      notificationBody = `Task has been removed from your list`;
      shouldNotify = true;
      break;
  }

  if (shouldNotify) {
    const notificationOptions = {
      body: notificationBody,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `task-${newTask?.id || 'deleted'}`,
      requireInteraction: false,
      silent: false,
      data: {
        taskId: newTask?.id,
        url: self.location.origin + '/dashboard',
        timestamp: Date.now(),
        eventType
      },
      actions: eventType === 'INSERT' ? [
        {
          action: 'view',
          title: 'View Task',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ] : []
    };

    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[SW] Notification shown for task:', newTask?.id);
      })
      .catch(error => {
        console.error('[SW] Error showing notification:', error);
      });
  }
};

// Initialize realtime notifications
setupRealtimeNotifications();


self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker (v6 - PWA manifest fixes) installing.');
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
        console.log('[SW] Caching process completed (some files may have failed).');
      })
      .then(() => {
        console.log('[SW] Attempting skipWaiting().');
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

const DB_NAME = 'AuroraDB';
const DB_VERSION = 2;
const SCHEDULE_QUEUE_STORE = 'schedule_queue';

// --- IndexedDB Setup ---
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SCHEDULE_QUEUE_STORE)) {
        db.createObjectStore(SCHEDULE_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// --- Message Handling ---
self.addEventListener('message', async (event) => {
  if (!event.data || !event.data.type) {
    return;
  }

  // Handler for scheduling task-due notifications
  if (event.data.type === 'SCHEDULE_TASK_NOTIFICATION') {
    const { task, userId } = event.data;
    const request = { task, userId };

    // Prefer background sync for reliability
    if ('sync' in self.registration) {
      console.log(`[SW] Queuing schedule for task ${task.id} via Background Sync.`);
      await queueSchedulingRequest(request);
      try {
        await self.registration.sync.register('sync-notification-schedules');
        console.log('[SW] Registered background sync for schedule processing.');
      } catch (err) {
        console.error('[SW] Could not register background sync, attempting immediate send.', err);
        if (navigator.onLine) {
          await scheduleTaskNotification(task, userId);
        }
      }
    }
    // Fallback for browsers without Background Sync
    else if (navigator.onLine) {
      console.log(`[SW] Background Sync not supported. Attempting immediate schedule for task ${task.id}.`);
      await scheduleTaskNotification(task, userId);
    }
    // Offline without sync support
    else {
      console.warn(`[SW] Cannot schedule notification for task ${task.id}. User is offline and Background Sync is not supported.`);
    }
  }

  // Handler for showing immediate local notifications (like the test button)
  if (event.data.type === 'QUEUE_NOTIFICATION') {
    const { notification } = event.data;
    console.log('[SW] Received request to show immediate notification:', notification.title);
    await self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/favicon.ico',
      tag: notification.tag,
      data: notification.data
    });
  }
});

// --- Scheduling Queue Logic ---
const queueSchedulingRequest = async (request) => {
  try {
    const db = await openDB();
    const tx = db.transaction(SCHEDULE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SCHEDULE_QUEUE_STORE);
    const addRequest = store.add(request);

    await new Promise((resolve, reject) => {
      addRequest.onsuccess = () => {
        console.log(`[SW] Queued request for task ${request.task.id}`);
        resolve();
      };
      addRequest.onerror = (event) => {
        console.error(`[SW] Error queuing scheduling request for task ${request.task.id}:`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('[SW] General error in queueSchedulingRequest:', error);
  }
};

const processSchedulingQueue = async () => {
  console.log('[SW] Processing scheduling queue...');
  let db;
  try {
    db = await openDB();
    const tx = db.transaction(SCHEDULE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SCHEDULE_QUEUE_STORE);

    const getAllRequest = store.getAll();
    const requests = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    if (!requests || requests.length === 0) {
      console.log('[SW] Scheduling queue is empty.');
      return;
    }

    console.log(`[SW] Found ${requests.length} requests to process.`);

    for (const request of requests) {
      const { success } = await scheduleTaskNotification(request.task, request.userId);
      if (success) {
        const deleteRequest = store.delete(request.id);
        await new Promise((resolve, reject) => {
          deleteRequest.onsuccess = () => {
            console.log(`[SW] Successfully processed and removed schedule for task ${request.task.id}.`);
            resolve();
          };
          deleteRequest.onerror = (event) => {
            console.error(`[SW] Failed to remove schedule for task ${request.task.id} from queue:`, event.target.error);
            reject(event.target.error);
          };
        });
      } else {
        console.warn(`[SW] Failed to process schedule for task ${request.task.id}. It will be retried on next sync.`);
      }
    }
  } catch (error) {
    console.error('[SW] Error processing scheduling queue:', error);
  } finally {
    if (db) db.close();
  }
};

const scheduleTaskNotification = async (task, userId) => {
  const now = new Date().getTime();
  const dueDate = new Date(task.dueDate);
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    dueDate.setHours(hours, minutes, 0, 0);
  } else {
    dueDate.setHours(23, 59, 59, 999);
  }

  const timeUntilDue = dueDate.getTime() - now;

  if (timeUntilDue > 0) {
    const notificationTime = dueDate.getTime();
    console.log(`[SW] Scheduling notification for task ${task.id} at ${new Date(notificationTime).toISOString()}`);

    try {
      const response = await fetch('/api/task-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task_due',
          taskData: task,
          userId: userId,
          notificationTime: new Date(notificationTime).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`[SW] Server responded with ${response.status}`);
      }

      console.log(`[SW] Backend accepted schedule for task ${task.id}`);
      return { success: true };

    } catch (error) {
      console.error(`[SW] Failed to send scheduling request for task ${task.id}:`, error);
      return { success: false };
    }
  } else {
    console.log(`[SW] Task ${task.id} is already past due. No notification will be scheduled.`);
    return { success: true }; // Mark as success to remove from queue
  }
};

// --- Background Sync ---
self.addEventListener('sync', (event) => {
  console.log(`[SW] Background sync event: ${event.tag}`);
  if (event.tag === 'sync-notification-schedules') {
    event.waitUntil(processSchedulingQueue());
  }
});

// Enhanced notification display handler
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    console.log('[SW] Showing notification:', event.data.title);
    
    try {
      await self.registration.showNotification(event.data.title, {
        body: event.data.body,
        icon: event.data.options?.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: event.data.options?.tag || `notification-${Date.now()}`,
        requireInteraction: false,
        silent: false,
        vibrate: event.data.options?.vibrationPattern || [200, 100, 200],
        data: event.data.options?.data || {},
        actions: event.data.options?.actions || []
      });
      
      console.log('[SW] Notification shown successfully');
    } catch (error) {
      console.error('[SW] Failed to show notification:', error);
    }
  }
});

// Add notification close handler for mobile
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  // Track notification dismissals if needed
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  const options = {
    body: 'You have a new task notification.', // Default message
    icon: '/favicon.ico', // Default icon
    vibrate: [200, 100, 200], // Default vibration pattern
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[SW] Push data:', data);

      // Customize notification based on push data
      options.body = data.body || options.body;
      options.title = data.title || 'New Notification'; // Add title from data
      options.icon = data.icon || options.icon;
      options.image = data.image; // Add image support
      options.tag = data.tag; // Add tag support for grouping/replacing
      options.url = data.url; // Add URL for notification click
    } catch (e) {
      console.error('[SW] Failed to parse push data:', e);
      options.body = 'You have a new notification.'; // Fallback message
    }
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'New Notification', options)
  );
});


console.log('[SW] Service Worker script (v5 - mobile notification fixes) loaded and parsed.');