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

    if (supported) {
      checkSubscriptionStatus();

      // Periodically refresh subscription
      const interval = setInterval(refreshSubscription, 24 * 60 * 60 * 1000); // every 24 hours
      return () => clearInterval(interval);
    }
  }, []);

  const refreshSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Here you could potentially send the subscription to your server again
        // to ensure it's up-to-date, but for now, we'll just log it.
        console.log('Push subscription refreshed.');
      } else {
        // If subscription is gone, update state
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error refreshing push subscription:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const isSubscribed = !!subscription;
      setIsSubscribed(isSubscribed);

      if (!isSubscribed) {
        const permission = await Notification.requestPermission();
        if (permission === 'prompt') {
            toast({
                title: "Enable Task Reminders?",
                description: "Get push notifications so you never miss a deadline.",
                action: React.createElement(
                    'button',
                    {
                        onClick: subscribe,
                        className: "px-3 py-1.5 text-sm font-semibold rounded-md bg-primary text-primary-foreground"
                    },
                    'Enable'
                ),
            });
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      toast({
        title: "Push Notification Error",
        description: "Could not check subscription status.",
        variant: "destructive",
      });
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

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
};
