
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOfflineNotifications } from '@/hooks/useOfflineNotifications';

export interface NotificationState {
  notificationPermission: NotificationPermission;
  requestPermission: () => Promise<void>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  checkTaskDueTimes: () => void;
  hasBeenNotified: (taskId: string) => boolean;
  markAsNotified: (taskId: string) => void;
  isSupported: boolean;
}

const useTaskNotifications = (): NotificationState => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();
  const { queueNotification } = useOfflineNotifications();

  const hasBeenNotified = useCallback((taskId: string) => {
    return notifiedTasks.has(taskId);
  }, [notifiedTasks]);

  const markAsNotified = useCallback((taskId: string) => {
    setNotifiedTasks(prev => new Set([...prev, taskId]));
  }, []);

  useEffect(() => {
    // Check if notifications are supported
    const checkSupport = () => {
      const hasNotificationAPI = 'Notification' in window;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      
      const supported = hasNotificationAPI && hasServiceWorker && hasPushManager;
      setIsSupported(supported);
      
      if (!hasNotificationAPI) {
        console.log('[useTaskNotifications] Browser notifications not supported, using toast notifications only');
      } else {
        console.log('[useTaskNotifications] Notifications supported');
      }
      
      return { supported, hasNotificationAPI, hasServiceWorker };
    };

    const { supported, hasNotificationAPI, hasServiceWorker } = checkSupport();

    if (hasNotificationAPI) {
      setNotificationPermission(Notification.permission);
    }
    
    // Register service worker regardless of notification API support
    if (hasServiceWorker) {
      navigator.serviceWorker.ready.then(() => {
        console.log('[useTaskNotifications] Service Worker is ready');
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          console.log('[useTaskNotifications] Notification clicked:', event.data);
          // Handle notification click - could navigate to tasks or show specific task
          window.focus();
        }
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('[useTaskNotifications] Notifications not supported on this device');
      return;
    }

    if (Notification.permission === 'default') {
      try {
        // For mobile Safari and other browsers that require user gesture
        const permission = await new Promise<NotificationPermission>((resolve) => {
          if (Notification.requestPermission.length === 1) {
            // Modern browsers
            Notification.requestPermission().then(resolve);
          } else {
            // Legacy browsers (Safari)
            Notification.requestPermission(resolve);
          }
        });

        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          console.log('[useTaskNotifications] Notification permission granted');
          
          // Show a welcome notification
          setTimeout(() => {
            showNotification('🎉 Notifications Enabled!', {
              body: 'You\'ll now receive timely reminders for your tasks.',
              icon: '/favicon.ico',
              tag: 'welcome',
              silent: false
            });
          }, 500); // Small delay to ensure permission is fully processed
        }
      } catch (error) {
        console.error('[useTaskNotifications] Error requesting permission:', error);
      }
    }
  }, [isSupported]);

  const triggerVibration = useCallback((pattern: number[]) => {
    // Check if device supports vibration and is mobile
    if ('vibrate' in navigator && navigator.userAgent.match(/Mobile|Android|iPhone|iPad/i)) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('[useTaskNotifications] Vibration not supported:', error);
      }
    }
  }, []);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions & { vibrationPattern?: number[] }) => {
    // Always show toast notification as primary feedback
    toast({
      title,
      description: options?.body as string || '',
    });

    // Use offline notification system for better reliability
    await queueNotification({
      title,
      body: options?.body as string || '',
      tag: options?.tag || `notification-${Date.now()}`,
      data: options?.data
    });

    // Trigger vibration if requested and supported
    if (options?.vibrationPattern && 'vibrate' in navigator) {
      navigator.vibrate(options.vibrationPattern);
    }
  }, [toast, queueNotification]);

  const checkTaskDueTimes = useCallback(() => {
    if (!isSupported || notificationPermission !== 'granted') {
      return;
    }

    try {
      const savedTasks = localStorage.getItem("aurora-tasks");
      if (!savedTasks) return;

      const tasks = JSON.parse(savedTasks);
      const now = new Date().getTime();
      
      tasks.forEach((task: any) => {
        if (task.completed || !task.dueDate) return;
        
        const dueDate = new Date(task.dueDate);
        if (task.dueTime) {
          const [hours, minutes] = task.dueTime.split(':').map(Number);
          dueDate.setHours(hours, minutes, 0, 0);
        } else {
          dueDate.setHours(23, 59, 59, 999);
        }
        
        const timeUntilDue = dueDate.getTime() - now;
        const minutesUntilDue = Math.floor(timeUntilDue / (1000 * 60));
        
        // Check for upcoming deadlines with mobile-friendly timing
        if (minutesUntilDue === 60 && !hasBeenNotified(`${task.id}-1hour`)) {
          showNotification('⏰ Task Due Soon', {
            body: `"${task.title}" is due in 1 hour`,
            tag: `task-${task.id}-1hour`,
            requireInteraction: true,
            vibrationPattern: [300, 100, 300]
          });
          markAsNotified(`${task.id}-1hour`);
        }

        if (minutesUntilDue === 15 && !hasBeenNotified(`${task.id}-15min`)) {
          showNotification('🚨 Task Due Soon', {
            body: `"${task.title}" is due in 15 minutes`,
            tag: `task-${task.id}-15min`,
            requireInteraction: true,
            vibrationPattern: [400, 100, 400, 100, 400]
          });
          markAsNotified(`${task.id}-15min`);
        }

        if (minutesUntilDue === 5 && !hasBeenNotified(`${task.id}-5min`)) {
          showNotification('🔥 Task Due Very Soon!', {
            body: `"${task.title}" is due in 5 minutes`,
            tag: `task-${task.id}-5min`,
            requireInteraction: true,
            vibrationPattern: [500, 200, 500, 200, 500]
          });
          markAsNotified(`${task.id}-5min`);
        }

        if (minutesUntilDue === 0 && !hasBeenNotified(`${task.id}-due`)) {
          showNotification('⚡ Task is Due Now!', {
            body: `"${task.title}" is due right now!`,
            tag: `task-${task.id}-due`,
            requireInteraction: true,
            vibrationPattern: [1000, 500, 1000]
          });
          markAsNotified(`${task.id}-due`);
        }

        // Overdue notification
        if (minutesUntilDue < 0 && !hasBeenNotified(`${task.id}-overdue`)) {
          showNotification('❌ Task Overdue!', {
            body: `"${task.title}" is overdue. Please complete it soon.`,
            tag: `task-${task.id}-overdue`,
            requireInteraction: true,
            vibrationPattern: [200, 100, 200, 100, 200, 100, 200]
          });
          markAsNotified(`${task.id}-overdue`);
        }
      });
    } catch (error) {
      console.error('[useTaskNotifications] Error checking task due times:', error);
    }
  }, [showNotification, hasBeenNotified, markAsNotified, isSupported, notificationPermission]);

  // Periodically check for due tasks with more frequent checks on mobile
  useEffect(() => {
    if (notificationPermission === 'granted' && isSupported) {
      // More frequent checks on mobile for better reliability
      const isMobile = navigator.userAgent.match(/Mobile|Android|iPhone|iPad/i);
      const interval = setInterval(checkTaskDueTimes, isMobile ? 30000 : 60000); // 30s on mobile, 60s on desktop
      return () => clearInterval(interval);
    }
  }, [notificationPermission, checkTaskDueTimes, isSupported]);

  return {
    notificationPermission,
    requestPermission,
    showNotification,
    checkTaskDueTimes,
    hasBeenNotified,
    markAsNotified,
    isSupported,
  };
};

export default useTaskNotifications;
