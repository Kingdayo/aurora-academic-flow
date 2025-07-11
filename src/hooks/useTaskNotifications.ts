import { useState, useEffect, useCallback, useRef } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  completed: boolean;
}

const useTaskNotifications = () => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [hasBeenNotified, setHasBeenNotified] = useState<Set<string>>(new Set());
  const lastCheckRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const requestPermission = useCallback(async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (notificationPermission !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return;
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        }).catch(error => {
          console.error('[Notifications] Service Worker notification failed, falling back to direct notification:', error);
          new Notification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.error('[Notifications] Error showing notification:', error);
    }
  }, [notificationPermission]);

  const markAsNotified = useCallback((taskId: string) => {
    setHasBeenNotified(prev => new Set([...prev, taskId]));
    
    // Store in localStorage for persistence
    try {
      const stored = localStorage.getItem('notifiedTasks');
      const notified = stored ? JSON.parse(stored) : [];
      if (!notified.includes(taskId)) {
        notified.push(taskId);
        localStorage.setItem('notifiedTasks', JSON.stringify(notified));
      }
    } catch (error) {
      console.error('[Notifications] Error storing notification state:', error);
    }
  }, []);

  // Load previously notified tasks on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notifiedTasks');
      if (stored) {
        const notified = JSON.parse(stored);
        setHasBeenNotified(new Set(notified));
      }
    } catch (error) {
      console.error('[Notifications] Error loading notification state:', error);
    }
  }, []);

  const checkTaskDueTimes = useCallback(() => {
    const now = Date.now();
    
    // Only check every 30 seconds to reduce console spam
    if (now - lastCheckRef.current < 30000) {
      return;
    }
    
    lastCheckRef.current = now;

    if (notificationPermission !== 'granted') {
      return;
    }

    console.log(`[${new Date().toISOString()}] Checking task due times. Permission: ${notificationPermission}`);

    try {
      const storedTasks = localStorage.getItem('tasks');
      if (!storedTasks) return;

      const tasks = JSON.parse(storedTasks);
      const currentTime = new Date();

      tasks.forEach((task: any) => {
        if (task.completed || hasBeenNotified.has(task.id)) {
          return; // Skip completed tasks or already notified tasks
        }

        if (task.dueDate && task.dueTime) {
          const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
          
          // Check if task is due (within 1 minute tolerance)
          const timeDiff = dueDateTime.getTime() - currentTime.getTime();
          
          if (timeDiff <= 60000 && timeDiff >= -60000) { // Within 1 minute window
            console.log(`[TaskNotification] Task "${task.title}" is due, showing notification`);
            
            showNotification(`Task Due: ${task.title}`, {
              body: task.description || `Your task "${task.title}" is now due.`,
              tag: `task-${task.id}`,
            });
            
            markAsNotified(task.id);
          }
        }
      });
    } catch (error) {
      console.error('[Notifications] Error checking task due times:', error);
    }
  }, [notificationPermission, showNotification, hasBeenNotified, markAsNotified]);

  // Set up periodic checking
  useEffect(() => {
    if (notificationPermission === 'granted') {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Check immediately
      checkTaskDueTimes();
      
      // Then check every 30 seconds
      intervalRef.current = setInterval(checkTaskDueTimes, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [notificationPermission, checkTaskDueTimes]);

  return {
    notificationPermission,
    requestPermission,
    showNotification,
    checkTaskDueTimes,
    hasBeenNotified: (taskId: string) => hasBeenNotified.has(taskId),
    markAsNotified
  };
};

export default useTaskNotifications;
