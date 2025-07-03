import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth, useTheme } from "@/App";
import { toast } from "sonner";
import { Book, CheckSquare, Calendar, BarChart3, Brain, Timer, Settings, Plus, Mic } from "lucide-react";
import TaskManager from "@/components/TaskManager";
import CalendarSection from "@/components/CalendarSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import AIAssistant from "@/components/AIAssistant";
import PomodoroTimer from "@/components/PomodoroTimer";
import TaskCountdown from "@/components/TaskCountdown";
import SmartNotifications from "@/components/SmartNotifications";
import OfflineSync from "@/components/OfflineSync";
import GestureControls from "@/components/GestureControls";
import ThemeToggle from "@/components/ThemeToggle";
import UserProfile from "@/components/UserProfile";
import VoiceCommands from "@/components/VoiceCommands";

interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  dueTime: string;
  completed: boolean;
  createdAt: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("tasks");
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = localStorage.getItem("tasks");
    return storedTasks ? JSON.parse(storedTasks) : [];
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toast.info("Search function coming soon! 🚀");
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Add voice command event listeners
  useEffect(() => {
    const handleVoiceAddTask = () => {
      setShowAddTask(true);
    };

    const handleVoiceTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      setActiveTab(tab);
    };

    const handleVoiceStartTimer = () => {
      // This will be handled by the PomodoroTimer component
      const timerEvent = new CustomEvent('start-pomodoro-timer');
      window.dispatchEvent(timerEvent);
    };

    window.addEventListener('voice-add-task', handleVoiceAddTask);
    window.addEventListener('voice-tab-change', handleVoiceTabChange as EventListener);
    window.addEventListener('voice-start-timer', handleVoiceStartTimer);

    return () => {
      window.removeEventListener('voice-add-task', handleVoiceAddTask);
      window.removeEventListener('voice-tab-change', handleVoiceTabChange as EventListener);
      window.removeEventListener('voice-start-timer', handleVoiceStartTimer);
    };
  }, []);

  const addTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
    setShowAddTask(false);
    toast.success("Task added successfully! ✅");
  };

  const updateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    toast.success("Task deleted successfully! 🗑️");
  };

  const quickActions = [
    {
      icon: Plus,
      label: "Add Task",
      action: () => setShowAddTask(true),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: Mic,
      label: "Voice Commands",
      action: () => setShowVoiceCommands(true),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      icon: Calendar,
      label: "Calendar",
      action: () => setActiveTab('calendar'),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: BarChart3,
      label: "Analytics",
      action: () => setActiveTab('analytics'),
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-purple-200/50 dark:border-purple-700/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-gradient rounded-full flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Aurora</h1>
              <p className="text-xs text-gray-600 dark:text-gray-300">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto px-4 pb-4 space-x-2">
            {[
              { id: "tasks", label: "Tasks", icon: CheckSquare },
              { id: "calendar", label: "Calendar", icon: Calendar },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "ai-hub", label: "AI Hub", icon: Brain },
              { id: "productivity", label: "Productivity", icon: Timer },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Quick Actions FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-3">
          {/* Quick action buttons */}
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`w-12 h-12 rounded-full shadow-lg ${action.color} text-white hover:scale-110 transition-all duration-200`}
              size="icon"
            >
              <action.icon className="w-5 h-5" />
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden md:grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="tasks" className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4" />
              <span>Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="ai-hub" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI Hub</span>
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center space-x-2">
              <Timer className="w-4 h-4" />
              <span>Productivity</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TaskManager 
              tasks={tasks} 
              onTasksChange={setTasks}
              showAddDialog={showAddTask}
              onShowAddDialogChange={setShowAddTask}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarSection />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <AnalyticsSection />
              <AdvancedAnalytics />
            </div>
          </TabsContent>

          <TabsContent value="ai-hub">
            <div className="space-y-6">
              <AIAssistant />
              {showVoiceCommands && (
                <Dialog open={showVoiceCommands} onOpenChange={setShowVoiceCommands}>
                  <DialogContent className="max-w-2xl">
                    <VoiceCommands 
                      onTabChange={setActiveTab}
                      onAddTask={() => {
                        setShowAddTask(true);
                        setShowVoiceCommands(false);
                      }}
                      onStartTimer={() => {
                        const timerEvent = new CustomEvent('start-pomodoro-timer');
                        window.dispatchEvent(timerEvent);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
              <VoiceCommands 
                onTabChange={setActiveTab}
                onAddTask={() => setShowAddTask(true)}
                onStartTimer={() => {
                  const timerEvent = new CustomEvent('start-pomodoro-timer');
                  window.dispatchEvent(timerEvent);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="productivity">
            <div className="space-y-6">
              <PomodoroTimer />
              <TaskCountdown />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <SmartNotifications />
              <OfflineSync />
              <GestureControls />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <div className="mobile-styles">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 385px) {
              .container {
                padding-left: 0.5rem !important;
                padding-right: 0.5rem !important;
              }
              
              .grid {
                gap: 0.75rem !important;
              }
              
              .space-y-6 > * + * {
                margin-top: 1rem !important;
              }
              
              .space-y-4 > * + * {
                margin-top: 0.75rem !important;
              }
              
              .text-2xl {
                font-size: 1.25rem !important;
              }
              
              .text-3xl {
                font-size: 1.5rem !important;
              }
              
              .p-4 {
                padding: 0.75rem !important;
              }
              
              .px-4 {
                padding-left: 0.75rem !important;
                padding-right: 0.75rem !important;
              }
              
              .py-4 {
                padding-top: 0.75rem !important;
                padding-bottom: 0.75rem !important;
              }
              
              .mb-6 {
                margin-bottom: 1rem !important;
              }
              
              .mb-8 {
                margin-bottom: 1.5rem !important;
              }
              
              .rounded-lg {
                border-radius: 0.5rem !important;
              }
              
              .max-w-md {
                max-width: 90vw !important;
              }
              
              .w-full {
                width: 100% !important;
              }
              
              .min-h-screen {
                min-height: 100vh !important;
                overflow-x: hidden !important;
              }
              
              .fixed.bottom-6.right-6 {
                bottom: 1rem !important;
                right: 1rem !important;
              }
              
              .fixed.bottom-6.right-6 .w-12.h-12 {
                width: 2.5rem !important;
                height: 2.5rem !important;
              }
            }
          `
        }} />
      </div>
    </div>
  );
};

export default Dashboard;
