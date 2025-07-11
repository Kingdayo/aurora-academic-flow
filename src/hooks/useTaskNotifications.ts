import { useState, useEffect, useCallback } from 'react';

const NOTIFIED_TASKS_STORAGE_KEY = 'aurora-notified-tasks';

interface UseTaskNotificationsReturn {
  notificationPermission: NotificationPermission | null;
  requestNotificationPermission: () => Promise<NotificationPermission | null>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>; // Changed to Promise<void>
  markAsNotified: (taskId: string) => void;
  hasBeenNotified: (taskId: string) => boolean;
  isNotificationSupported: () => boolean;
}

const useTaskNotifications = (): UseTaskNotificationsReturn => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return null;
  });

  useEffect(() => {
    const updatePermission = () => {
      if (isNotificationSupported()) {
        setNotificationPermission(Notification.permission);
      }
    };
    // Browsers might have UIs to change permission outside of requestPermission()
    // However, there isn't a standard event for permission changes.
    // Re-checking on visibility change can be a simple way to catch some cases.
    document.addEventListener('visibilitychange', updatePermission);
    // Initial check
    updatePermission();
    return () => {
      document.removeEventListener('visibilitychange', updatePermission);
    };
  }, []);

  const isNotificationSupported = useCallback((): boolean => {
    const supported = typeof window !== 'undefined' && 'Notification' in window;
    console.log('[MobileNotifyDebug] isNotificationSupported check:', supported);
    return supported;
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission | null> => {
    console.log('[MobileNotifyDebug] requestNotificationPermission called.');
    if (!isNotificationSupported()) { // Also logs internally
      console.warn('[MobileNotifyDebug] Notifications not supported by this browser.');
      return null;
    }

    const currentPermission = Notification.permission;
    console.log('[MobileNotifyDebug] Permission state before request:', currentPermission);
    setNotificationPermission(currentPermission); // Ensure state is up-to-date

    if (currentPermission === 'granted') {
      console.log('[MobileNotifyDebug] Permission already granted.');
      return 'granted';
    }

    if (currentPermission === 'denied') {
      console.warn('[MobileNotifyDebug] Notification permission has been permanently denied by the user. Cannot re-request programmatically.');
      return 'denied';
    }

    // Only if 'default', proceed to request
    if (currentPermission === 'default') {
      try {
        console.log('[MobileNotifyDebug] Calling Notification.requestPermission().');
        const permissionResult = await Notification.requestPermission();
        console.log('[MobileNotifyDebug] Permission state after request:', permissionResult);
        setNotificationPermission(permissionResult);
        return permissionResult;
      } catch (error) {
        console.error('[MobileNotifyDebug] Error requesting notification permission:', error);
        // In some browsers, if the promise rejects, it means denied or another issue.
        // Update state based on current actual permission.
        const finalPermission = Notification.permission;
        setNotificationPermission(finalPermission);
        console.log('[MobileNotifyDebug] Permission state after error in request:', finalPermission);
        return finalPermission;
      }
    }
    return currentPermission; // Should be 'default' if we reached here without requesting.
  }, [isNotificationSupported]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions): Promise<void> => {
    console.log('[MobileNotifyDebug] showNotification called. Title:', title);
    if (!isNotificationSupported()) {
      console.warn('[MobileNotifyDebug] showNotification: Notifications not supported (isNotificationSupported check).');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      console.warn('[MobileNotifyDebug] showNotification: Service Worker not supported in navigator.');
      // Fallback or alternative for non-SW environments if desired, though the error indicates SW is required.
      // For now, we'll just not show a notification if SW isn't available, as the error implies it's mandatory.
      return;
    }

    const currentPermission = Notification.permission;
    setNotificationPermission(currentPermission);
    console.log('[MobileNotifyDebug] showNotification: Current permission state:', currentPermission);

    if (currentPermission !== 'granted') {
      console.warn('[MobileNotifyDebug] showNotification: Cannot show notification - permission not granted.');
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: options?.body || 'You have a new notification.',
      icon: options?.icon || '/favicon.ico',
      tag: options?.tag,
      // data: options?.data, // Pass through any custom data
      ...options,
    };
    console.log('[MobileNotifyDebug] showNotification: Notification options:', notificationOptions);

    try {
      console.log('[MobileNotifyDebug] showNotification: Waiting for service worker registration to be ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[MobileNotifyDebug] showNotification: Service worker registration ready. Attempting registration.showNotification(...).');
      await registration.showNotification(title, notificationOptions);
      console.log('[MobileNotifyDebug] showNotification: registration.showNotification(...) call succeeded.');
    } catch (error) {
      console.error('[MobileNotifyDebug] showNotification: Error displaying notification via Service Worker:', error);
      // Log the error that was specifically indicated by the user
      if (error instanceof TypeError && error.message.includes("Illegal constructor")) {
        console.error('[MobileNotifyDebug] Confirmed: TypeError related to constructor. SW method should be preferred.');
      }
    }
  }, [isNotificationSupported]);

  const getNotifiedTasks = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem(NOTIFIED_TASKS_STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[MobileNotifyDebug] Error reading notified tasks from localStorage:', error);
    }
    return new Set();
  }, []);

  const markAsNotified = useCallback((taskId: string) => {
    const notifiedTasks = getNotifiedTasks();
    notifiedTasks.add(taskId);
    try {
      localStorage.setItem(NOTIFIED_TASKS_STORAGE_KEY, JSON.stringify(Array.from(notifiedTasks)));
      console.log(`[MobileNotifyDebug] Task ${taskId} marked as notified.`);
    } catch (error) {
      console.error('[MobileNotifyDebug] Error saving notified tasks to localStorage:', error);
    }
  }, [getNotifiedTasks]);

  const hasBeenNotified = useCallback((taskId: string): boolean => {
    const result = getNotifiedTasks().has(taskId);
    // console.log(`[MobileNotifyDebug] hasBeenNotified check for ${taskId}:`, result); // Potentially too noisy
    return result;
  }, [getNotifiedTasks]);


  return {
    notificationPermission,
    requestNotificationPermission,
    showNotification,
    markAsNotified,
    hasBeenNotified,
    isNotificationSupported,
  };
};

export default useTaskNotifications;
