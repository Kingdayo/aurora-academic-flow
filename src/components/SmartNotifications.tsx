
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff } from 'lucide-react';
import useTaskNotifications from '@/hooks/useTaskNotifications';

const SmartNotifications = () => {
  const { 
    notificationPermission, 
    requestPermission, 
    showNotification 
  } = useTaskNotifications();

  const handleTestNotification = () => {
    showNotification('Test Notification', {
      body: 'This is a test notification from Aurora!',
      icon: '/favicon.ico'
    });
  };

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return { text: 'Enabled', variant: 'default' as const };
      case 'denied':
        return { text: 'Blocked', variant: 'destructive' as const };
      default:
        return { text: 'Not Set', variant: 'secondary' as const };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {notificationPermission === 'granted' ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          Smart Notifications
        </CardTitle>
        <CardDescription>
          Get notified when your tasks are due
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={permissionStatus.variant}>
            {permissionStatus.text}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {notificationPermission === 'default' && (
            <Button onClick={requestPermission} className="w-full">
              Enable Notifications
            </Button>
          )}
          
          {notificationPermission === 'granted' && (
            <Button onClick={handleTestNotification} variant="outline" className="w-full">
              Test Notification
            </Button>
          )}
          
          {notificationPermission === 'denied' && (
            <p className="text-sm text-muted-foreground">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartNotifications;
