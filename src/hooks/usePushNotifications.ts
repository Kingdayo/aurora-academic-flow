import { useState, useEffect } from 'react';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
  }, []);

  const subscribe = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications to receive task reminders",
          variant: "destructive",
        });
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from environment variable
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Send subscription to our backend
      const { error } = await supabase.functions.invoke('push-subscribe', {
        body: { subscription }
      });

      if (error) {
        throw error;
      }

      setIsSubscribed(true);
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive task reminders even when the app is closed",
      });

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable push notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return;

    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        
        toast({
          title: "Notifications Disabled",
          description: "You will no longer receive push notifications",
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotification = async (taskId: string, title: string, body: string, sendAt: Date) => {
    try {
      const { error } = await supabase.functions.invoke('schedule-notification', {
        body: {
          taskId,
          title,
          body,
          sendAt: sendAt.toISOString(),
          tag: `task-${taskId}`,
          data: { taskId }
        }
      });

      if (error) {
        throw error;
      }

      console.log(`Notification scheduled for task ${taskId} at ${sendAt}`);
      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  };

  const cancelNotification = async (taskId: string) => {
    try {
      const { error } = await supabase.functions.invoke('cancel-notification', {
        body: {
          taskId,
        }
      });

      if (error) {
        throw error;
      }

      console.log(`Notification cancelled for task ${taskId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  };

  const sendPushNotification = async (userId: string | string[], title: string, body: string, tag?: string, data?: any) => {
    try {
        const { taskId, type, taskTitle, taskDescription, taskDueDate } = data || {};
        const notificationPayload = {
            title,
            body,
            tag,
            data: {
                url: `/tasks/${taskId}`,
                taskId,
                notification_type: type,
                taskTitle,
                taskDescription,
                taskDueDate,
            },
        };

        const bodyPayload: { [key: string]: any } = { ...notificationPayload };
        if (Array.isArray(userId)) {
            bodyPayload.userIds = userId;
        } else {
            bodyPayload.userId = userId;
        }

        const { error } = await supabase.functions.invoke('send-push', {
            body: bodyPayload,
        });

        if (error) {
            throw new Error(error.message);
        }

        console.log('Push notification sent successfully.');
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        toast({
            title: 'Notification Error',
            description: 'Failed to send push notification. Please check your connection and try again.',
            variant: 'destructive',
        });
        return false;
    }
};

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    scheduleNotification,
    cancelNotification,
    sendPushNotification,
  };
};