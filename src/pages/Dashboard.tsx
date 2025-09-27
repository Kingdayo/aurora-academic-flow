import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { List, Calendar as CalendarIcon, BarChart3, Bot, Bell, Menu, X, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/App";
import GroupManager from "@/components/GroupManager";
import GroupChat from "@/components/GroupChat";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import VoiceCommandButton from "@/components/VoiceCommandButton";
import UserProfile from "@/components/UserProfile";

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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { notificationPermission, requestPermission } = useTaskNotifications();
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

  // Group selection handler
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setActiveTab("groups");
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
  };

  // Listen for global and voice command events
  useEffect(() => {
    const handleVoiceAddTaskEvent = () => handleVoiceAddTask();
    const handleVoiceTabChangeEvent = (event: CustomEvent) => handleVoiceTabChange(event.detail.tab);
    const handleVoiceStartTimerEvent = () => handleVoiceStartTimer();
    const handleAddTaskEvent = () => setShowAddDialog(true);
    const handleChangeTabEvent = (event: CustomEvent) => setActiveTab(event.detail.tab);

    window.addEventListener('voice-add-task', handleVoiceAddTaskEvent);
    window.addEventListener('voice-tab-change', handleVoiceTabChangeEvent as EventListener);
    window.addEventListener('voice-start-timer', handleVoiceStartTimerEvent);
    window.addEventListener('add-task', handleAddTaskEvent);
    window.addEventListener('change-tab', handleChangeTabEvent as EventListener);

    return () => {
      window.removeEventListener('voice-add-task', handleVoiceAddTaskEvent);
      window.removeEventListener('voice-tab-change', handleVoiceTabChangeEvent as EventListener);
      window.removeEventListener('voice-start-timer', handleVoiceStartTimerEvent);
      window.removeEventListener('add-task', handleAddTaskEvent);
      window.removeEventListener('change-tab', handleChangeTabEvent as EventListener);
    };
  }, [handleVoiceAddTask, handleVoiceTabChange, handleVoiceStartTimer]);

  const navigationItems = [
    { id: "tasks", label: "Tasks", icon: List },
    { id: "groups", label: "Groups", icon: Users },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "advanced-analytics", label: "Advanced", icon: BarChart3 },
    { id: "ai-assistant", label: "AI Assistant", icon: Bot },
    { id: "pomodoro", label: "Pomodoro", icon: CalendarIcon }
  ];

  const Sidebar = () => (
    <div className={`
      ${isMobile
        ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        : 'sticky top-0 h-screen w-80 flex-shrink-0'
      }
      bg-card border-r border-border backdrop-blur-xl shadow-xl transition-all duration-500
    `}>
      {isMobile && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="text-foreground/70 hover:text-foreground hover:bg-accent transition-all duration-300 hover:scale-105"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="p-4 space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-blue-600 bg-clip-text text-transparent animate-gradient">
            Aurora
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 animate-pulse-glow transition-all duration-300">
              <Bell className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
        </div>

        {/* Profile Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Separator className="bg-border/50" />
          <div className="p-4 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50">
              <img src={user?.user_metadata.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${user?.email}`} alt="User Avatar" />
              <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{user?.user_metadata.full_name || user?.email}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="outline" className="mt-4 text-green-400 border-green-400/50">
              Active Session
            </Badge>
          </div>
          <Separator className="bg-border/50" />
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider px-4">
            Navigation
          </h4>
          <div className="space-y-1">
            {navigationItems.map((item, index) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start transition-all duration-300 hover:scale-105 ${activeTab === item.id ? "text-primary" : ""
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => {
                  setActiveTab(item.id);
                  if (selectedGroupId && item.id !== "groups") {
                    setSelectedGroupId(null);
                  }
                  if (isMobile) setSidebarOpen(false);
                }}
              >
                <item.icon className="mr-3 h-4 w-4 transition-transform duration-300" />
                <span className="font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Button variant="ghost" className="w-full" onClick={() => logout()}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-800 transition-all duration-500">
        <div className="flex min-h-screen max-w-screen-2xl mx-auto">
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile overlay */}
            {isMobile && sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            {/* Mobile Header */}
            {isMobile && (
              <header className="bg-card/80 backdrop-blur-xl border-b border-border p-4 sticky top-0 z-30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="text-foreground/70 hover:text-foreground hover:bg-accent transition-all duration-300 hover:scale-105"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Aurora
                  </h1>
                  <div className="w-10" /> {/* Spacer for centering */}
                </div>
              </header>
            )}

            {/* Desktop Header */}
            {!isMobile && (
              <header className="bg-transparent p-4 sticky top-0 z-30 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">
                      {navigationItems.find(item => item.id === activeTab)?.label}
                    </h1>
                     <div className="flex-1 max-w-md mx-8">
                      <TaskCountdown />
                    </div>
                    <div className="flex items-center space-x-4">
                      <UserProfile />
                    </div>
                  </div>
                </div>
              </header>
            )}

            {/* Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsContent value="tasks" className="space-y-6 animate-fade-in-up">
                    <TaskManager showAddDialog={showAddDialog} onShowAddDialogChange={setShowAddDialog} activeTab={activeTab} />
                  </TabsContent>
                   <TabsContent value="groups" className="animate-fade-in-up">
                      {selectedGroupId ? (
                        <GroupChat groupId={selectedGroupId} onBack={handleBackToGroups} />
                      ) : (
                        <GroupManager onGroupSelect={handleGroupSelect} />
                      )}
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
                      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
                        <div className="xl:col-span-3">
                          <AIAssistant />
                        </div>
                        <div className="xl:col-span-2 min-w-0">
                          <VoiceCommands onTabChange={handleVoiceTabChange} onAddTask={handleVoiceAddTask} onStartTimer={handleVoiceStartTimer} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                   <TabsContent value="pomodoro" className="animate-fade-in-up">
                      <PomodoroTimer />
                    </TabsContent>
                </Tabs>
              </div>
            </main>
          </div>
        </div>
        <div className="fixed bottom-6 right-6 z-50">
          <VoiceCommandButton />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;