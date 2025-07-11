
import { useState, useEffect, useCallback } from 'react';

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

  const hasBeenNotified = useCallback((taskId: string) => {
    return notifiedTasks.has(taskId);
  }, [notifiedTasks]);

  const markAsNotified = useCallback((taskId: string) => {
    setNotifiedTasks(prev => new Set([...prev, taskId]));
  }, []);

  useEffect(() => {
    // Check if notifications are supported
    const checkSupport = () => {
      const supported = 'Notification' in window && 
                       'serviceWorker' in navigator && 
                       'PushManager' in window;
      setIsSupported(supported);
      return supported;
    };

    if (checkSupport()) {
      setNotificationPermission(Notification.permission);
      
      // Register service worker and listen for messages
      if ('serviceWorker' in navigator) {
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

  const showNotification = useCallback((title: string, options?: NotificationOptions & { vibrationPattern?: number[] }) => {
    if (!isSupported) {
      console.warn('[useTaskNotifications] Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[useTaskNotifications] Notification permission not granted');
      return;
    }

    try {
      // Extract vibration pattern if provided
      const { vibrationPattern, ...notificationOptions } = options || {};
      
      const finalOptions: NotificationOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        silent: false,
        ...notificationOptions
      };

      // Trigger vibration if pattern is provided
      if (vibrationPattern) {
        triggerVibration(vibrationPattern);
      }

      // Use service worker for better mobile support
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: finalOptions
        });
      } else {
        // Fallback to direct notification
        const notification = new Notification(title, finalOptions);

        // Handle notification click
        notification.onclick = function(event) {
          event.preventDefault();
          window.focus();
          notification.close();
        };

        // Auto-close notification after 8 seconds on desktop (mobile handles this automatically)
        if (!finalOptions?.requireInteraction && !navigator.userAgent.match(/Mobile|Android|iPhone|iPad/i)) {
          setTimeout(() => {
            notification.close();
          }, 8000);
        }
      }

      console.log('[useTaskNotifications] Notification sent:', title);
    } catch (error) {
      console.error('[useTaskNotifications] Error showing notification:', error);
    }
  }, [isSupported, triggerVibration]);

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
