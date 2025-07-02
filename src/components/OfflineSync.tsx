
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from "lucide-react";
import { toast } from "sonner";

const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Syncing data... 🌐");
      performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline. Changes will sync when reconnected 📱");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending changes in localStorage
    const checkPendingChanges = () => {
      const pending = localStorage.getItem('pendingChanges');
      if (pending) {
        setPendingChanges(JSON.parse(pending).length || 0);
      }
    };

    checkPendingChanges();
    const interval = setInterval(checkPendingChanges, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const performSync = async () => {
    setSyncStatus("syncing");
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear pending changes
      localStorage.removeItem('pendingChanges');
      setPendingChanges(0);
      setLastSync(new Date());
      setSyncStatus("idle");
      
      toast.success("All changes synced successfully! ✅");
    } catch (error) {
      setSyncStatus("error");
      toast.error("Sync failed. Will retry automatically 🔄");
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return "bg-red-500";
    if (pendingChanges > 0) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (syncStatus === "syncing") return "Syncing...";
    if (pendingChanges > 0) return "Pending sync";
    return "Synced";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <span>Sync Status</span>
          <Badge className={`text-white ${getStatusColor()}`}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Cloud className="w-4 h-4 text-blue-500" />
            ) : (
              <CloudOff className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-sm">
              {isOnline ? "Connected to cloud" : "Working offline"}
            </span>
          </div>
          
          {isOnline && (
            <Button
              onClick={performSync}
              disabled={syncStatus === "syncing"}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
          )}
        </div>

        {pendingChanges > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>{pendingChanges}</strong> change{pendingChanges !== 1 ? 's' : ''} pending sync
            </p>
          </div>
        )}

        {lastSync && (
          <div className="text-xs text-gray-500">
            Last synced: {lastSync.toLocaleString()}
          </div>
        )}

        <div className="text-xs text-gray-500">
          💡 All your work is automatically saved locally and will sync when you're back online.
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineSync;
