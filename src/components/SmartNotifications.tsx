import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Settings, Clock, Smartphone, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/App';
import { useToast } from '@/hooks/use-toast';

const SmartNotifications = () => {
  const {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendPushNotification
  } = usePushNotifications();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notificationSettings, setNotificationSettings] = useState({
    oneHourBefore: true,
    thirtyMinBefore: true,
    fifteenMinBefore: true,
    fiveMinBefore: true,
    onDue: true,
    onOverdue: true
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(navigator.userAgent.match(/Mobile|Android|iPhone|iPad/i) !== null);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Load notification settings from localStorage
    const savedSettings = localStorage.getItem('aurora-notification-settings');
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateNotificationSetting = (key: keyof typeof notificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    localStorage.setItem('aurora-notification-settings', JSON.stringify(newSettings));
  };

  const handleTestNotification = async () => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to send a test notification.',
        variant: 'destructive',
      });
      return;
    }

    if (!isSubscribed) {
      toast({
        title: 'Not Subscribed',
        description: 'Please enable push notifications first.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sending Test Notification...',
      description: 'Please wait a moment.',
    });

    const success = await sendPushNotification(
      user.id,
      '🧪 Test Push Notification',
      'This is a real push notification from Aurora! It works!',
      'test-push',
      { type: 'test' }
    );

    if (success) {
      toast({
        title: 'Test Notification Sent!',
        description: 'You should receive a push notification shortly.',
      });
    } else {
      toast({
        title: 'Failed to Send',
        description: 'Could not send test notification. Please check your connection or subscription status.',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async () => {
    if (!isSubscribed) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  const getPermissionStatus = () => {
    if (!isSupported) {
      return { text: 'Not Supported', variant: 'destructive' as const, color: 'text-red-600' };
    }
    
    if (isSubscribed) {
      return { text: 'Enabled', variant: 'default' as const, color: 'text-green-600' };
    }
    
    const permission = Notification.permission;
    if (permission === 'denied') {
      return { text: 'Blocked', variant: 'destructive' as const, color: 'text-red-600' };
    }
    
    return { text: 'Not Set', variant: 'secondary' as const, color: 'text-yellow-600' };
  };

  const permissionStatus = getPermissionStatus();

  if (!isSupported) {
    return (
      <Card className="hover-lift transition-all duration-300 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertTriangle className="h-5 w-5" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription className="text-orange-600 dark:text-orange-400">
            Your browser or device doesn't support web notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-orange-700 dark:text-orange-300">
            <p>To enable notifications, try:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Update your browser to the latest version</li>
              <li>Enable JavaScript if disabled</li>
              <li>Try a different browser (Chrome, Firefox, Safari)</li>
              {isMobile && <li>Add this site to your home screen</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-500" />
          )}
          Push Notifications
          {isMobile && <Smartphone className="h-4 w-4 text-blue-500" />}
        </CardTitle>
        <CardDescription>
          Get timely reminders for your tasks and deadlines
          {isMobile && " (Mobile optimized)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Status:</span>
          </div>
          <Badge variant={permissionStatus.variant} className="font-medium">
            {permissionStatus.text}
          </Badge>
        </div>
        
        {/* Push Notification Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed 
                  ? 'Enabled' 
                  : Notification.permission === 'denied'
                  ? 'Blocked - Please enable in browser settings'
                  : 'Click to enable'}
              </p>
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={!isSupported || Notification.permission === 'denied'}
          />
        </div>
        
        {/* Mobile-specific info */}
        {isMobile && !isSubscribed && Notification.permission !== 'denied' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Smartphone className="h-3 w-3" />
              On mobile, you may need to interact with the page first, then enable notifications.
            </p>
          </div>
        )}
        
        {/* Permission Actions */}
        {isSubscribed && (
          <div className="space-y-3">
            <Button 
              onClick={handleTestNotification} 
              variant="outline" 
              className="w-full hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300"
            >
              <Bell className="h-4 w-4 mr-2" />
              Test Notification
            </Button>
            
            {/* Notification Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Notification Timing
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    1 hour before due
                  </label>
                  <Switch
                    checked={notificationSettings.oneHourBefore}
                    onCheckedChange={(checked) => updateNotificationSetting('oneHourBefore', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    30 minutes before due
                  </label>
                  <Switch
                    checked={notificationSettings.thirtyMinBefore}
                    onCheckedChange={(checked) => updateNotificationSetting('thirtyMinBefore', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    15 minutes before due
                  </label>
                  <Switch
                    checked={notificationSettings.fifteenMinBefore}
                    onCheckedChange={(checked) => updateNotificationSetting('fifteenMinBefore', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    5 minutes before due
                  </label>
                  <Switch
                    checked={notificationSettings.fiveMinBefore}
                    onCheckedChange={(checked) => updateNotificationSetting('fiveMinBefore', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    When task is due
                  </label>
                  <Switch
                    checked={notificationSettings.onDue}
                    onCheckedChange={(checked) => updateNotificationSetting('onDue', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    When task is overdue
                  </label>
                  <Switch
                    checked={notificationSettings.onOverdue}
                    onCheckedChange={(checked) => updateNotificationSetting('onOverdue', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {Notification.permission === 'denied' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Notifications are blocked. To enable them:
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
              {isMobile ? (
                <>
                  <p>1. Open your browser settings</p>
                  <p>2. Find "Site Settings" or "Permissions"</p>
                  <p>3. Allow notifications for this site</p>
                  <p>4. Refresh the page</p>
                </>
              ) : (
                <>
                  <p>1. Click the lock icon in your browser's address bar</p>
                  <p>2. Change notifications to "Allow"</p>
                  <p>3. Refresh the page</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Information */}
        {isSubscribed && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
              💡 You'll receive push notifications at the times specified above for all your upcoming tasks.
              {isMobile && " Vibration patterns are enabled for mobile devices."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartNotifications;
