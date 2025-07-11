
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Settings, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import useTaskNotifications from '@/hooks/useTaskNotifications';

const SmartNotifications = () => {
  const { 
    notificationPermission, 
    requestPermission, 
    showNotification 
  } = useTaskNotifications();
  
  const [notificationSettings, setNotificationSettings] = useState({
    oneHourBefore: true,
    fifteenMinBefore: true,
    fiveMinBefore: true,
    onDue: true,
    onOverdue: true
  });

  useEffect(() => {
    // Load notification settings from localStorage
    const savedSettings = localStorage.getItem('aurora-notification-settings');
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateNotificationSetting = (key: keyof typeof notificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    localStorage.setItem('aurora-notification-settings', JSON.stringify(newSettings));
  };

  const handleTestNotification = () => {
    showNotification('🧪 Test Notification', {
      body: 'This is a test notification from Aurora! Your notifications are working perfectly.',
      icon: '/favicon.ico',
      tag: 'test',
      requireInteraction: false
    });
  };

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return { text: 'Enabled', variant: 'default' as const, color: 'text-green-600' };
      case 'denied':
        return { text: 'Blocked', variant: 'destructive' as const, color: 'text-red-600' };
      default:
        return { text: 'Not Set', variant: 'secondary' as const, color: 'text-yellow-600' };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <Card className="hover-lift transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {notificationPermission === 'granted' ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-500" />
          )}
          Smart Notifications
        </CardTitle>
        <CardDescription>
          Get timely reminders for your tasks and deadlines
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
        
        {/* Permission Actions */}
        <div className="space-y-3">
          {notificationPermission === 'default' && (
            <Button 
              onClick={requestPermission} 
              className="w-full bg-purple-gradient hover:opacity-90 transition-all duration-300"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          )}
          
          {notificationPermission === 'granted' && (
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
          
          {notificationPermission === 'denied' && (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Notifications are blocked. To enable them:
              </p>
              <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                <p>1. Click the lock icon in your browser's address bar</p>
                <p>2. Change notifications to "Allow"</p>
                <p>3. Refresh the page</p>
              </div>
            </div>
          )}
        </div>

        {/* Information */}
        {notificationPermission === 'granted' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 You'll receive notifications at the times specified above for all your upcoming tasks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartNotifications;
