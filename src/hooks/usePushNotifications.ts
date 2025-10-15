import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

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

      // Get VAPID public key from environment
      const vapidPublicKey = 'BLnLJfq6t7DMUWLBusaWXsb2eP4f6eWgqlBiu9g-ZdfhfYn9tn9OO9GJa_ZyaJLss288SB-wQZVAJnCBOz3D3uA';

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

  const cancelAllScheduledNotifications = async () => {
    try {
      const { error } = await supabase.functions.invoke('cancel-all-notifications');
      if (error) throw error;
      console.log('All scheduled notifications have been cancelled.');
      return true;
    } catch (error) {
      console.error('Error cancelling scheduled notifications:', error);
      return false;
    }
  };

  const sendPushNotification = async (userId: string | string[], title: string, body: string, tag?: string, data?: any) => {
    try {
      const bodyPayload: { [key: string]: any } = { title, body, tag, data };
      if (Array.isArray(userId)) {
        bodyPayload.userIds = userId;
      } else {
        bodyPayload.userId = userId;
      }

      const { error } = await supabase.functions.invoke('send-push', {
        body: bodyPayload
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
        variant: 'destructive'
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
    cancelAllScheduledNotifications,
    sendPushNotification,
  };
};