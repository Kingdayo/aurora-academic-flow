
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
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
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
