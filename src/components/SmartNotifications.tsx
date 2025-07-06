
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Clock, Calendar, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";
import useTaskNotifications from '@/hooks/useTaskNotifications'; // Import the hook

interface NotificationSettings {
  smartReminders: boolean;
  deadlineAlerts: boolean;
  productivityTips: boolean;
  weeklyReports: boolean;
  browserNotifications: boolean;
}

const SmartNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    smartReminders: true,
    deadlineAlerts: true,
    productivityTips: false,
    weeklyReports: true,
    browserNotifications: false
  });

  const {
    notificationPermission,
    requestNotificationPermission: requestHookPermission,
    showNotification,
    isNotificationSupported
  } = useTaskNotifications();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Sync browserNotifications toggle if permission changes externally (e.g. user revokes in browser settings)
  useEffect(() => {
    if (notificationPermission === "granted" && !settings.browserNotifications) {
      // If permission is granted, but toggle is off, user might have granted it then turned off toggle.
      // Or, if permission granted via other means, reflect it by trying to set toggle on if appropriate.
      // This part might need more nuanced logic based on desired UX.
      // For now, if permission becomes granted, and toggle was off, we might enable it.
      // setSettings(prev => ({ ...prev, browserNotifications: true }));
    } else if (notificationPermission !== "granted" && settings.browserNotifications) {
      // If permission is not granted (denied/default) but toggle is on, turn it off.
      setSettings(prev => ({ ...prev, browserNotifications: false }));
    }
  }, [notificationPermission, settings.browserNotifications]);


  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const handleRequestPermission = async () => {
    if (!isNotificationSupported()) {
      toast.error("Browser notifications are not supported on this device/browser.");
      return;
    }
    const currentPermission = await requestHookPermission();
    if (currentPermission === "granted") {
      toast.success("Browser notifications enabled! 🔔");
      setSettings(prev => ({ ...prev, browserNotifications: true }));
      // Send a welcome notification via the hook
      showNotification("Aurora Notifications", {
        body: "You'll now receive smart reminders and updates! 🎉",
      });
    } else if (currentPermission === "denied") {
      toast.error("Notification permission denied. You can enable it later in browser settings.");
      setSettings(prev => ({ ...prev, browserNotifications: false }));
    } else {
      toast.info("Notification permission pending or dismissed.");
      setSettings(prev => ({ ...prev, browserNotifications: false }));
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success("Notification settings updated! ⚙️");
    
    // If enabling browser notifications but permission not granted, request it
    if (key === 'browserNotifications' && value && notificationPermission !== 'granted') {
      handleRequestPermission();
    }
    // If user is turning off the browserNotifications toggle
    if (key === 'browserNotifications' && !value) {
        setSettings(prev => ({ ...prev, browserNotifications: false }));
    }
  };

  const sendTestNotification = () => {
    if (notificationPermission === "granted" && settings.browserNotifications) {
      const testMessages = [
        "Don't forget to work on your Mathematics homework! 📚",
        "Time for a study break! Take 5 minutes to recharge ☕",
        "Your English essay is due tomorrow - make sure to review it! 📝",
        "Great job completing your tasks today! Keep up the momentum 🎉"
      ];
      
      const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
      
      // Use the hook's showNotification method
      showNotification("Aurora Test Reminder", {
        body: randomMessage,
        // icon and badge can be part of default options in the hook or passed here
      });
      toast.success("Test notification sent! 🔔");
    } else {
      if (!isNotificationSupported()) {
        toast.error("Browser notifications are not supported on this device/browser.");
      } else if (notificationPermission !== "granted") {
        toast.error("Please grant notification permission first.");
      } else {
        toast.error("Please enable the 'Browser Notifications' toggle first.");
      }
    }
  };

  const scheduleSmartReminder = () => {
    // This function's direct notification sending can also be updated to use the hook
    // For now, focusing on permission integration.
    if (notificationPermission === "granted" && settings.smartReminders) {
      // Schedule a smart reminder based on user's tasks
      const tasks = JSON.parse(localStorage.getItem('aurora-tasks') || '[]'); // Corrected localStorage key
      const pendingTasks = tasks.filter((task: any) => !task.completed);
      
      if (pendingTasks.length > 0) {
        const randomTask = pendingTasks[Math.floor(Math.random() * pendingTasks.length)];
        
        setTimeout(() => {
          new Notification("Smart Reminder", {
            body: `Don't forget: ${randomTask.title} (${randomTask.subject})`,
            icon: "/favicon.ico"
          });
        }, 30000); // 30 seconds delay for demo
        
        toast.success("Smart reminder scheduled! 🧠");
      } else {
        toast.info("No pending tasks for reminders!");
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-purple-600" />
          <span>Smart Notifications</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <Label htmlFor="smart-reminders">Smart Reminders</Label>
            </div>
            <Switch
              id="smart-reminders"
              checked={settings.smartReminders}
              onCheckedChange={(checked) => handleSettingChange('smartReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <Label htmlFor="deadline-alerts">Deadline Alerts</Label>
            </div>
            <Switch
              id="deadline-alerts"
              checked={settings.deadlineAlerts}
              onCheckedChange={(checked) => handleSettingChange('deadlineAlerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
            </div>
            <Switch
              id="weekly-reports"
              checked={settings.weeklyReports}
              onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-500" />
              <Label htmlFor="productivity-tips">Productivity Tips</Label>
            </div>
            <Switch
              id="productivity-tips"
              checked={settings.productivityTips}
              onCheckedChange={(checked) => handleSettingChange('productivityTips', checked)}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <Label htmlFor="browser-notifications">Browser Notifications</Label>
              </div>
              <Switch
                id="browser-notifications"
                checked={settings.browserNotifications && notificationPermission === "granted"}
                onCheckedChange={(checked) => handleSettingChange('browserNotifications', checked)}
                disabled={!isNotificationSupported()} // Disable toggle if not supported
              />
            </div>
            
            <div className="space-y-2">
              {isNotificationSupported() && notificationPermission !== "granted" && (
                <Button 
                  onClick={handleRequestPermission} // Use the new handler
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Enable Browser Notifications
                </Button>
              )}
              
              {notificationPermission === "granted" && settings.browserNotifications && (
                <div className="flex space-x-2">
                  <Button 
                    onClick={sendTestNotification}
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    Send Test
                  </Button>
                  <Button 
                    onClick={scheduleSmartReminder}
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    Smart Reminder
                  </Button>
                </div>
              )}
            </div>
            
            {isNotificationSupported() && notificationPermission === "granted" && (
              <p className="text-xs text-green-600 mt-2">
                ✅ Browser notifications are enabled.
              </p>
            )}
            {!isNotificationSupported() && (
              <p className="text-xs text-red-600 mt-2">
                ❌ Browser notifications are not supported on this device/browser.
              </p>
            )}
             {isNotificationSupported() && notificationPermission === "denied" && (
              <p className="text-xs text-yellow-600 mt-2">
                ⚠️ Browser notifications are disabled. You can enable them in your browser settings.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartNotifications;
