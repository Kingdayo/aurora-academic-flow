import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

class NotificationService {
  private async urlBase64ToUint8Array(base64String: string): Promise<Uint8Array | null> {
    if (!base64String) {
      console.error("VAPID public key is not defined. Push notifications will not work.");
      return null;
    }
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

  public async requestPermissionAndSubscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted.');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('No existing subscription found, creating new one...');
        const applicationServerKey = await this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        if (!applicationServerKey) {
          return false;
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      } else {
        console.log('Existing subscription found.');
      }

      return await this.saveSubscription(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  private async saveSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('push-subscribe', {
        body: { subscription },
      });
      if (error) throw error;
      console.log('Successfully saved push subscription.');
      return true;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();