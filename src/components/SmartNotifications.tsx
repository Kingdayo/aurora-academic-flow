
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Clock, Calendar, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";

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

  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("Browser notifications enabled! 🔔");
        setSettings(prev => ({ ...prev, browserNotifications: true }));
      }
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem('notificationSettings', JSON.stringify({ ...settings, [key]: value }));
    toast.success("Notification settings updated! ⚙️");
  };

  const sendTestNotification = () => {
    if (permission === "granted") {
      new Notification("Aurora Reminder", {
        body: "Don't forget to work on your Mathematics homework! 📚",
        icon: "/favicon.ico"
      });
      toast.success("Test notification sent! 🔔");
    } else {
      toast.error("Please enable browser notifications first!");
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
                checked={settings.browserNotifications && permission === "granted"}
                onCheckedChange={(checked) => {
                  if (checked && permission !== "granted") {
                    requestNotificationPermission();
                  } else {
                    handleSettingChange('browserNotifications', checked);
                  }
                }}
              />
            </div>
            
            {permission !== "granted" && (
              <Button 
                onClick={requestNotificationPermission}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Enable Browser Notifications
              </Button>
            )}
            
            {permission === "granted" && (
              <Button 
                onClick={sendTestNotification}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Send Test Notification
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartNotifications;
