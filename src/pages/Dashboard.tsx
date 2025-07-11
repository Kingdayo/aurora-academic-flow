
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Plus, CheckCircle, Circle, Trash2, Edit, Calendar as CalendarIcon, BarChart3, Bot, Mic, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/App";
import ThemeToggle from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import OfflineSync from "@/components/OfflineSync";
import SmartNotifications from "@/components/SmartNotifications";
import VoiceCommands from "@/components/VoiceCommands";
import AnalyticsSection from "@/components/AnalyticsSection";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import TaskManager from "@/components/TaskManager";
import CalendarSection from "@/components/CalendarSection";
import AIAssistant from "@/components/AIAssistant";
import PomodoroTimer from "@/components/PomodoroTimer";
import useTaskNotifications from "@/hooks/useTaskNotifications";

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  dueTime?: string;
  completed: boolean;
  createdAt: Date;
}

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const storedTasks = localStorage.getItem('aurora-tasks');
      return storedTasks ? JSON.parse(storedTasks).map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt)
      })) : [];
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error);
      return [];
    }
  });
  
  const [activeTab, setActiveTab] = useState("tasks");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("General");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { notificationPermission, requestPermission, showNotification, hasBeenNotified, markAsNotified } = useTaskNotifications();

  // Auto-request notification permission
  useEffect(() => {
    if (notificationPermission === 'default') {
      requestPermission();
    }
  }, [notificationPermission, requestPermission]);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem('aurora-tasks', JSON.stringify(tasks));
      // Dispatch custom event for analytics components
      window.dispatchEvent(new CustomEvent('tasks-updated', { detail: tasks }));
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error);
    }
  }, [tasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      description: newTaskDescription,
      category: newTaskCategory,
      priority: newTaskPriority,
      completed: false,
      dueDate: selectedDate,
      dueTime: selectedTime,
      createdAt: new Date(),
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskCategory("General");
    setNewTaskPriority("medium");
    setIsAddingTask(false);
    toast({
      title: "Success",
      description: "Task added successfully!",
    });
  };

  const toggleComplete = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast({
      title: "Success",
      description: "Task deleted successfully!",
    });
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditedTaskTitle(task.title);
  };

  const saveEditedTask = () => {
    setTasks(
      tasks.map((task) =>
        task.id === editingTask ? { ...task, title: editedTaskTitle } : task
      )
    );
    setEditingTask(null);
    setEditedTaskTitle("");
    toast({
      title: "Success",
      description: "Task updated successfully!",
    });
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditedTaskTitle("");
  };

  // Voice command handlers
  const handleVoiceAddTask = useCallback(() => {
    setShowAddDialog(true);
    setActiveTab("tasks");
  }, []);

  const handleVoiceTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleVoiceStartTimer = useCallback(() => {
    setActiveTab("pomodoro");
  }, []);

  // Task due time checking with notifications
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkTasks = () => {
      try {
        const currentTime = new Date();

        tasks.forEach((task) => {
          if (task.completed || hasBeenNotified(task.id)) return;

          if (task.dueDate && task.dueTime) {
            const dueDateTime = new Date(`${task.dueDate.toISOString().split('T')[0]}T${task.dueTime}`);
            const timeDiff = dueDateTime.getTime() - currentTime.getTime();
            
            // Notify if within 1 minute window
            if (timeDiff <= 60000 && timeDiff >= -60000) {
              showNotification(`Task Due: ${task.title}`, {
                body: task.description || `Your task "${task.title}" is now due.`,
                tag: `task-${task.id}`,
              });
              markAsNotified(task.id);
            }
          }
        });
      } catch (error) {
        console.error('[Dashboard] Error checking tasks:', error);
      }
    };

    // Check every 30 seconds
    const intervalId = setInterval(checkTasks, 30000);
    checkTasks(); // Initial check

    return () => clearInterval(intervalId);
  }, [tasks, notificationPermission, showNotification, hasBeenNotified, markAsNotified]);

  // Listen for voice command events
  useEffect(() => {
    const handleVoiceAddTaskEvent = () => handleVoiceAddTask();
    const handleVoiceTabChangeEvent = (event: CustomEvent) => handleVoiceTabChange(event.detail.tab);
    const handleVoiceStartTimerEvent = () => handleVoiceStartTimer();

    window.addEventListener('voice-add-task', handleVoiceAddTaskEvent);
    window.addEventListener('voice-tab-change', handleVoiceTabChangeEvent as EventListener);
    window.addEventListener('voice-start-timer', handleVoiceStartTimerEvent);

    return () => {
      window.removeEventListener('voice-add-task', handleVoiceAddTaskEvent);
      window.removeEventListener('voice-tab-change', handleVoiceTabChangeEvent as EventListener);
      window.removeEventListener('voice-start-timer', handleVoiceStartTimerEvent);
    };
  }, [handleVoiceAddTask, handleVoiceTabChange, handleVoiceStartTimer]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-border dark:bg-gray-900">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Aurora AI
              </h1>
              <ThemeToggle />
            </div>

            {/* User Profile */}
            <div className="mb-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>Manage your account settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>{user?.email?.[0].toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{user?.email || "No Email"}</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.email ? "Logged In" : "Not Logged In"}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" className="mt-4 w-full" onClick={logout}>
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Offline Sync */}
            <OfflineSync />

            {/* Smart Notifications */}
            <div className="mb-4">
              <SmartNotifications />
            </div>

            {/* Voice Commands */}
            <div className="mb-4">
              <VoiceCommands 
                onTabChange={handleVoiceTabChange}
                onAddTask={handleVoiceAddTask}
                onStartTimer={handleVoiceStartTimer}
              />
            </div>

            <Separator className="my-4" />

            {/* Navigation */}
            <div className="space-y-2">
              <h4 className="font-medium tracking-tight">Navigation</h4>
              <div className="space-y-1">
                <Button 
                  variant={activeTab === "tasks" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("tasks")}
                >
                  <List className="mr-2 h-4 w-4" />
                  Tasks
                </Button>
                <Button 
                  variant={activeTab === "calendar" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("calendar")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Calendar
                </Button>
                <Button 
                  variant={activeTab === "analytics" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("analytics")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button 
                  variant={activeTab === "advanced-analytics" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("advanced-analytics")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Advanced Analytics
                </Button>
                <Button 
                  variant={activeTab === "ai-assistant" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("ai-assistant")}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
                <Button 
                  variant={activeTab === "pomodoro" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab("pomodoro")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Pomodoro Timer
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="advanced-analytics">Advanced</TabsTrigger>
              <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
              <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              <TaskManager
                showAddDialog={showAddDialog}
                onShowAddDialogChange={setShowAddDialog}
                activeTab={activeTab}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarSection />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsSection />
            </TabsContent>

            <TabsContent value="advanced-analytics">
              <AdvancedAnalytics />
            </TabsContent>

            <TabsContent value="ai-assistant">
              <AIAssistant />
            </TabsContent>

            <TabsContent value="pomodoro">
              <PomodoroTimer />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
