import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QueuedNotification {
  id?: number;
  title: string;
  body: string;
  tag?: string;
  data?: any;
  timestamp: number;
}

export const useOfflineNotifications = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState('default');

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      } else {
        console.log('Notification permission denied.');
      }
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    const handleOnline = async () => {
      setIsOnline(true);
      
      // Register background sync when coming online
      if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await (registration as any).sync.register('process-notifications');
          console.log('[useOfflineNotifications] Background sync registered for notifications');
        } catch (error) {
          console.error('[useOfflineNotifications] Background sync registration failed:', error);
        }
      }
      
      // Update queued count
      updateQueuedCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Notifications will be queued and delivered when you're back online",
      });
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial setup
    updateQueuedCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const updateQueuedCount = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['notifications'], 'readonly');
      const store = transaction.objectStore('notifications');
      const countRequest = store.count();
      countRequest.onsuccess = () => setQueuedCount(countRequest.result);
    } catch (error) {
      console.error('[useOfflineNotifications] Failed to get queued count:', error);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NotificationQueue', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  const queueNotification = async (notification: Omit<QueuedNotification, 'id' | 'timestamp'>) => {
    if ('serviceWorker' in navigator) {
      // Always try service worker first for better PWA experience
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: notification.title,
            body: notification.body,
            options: {
              tag: notification.tag,
              data: notification.data,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              requireInteraction: false,
              silent: false
            }
          });
          console.log('[useOfflineNotifications] Notification sent to service worker');
          return;
        }
      } catch (error) {
        console.error('[useOfflineNotifications] Failed to send notification to service worker:', error);
      }
    }
    
    // Fallback: queue in IndexedDB if service worker fails or offline
    if (!isOnline) {
      // Queue in IndexedDB for offline delivery
      try {
        const db = await openDB();
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        await store.add({
          ...notification,
          timestamp: Date.now()
        });
        
        await updateQueuedCount();
        
        // Show toast as fallback
        toast({
          title: notification.title,
          description: notification.body,
        });
        
        console.log('[useOfflineNotifications] Notification queued for offline delivery');
      } catch (error) {
        console.error('[useOfflineNotifications] Failed to queue notification:', error);
        
        // Fallback to toast only
        toast({
          title: notification.title,
          description: notification.body,
        });
      }
    } else {
      // Online but service worker failed - show browser notification directly
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/favicon.ico',
            tag: notification.tag,
            data: notification.data,
            silent: false
          });
          console.log('[useOfflineNotifications] Showed direct browser notification');
        } else {
          // No notification permission, show toast
          toast({
            title: notification.title,
            description: notification.body,
          });
        }
      } catch (error) {
        console.error('[useOfflineNotifications] Failed to show direct notification:', error);
        toast({
          title: notification.title,
          description: notification.body,
        });
      }
    }
  };

  const clearQueue = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      await store.clear();
      setQueuedCount(0);
      console.log('[useOfflineNotifications] Notification queue cleared');
    } catch (error) {
      console.error('[useOfflineNotifications] Failed to clear queue:', error);
    }
  };

  return {
    isOnline,
    queuedCount,
    queueNotification,
    clearQueue,
    updateQueuedCount,
    requestNotificationPermission,
    notificationPermission
  };
};