import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

class NotificationService {
  private async urlBase64ToUint8Array(base64String: string): Promise<Uint8Array> {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  public async requestPermissionAndSubscribe(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('No existing subscription found, creating new one...');
        const applicationServerKey = await this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      } else {
        console.log('Existing subscription found.');
      }

      await this.saveSubscription(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('push-subscribe', {
        body: { subscription },
      });
      if (error) throw error;
      console.log('Successfully saved push subscription.');
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }
}

export const notificationService = new NotificationService();