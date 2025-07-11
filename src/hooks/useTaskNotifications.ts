
import { useState, useEffect, useCallback } from 'react';

export interface NotificationState {
  notificationPermission: NotificationPermission;
  requestPermission: () => Promise<void>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  checkTaskDueTimes: () => void;
  hasBeenNotified: (taskId: string) => boolean;
  markAsNotified: (taskId: string) => void;
}

const useTaskNotifications = (): NotificationState => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Listen for service worker messages about notification clicks
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
            console.log('[useTaskNotifications] Notification clicked:', event.data);
            // Handle notification click - could navigate to tasks or show specific task
          }
        });
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          console.log('[useTaskNotifications] Notification permission granted');
          
          // Show a welcome notification
          showNotification('🎉 Notifications Enabled!', {
            body: 'You\'ll now receive timely reminders for your tasks.',
            icon: '/favicon.ico',
            tag: 'welcome'
          });
        }
      } catch (error) {
        console.error('[useTaskNotifications] Error requesting permission:', error);
      }
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.warn('[useTaskNotifications] Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[useTaskNotifications] Notification permission not granted');
      return;
    }

    try {
      // Use service worker if available for better notification handling
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
            ...options
          }
        });
      } else {
        // Fallback to direct notification
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: false,
          ...options
        });

        // Auto-close notification after 5 seconds if not requiring interaction
        if (!options?.requireInteraction) {
          setTimeout(() => {
            notification.close();
          }, 5000);
        }
      }
    } catch (error) {
      console.error('[useTaskNotifications] Error showing notification:', error);
    }
  }, []);

  const hasBeenNotified = useCallback((taskId: string) => {
    return notifiedTasks.has(taskId);
  }, [notifiedTasks]);

  const markAsNotified = useCallback((taskId: string) => {
    setNotifiedTasks(prev => new Set([...prev, taskId]));
  }, []);

  const checkTaskDueTimes = useCallback(() => {
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
        
        // Check for upcoming deadlines
        if (minutesUntilDue === 60 && !hasBeenNotified(`${task.id}-1hour`)) {
          showNotification('⏰ Task Due Soon', {
            body: `"${task.title}" is due in 1 hour`,
            tag: `task-${task.id}-1hour`
          });
          markAsNotified(`${task.id}-1hour`);
        }
      });
    } catch (error) {
      console.error('[useTaskNotifications] Error checking task due times:', error);
    }
  }, [showNotification, hasBeenNotified, markAsNotified]);

  // Periodically check for due tasks
  useEffect(() => {
    if (notificationPermission === 'granted') {
      const interval = setInterval(checkTaskDueTimes, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [notificationPermission, checkTaskDueTimes]);

  return {
    notificationPermission,
    requestPermission,
    showNotification,
    checkTaskDueTimes,
    hasBeenNotified,
    markAsNotified,
  };
};

export default useTaskNotifications;
