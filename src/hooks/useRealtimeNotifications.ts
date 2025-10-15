import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  user_id: string;
}

export const useRealtimeNotifications = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Request notification permission
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };

    requestNotificationPermission();

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('tasks-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Realtime change received:', payload);
          handleTaskChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    const showNotification = (title: string, body: string, task: Task) => {
      // Show toast notification
      toast({
        title,
        description: body,
      });

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `task-${task.id}`,
          requireInteraction: false,
          silent: false,
        });

        // Trigger vibration on mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        // Close notification after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    };

    const handleTaskChange = (payload: any) => {
      const { eventType, new: newTask, old: oldTask } = payload;

      // Show notification based on event type
      if (eventType === 'INSERT') {
        const task = newTask as Task;
        showNotification(
          'New Task Created',
          `"${task.title}" has been added to your tasks`,
          task
        );
      } else if (eventType === 'UPDATE') {
        const task = newTask as Task;
        const oldTaskData = oldTask as Task;

        // Check if task was marked as completed
        if (!oldTaskData.completed && task.completed) {
          showNotification(
            'Task Completed',
            `"${task.title}" has been marked as completed! 🎉`,
            task
          );
        }
        // Check if due date was updated
        else if (oldTaskData.due_date !== task.due_date || oldTaskData.due_time !== task.due_time) {
          showNotification(
            'Task Updated',
            `Due date for "${task.title}" has been updated`,
            task
          );
        }
      }
    };

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { isConnected };
};