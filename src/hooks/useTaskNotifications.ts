import { useState, useEffect, useCallback } from 'react';

const NOTIFIED_TASKS_STORAGE_KEY = 'aurora-notified-tasks';

interface UseTaskNotificationsReturn {
  notificationPermission: NotificationPermission | null;
  requestNotificationPermission: () => Promise<NotificationPermission | null>;
  showNotification: (title: string, options?: NotificationOptions) => void;
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

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    console.log('[MobileNotifyDebug] showNotification called. Title:', title);
    if (!isNotificationSupported()) { // Also logs internally
        console.warn('[MobileNotifyDebug] showNotification: Notifications not supported.');
        return;
    }

    const currentPermission = Notification.permission; // Get the latest permission status
    setNotificationPermission(currentPermission); // Update state just in case
    console.log('[MobileNotifyDebug] showNotification: Current permission state:', currentPermission);

    if (currentPermission !== 'granted') {
      console.warn('[MobileNotifyDebug] showNotification: Cannot show notification - permission not granted.');
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: options?.body || 'You have a new notification.',
      icon: options?.icon || '/favicon.ico',
      tag: options?.tag,
      timestamp: options?.timestamp,
      ...options, // Spread other valid options
    };
    console.log('[MobileNotifyDebug] showNotification: Notification options:', notificationOptions);

    try {
      console.log('[MobileNotifyDebug] showNotification: Attempting new Notification(...)');
      // eslint-disable-next-line no-new
      const notification = new Notification(title, notificationOptions);
      notification.onclick = () => {
        console.log('[MobileNotifyDebug] Notification clicked.');
        // Optional: window.focus(); or specific app action
      };
      notification.onerror = (err) => {
        console.error('[MobileNotifyDebug] Notification error event:', err);
      };
      console.log('[MobileNotifyDebug] showNotification: new Notification(...) call succeeded.');
    } catch (error) {
      console.error('[MobileNotifyDebug] showNotification: Error creating notification:', error);
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
