
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  createdAt: string;
}

const TaskCountdown = () => {
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadNextTask = () => {
      const savedTasks = localStorage.getItem("aurora-tasks");
      if (savedTasks) {
        const tasks: Task[] = JSON.parse(savedTasks);
        const incompleteTasks = tasks.filter(task => !task.completed && task.dueDate);
        
        if (incompleteTasks.length > 0) {
          // Sort by due date and time to get the most urgent task
          const sortedTasks = incompleteTasks.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            
            // If both have time, include it in comparison
            if (a.dueTime && b.dueTime) {
              const [hoursA, minutesA] = a.dueTime.split(':').map(Number);
              const [hoursB, minutesB] = b.dueTime.split(':').map(Number);
              dateA.setHours(hoursA, minutesA);
              dateB.setHours(hoursB, minutesB);
            }
            
            return dateA.getTime() - dateB.getTime();
          });
          setNextTask(sortedTasks[0]);
        } else {
          setNextTask(null);
        }
      }
    };

    loadNextTask();

    // Listen for task updates
    const handleTaskUpdate = () => {
      loadNextTask();
    };

    window.addEventListener('tasks-updated', handleTaskUpdate);
    window.addEventListener('tasks-changed', handleTaskUpdate);

    // Refresh every 5 seconds to catch any missed updates
    const interval = setInterval(loadNextTask, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tasks-updated', handleTaskUpdate);
      window.removeEventListener('tasks-changed', handleTaskUpdate);
    };
  }, []);

  useEffect(() => {
    if (!nextTask || !nextTask.dueDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const dueDate = new Date(nextTask.dueDate);
      
      // If task has a specific time, set it
      if (nextTask.dueTime) {
        const [hours, minutes] = nextTask.dueTime.split(':').map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
      } else {
        // Default to end of day if no specific time
        dueDate.setHours(23, 59, 59, 999);
      }
      
      const difference = dueDate.getTime() - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });

        // Check if we should send notifications
        checkAndSendNotifications(difference, nextTask);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        // Task is overdue - send overdue notification
        if (!notifiedTasks.has(`${nextTask.id}-overdue`)) {
          sendTaskNotification(nextTask, 'overdue');
          setNotifiedTasks(prev => new Set([...prev, `${nextTask.id}-overdue`]));
        }
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [nextTask, notifiedTasks]);

  const triggerVibration = (pattern: number[]) => {
    // Check if device supports vibration and is mobile
    if ('vibrate' in navigator && navigator.userAgent.match(/Mobile|Android|iPhone|iPad/i)) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('[TaskCountdown] Vibration not supported:', error);
      }
    }
  };

  const checkAndSendNotifications = (timeRemaining: number, task: Task) => {
    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    
    // Send notification 1 hour before (if not already sent)
    if (hoursRemaining === 1 && minutesRemaining <= 60 && !notifiedTasks.has(`${task.id}-1hour`)) {
      sendTaskNotification(task, '1hour');
      setNotifiedTasks(prev => new Set([...prev, `${task.id}-1hour`]));
    }
    
    // Send notification 15 minutes before (if not already sent) 
    if (minutesRemaining === 15 && !notifiedTasks.has(`${task.id}-15min`)) {
      sendTaskNotification(task, '15min');
      setNotifiedTasks(prev => new Set([...prev, `${task.id}-15min`]));
    }
    
    // Send notification 5 minutes before (if not already sent)
    if (minutesRemaining === 5 && !notifiedTasks.has(`${task.id}-5min`)) {
      sendTaskNotification(task, '5min');
      setNotifiedTasks(prev => new Set([...prev, `${task.id}-5min`]));
    }
    
    // Send notification when task is due (if not already sent)
    if (minutesRemaining === 0 && !notifiedTasks.has(`${task.id}-due`)) {
      sendTaskNotification(task, 'due');
      setNotifiedTasks(prev => new Set([...prev, `${task.id}-due`]));
    }
  };

  const sendTaskNotification = (task: Task, type: 'due' | 'overdue' | '1hour' | '15min' | '5min') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    let title = '';
    let body = '';
    let icon = '/favicon.ico';
    let vibrationPattern: number[] = [];

    // Check if mobile for vibration
    const isMobile = navigator.userAgent.match(/Mobile|Android|iPhone|iPad/i);

    switch (type) {
      case '1hour':
        title = '⏰ Task Due in 1 Hour';
        body = `"${task.title}" is due in 1 hour. Time to prepare!`;
        vibrationPattern = isMobile ? [300, 100, 300] : [];
        break;
      case '15min':
        title = '🚨 Task Due in 15 Minutes';
        body = `"${task.title}" is due soon. Get ready to complete it!`;
        vibrationPattern = isMobile ? [400, 100, 400, 100, 400] : [];
        break;
      case '5min':
        title = '🔥 Task Due in 5 Minutes';
        body = `"${task.title}" is due very soon. Time to act!`;
        vibrationPattern = isMobile ? [500, 200, 500, 200, 500] : [];
        break;
      case 'due':
        title = '⚡ Task is Due Now!';
        body = `"${task.title}" is due right now. Complete it immediately!`;
        vibrationPattern = isMobile ? [1000, 500, 1000] : [];
        break;
      case 'overdue':
        title = '❌ Task is Overdue!';
        body = `"${task.title}" is overdue. Please complete it as soon as possible.`;
        vibrationPattern = isMobile ? [200, 100, 200, 100, 200, 100, 200] : [];
        break;
    }

    const notificationOptions: NotificationOptions = {
      body,
      icon,
      tag: `task-${task.id}-${type}`,
      requireInteraction: true,
      silent: false
    };

    // Trigger vibration separately
    if (vibrationPattern.length > 0) {
      triggerVibration(vibrationPattern);
    }

    // Use service worker if available for better mobile handling
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: notificationOptions
      });
    } else {
      // Fallback to direct notification
      const notification = new Notification(title, notificationOptions);
      
      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        notification.close();
      };
    }

    console.log(`[TaskCountdown] Sent ${type} notification for task:`, task.title);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const isOverdue = nextTask && nextTask.dueDate && (() => {
    const dueDate = new Date(nextTask.dueDate);
    if (nextTask.dueTime) {
      const [hours, minutes] = nextTask.dueTime.split(':').map(Number);
      dueDate.setHours(hours, minutes, 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999);
    }
    return dueDate.getTime() < new Date().getTime();
  })();

  const isUrgent = nextTask && timeLeft.days === 0 && timeLeft.hours < 24;

  if (!nextTask) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 hover-lift transition-all">
        <CardHeader className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-green-800 dark:text-green-200">All Caught Up! 🎉</CardTitle>
          <CardDescription className="text-green-600 dark:text-green-300">
            No upcoming tasks. Great job staying organized!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`hover-lift transition-all ${
      isOverdue 
        ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700" 
        : isUrgent
        ? "bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-700"
        : "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700"
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOverdue ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            )}
            <CardTitle className={`text-lg ${
              isOverdue ? "text-red-800 dark:text-red-200" : "text-gray-900 dark:text-white"
            }`}>
              {isOverdue ? "Overdue Task!" : "Next Task Due"}
            </CardTitle>
          </div>
          <Badge className={`text-xs text-white ${getPriorityColor(nextTask.priority)}`}>
            {nextTask.priority}
          </Badge>
        </div>
        <CardDescription className={
          isOverdue ? "text-red-600 dark:text-red-300" : "text-gray-600 dark:text-gray-300"
        }>
          Stay on track with your upcoming deadline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {nextTask.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {nextTask.description || "No description provided"}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>Due: {new Date(nextTask.dueDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</span>
            {nextTask.dueTime && <span>at {nextTask.dueTime}</span>}
          </div>
        </div>

        {/* Countdown Display */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className={`p-2 sm:p-3 rounded-lg ${
            isOverdue 
              ? "bg-red-100 dark:bg-red-900/30" 
              : "bg-white/80 dark:bg-gray-800/80"
          } backdrop-blur-sm`}>
            <div className={`text-lg sm:text-2xl font-bold ${
              isOverdue ? "text-red-600" : "text-purple-600 dark:text-purple-400"
            }`}>
              {isOverdue ? "0" : timeLeft.days}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Days</div>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${
            isOverdue 
              ? "bg-red-100 dark:bg-red-900/30" 
              : "bg-white/80 dark:bg-gray-800/80"
          } backdrop-blur-sm`}>
            <div className={`text-lg sm:text-2xl font-bold ${
              isOverdue ? "text-red-600" : "text-purple-600 dark:text-purple-400"
            }`}>
              {isOverdue ? "0" : timeLeft.hours}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Hours</div>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${
            isOverdue 
              ? "bg-red-100 dark:bg-red-900/30" 
              : "bg-white/80 dark:bg-gray-800/80"
          } backdrop-blur-sm`}>
            <div className={`text-lg sm:text-2xl font-bold ${
              isOverdue ? "text-red-600" : "text-purple-600 dark:text-purple-400"
            }`}>
              {isOverdue ? "0" : timeLeft.minutes}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Minutes</div>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${
            isOverdue 
              ? "bg-red-100 dark:bg-red-900/30" 
              : "bg-white/80 dark:bg-gray-800/80"
          } backdrop-blur-sm`}>
            <div className={`text-lg sm:text-2xl font-bold ${
              isOverdue ? "text-red-600" : "text-purple-600 dark:text-purple-400"
            }`}>
              {isOverdue ? "0" : timeLeft.seconds}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Seconds</div>
          </div>
        </div>

        {isOverdue && (
          <div className="text-center text-sm text-red-600 dark:text-red-300 font-medium">
            This task is overdue! Complete it as soon as possible.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCountdown;
