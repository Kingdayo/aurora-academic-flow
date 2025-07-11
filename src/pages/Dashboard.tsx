import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Calendar as CalendarIcon, BarChart3, Bot, Bell, Menu, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/App";
import ThemeToggle from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import TaskCountdown from "@/components/TaskCountdown";
import useTaskNotifications from "@/hooks/useTaskNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const [activeTab, setActiveTab] = useState("tasks");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user,
    logout
  } = useAuth();
  const {
    notificationPermission,
    requestPermission
  } = useTaskNotifications();
  const isMobile = useIsMobile();

  // Auto-request notification permission
  useEffect(() => {
    if (notificationPermission === 'default') {
      requestPermission();
    }
  }, [notificationPermission, requestPermission]);

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
  const navigationItems = [{
    id: "tasks",
    label: "Tasks",
    icon: List
  }, {
    id: "calendar",
    label: "Calendar",
    icon: CalendarIcon
  }, {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3
  }, {
    id: "advanced-analytics",
    label: "Advanced",
    icon: BarChart3
  }, {
    id: "ai-assistant",
    label: "AI Assistant",
    icon: Bot
  }, {
    id: "pomodoro",
    label: "Pomodoro",
    icon: CalendarIcon
  }];
  const Sidebar = () => <div className={`
      ${isMobile ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : 'w-80 flex-shrink-0'} 
      bg-gradient-to-br from-purple-50 via-white to-purple-100 
      dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 
      border-r border-purple-200/50 dark:border-purple-800/30 
      backdrop-blur-xl shadow-2xl transition-all duration-500
    `}>
      {isMobile && <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-purple-600 hover:text-purple-700 hover:bg-purple-100/50 transition-all duration-300 hover:scale-105">
            <X className="h-5 w-5" />
          </Button>
        </div>}

      <div className="p-4 space-y-6 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 bg-clip-text text-transparent animate-gradient">Aurora</h1>
          <div className="flex items-center gap-2 mx-[50px]">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 animate-pulse-glow transition-all duration-300">
              <Bell className="w-3 h-3 mr-1" />
              Live
            </Badge>
            <ThemeToggle />
          </div>
        </div>

        {/* User Profile */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/30 shadow-lg hover:shadow-xl transition-all duration-500 hover-lift animate-slide-in-right">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-800 dark:text-purple-200">Profile</CardTitle>
            <CardDescription className="text-purple-600 dark:text-purple-300">
              Your workspace dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 ring-2 ring-purple-200 dark:ring-purple-700 shadow-md transition-all duration-300 hover:scale-105">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="bg-purple-gradient text-white font-semibold">
                  {user?.email?.[0].toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.email || "No Email"}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {user?.email ? "Active Session" : "Not Connected"}
                </p>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 transition-all duration-300 hover:scale-105" onClick={logout}>
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <Separator className="bg-purple-200/50 dark:bg-purple-800/30" />

        {/* Navigation */}
        <div className="space-y-3 animate-fade-in-up" style={{
        animationDelay: '0.2s'
      }}>
          <h4 className="font-semibold text-purple-800 dark:text-purple-200 text-sm uppercase tracking-wider">
            Navigation
          </h4>
          <div className="space-y-1">
            {navigationItems.map((item, index) => <Button key={item.id} variant={activeTab === item.id ? "default" : "ghost"} className={`w-full justify-start transition-all duration-300 hover:scale-105 ${activeTab === item.id ? "bg-purple-gradient text-white shadow-lg hover:shadow-xl transform animate-bounce-gentle" : "text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-900/30 hover:text-purple-800 dark:hover:text-purple-200"}`} style={{
            animationDelay: `${index * 0.1}s`
          }} onClick={() => {
            setActiveTab(item.id);
            if (isMobile) setSidebarOpen(false);
          }}>
                <item.icon className="mr-3 h-4 w-4 transition-transform duration-300" />
                <span className="font-medium">{item.label}</span>
              </Button>)}
          </div>
        </div>
      </div>
    </div>;
  return <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-800 transition-all duration-500">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />}

      <div className="flex min-h-screen">
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          {isMobile && <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-purple-200/50 dark:border-purple-800/30 p-4 sticky top-0 z-30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="text-purple-600 hover:text-purple-700 hover:bg-purple-100/50 transition-all duration-300 hover:scale-105">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Aurora
                </h1>
                <div className="w-10" /> {/* Spacer for centering */}
              </div>
            </header>}

          {/* Desktop Header with Task Countdown */}
          {!isMobile && <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-purple-200/50 dark:border-purple-800/30 p-4 sticky top-0 z-30 transition-all duration-300">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                    Aurora
                  </h1>
                  <div className="flex-1 max-w-md mx-8">
                    <TaskCountdown />
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    Welcome back, {user?.email?.split('@')[0] || 'User'}
                  </div>
                </div>
              </div>
            </header>}

          {/* Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Mobile Task Countdown */}
              {isMobile && <div className="mb-6 animate-fade-in-up">
                  <TaskCountdown />
                </div>}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Desktop Tabs */}
                <div className="hidden sm:block">
                  
                </div>

                {/* Mobile Tabs */}
                <div className="sm:hidden mb-4">
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/30 rounded-lg p-2 transition-all duration-300">
                    <div className="text-center">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Current: {navigationItems.find(item => item.id === activeTab)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6 space-y-6">
                  <TabsContent value="tasks" className="space-y-6 animate-fade-in-up">
                    <TaskManager showAddDialog={showAddDialog} onShowAddDialogChange={setShowAddDialog} activeTab={activeTab} />
                  </TabsContent>

                  <TabsContent value="calendar" className="animate-fade-in-up">
                    <CalendarSection />
                  </TabsContent>

                  <TabsContent value="analytics" className="animate-fade-in-up">
                    <div className="space-y-6">
                      <SmartNotifications />
                      <AnalyticsSection />
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced-analytics" className="animate-fade-in-up">
                    <div className="space-y-6">
                      <OfflineSync />
                      <AdvancedAnalytics />
                    </div>
                  </TabsContent>

                  <TabsContent value="ai-assistant" className="animate-fade-in-up">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2">
                          <AIAssistant />
                        </div>
                        <div>
                          <VoiceCommands onTabChange={handleVoiceTabChange} onAddTask={handleVoiceAddTask} onStartTimer={handleVoiceStartTimer} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pomodoro" className="animate-fade-in-up">
                    <PomodoroTimer />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>;
};
export default Dashboard;