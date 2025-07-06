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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission(null); // Indicates not supported
    }
  }, []);

  const isNotificationSupported = useCallback(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission | null> => {
    if (!isNotificationSupported()) {
      console.warn('Notifications not supported by this browser.');
      return null;
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission has been denied by the user.');
      setNotificationPermission('denied');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      // In some browsers, if the promise rejects, it means denied.
      // However, it's safer to rely on Notification.permission after the call.
      setNotificationPermission(Notification.permission);
      return Notification.permission;
    }
  }, [isNotificationSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
      console.log('Cannot show notification: Not supported or permission not granted.', Notification.permission);
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: options?.body || 'Your task is due!',
      icon: options?.icon || '/favicon.ico', // Default to app favicon
      tag: options?.tag,
      ...options,
    };

    try {
      // eslint-disable-next-line no-new
      new Notification(title, notificationOptions);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isNotificationSupported]);

  const getNotifiedTasks = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem(NOTIFIED_TASKS_STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error reading notified tasks from localStorage:', error);
    }
    return new Set();
  }, []);

  const markAsNotified = useCallback((taskId: string) => {
    const notifiedTasks = getNotifiedTasks();
    notifiedTasks.add(taskId);
    try {
      localStorage.setItem(NOTIFIED_TASKS_STORAGE_KEY, JSON.stringify(Array.from(notifiedTasks)));
    } catch (error) {
      console.error('Error saving notified tasks to localStorage:', error);
    }
  }, [getNotifiedTasks]);

  const hasBeenNotified = useCallback((taskId: string): boolean => {
    return getNotifiedTasks().has(taskId);
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
