// public/sw.js

// Import Supabase
import { createClient } from '@supabase/supabase-js';

// PWA Manifest injection point - required for vite-plugin-pwa
const manifest = self.__WB_MANIFEST;

const CACHE_NAME = 'aurora-v1.4'; // Incremented cache name for PWA fixes
const urlsToCache = [
  '/', // Cache the root HTML
  '/manifest.json', // Cache the manifest (ensure it exists)
  ...manifest // Include PWA manifest files
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