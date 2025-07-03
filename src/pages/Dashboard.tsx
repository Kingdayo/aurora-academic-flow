
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import UserProfile from "@/components/UserProfile";
import TaskManager from "@/components/TaskManager";
import CalendarSection from "@/components/CalendarSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import AIAssistant from "@/components/AIAssistant";
import SmartNotifications from "@/components/SmartNotifications";
import PomodoroTimer from "@/components/PomodoroTimer";
import VoiceCommands from "@/components/VoiceCommands";
import OfflineSync from "@/components/OfflineSync";
import GestureControls from "@/components/GestureControls";
import { Calendar, CheckSquare, BarChart3, User, Book, Brain, Bell, Timer, Mic, Sparkles, Settings, Menu } from "lucide-react";
import { toast } from "sonner";
import TaskCountdown from "@/components/TaskCountdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");
  const isMobile = useIsMobile();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Voice command event listeners
  useEffect(() => {
    const handleVoiceTabChange = (event: any) => {
      const { tab } = event.detail;
      setActiveTab(tab);
      handleTabChange(tab);
    };

    const handleVoiceAddTask = () => {
      // This would trigger the add task dialog
      toast.success("Opening add task dialog via voice command! 🎤");
    };

    const handleVoiceStartTimer = () => {
      toast.success("Starting Pomodoro timer via voice command! ⏰");
    };

    window.addEventListener('voice-tab-change', handleVoiceTabChange);
    window.addEventListener('voice-add-task', handleVoiceAddTask);
    window.addEventListener('voice-start-timer', handleVoiceStartTimer);

    return () => {
      window.removeEventListener('voice-tab-change', handleVoiceTabChange);
      window.removeEventListener('voice-add-task', handleVoiceAddTask);
      window.removeEventListener('voice-start-timer', handleVoiceStartTimer);
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const tabNames = {
      tasks: "Tasks",
      calendar: "Calendar", 
      analytics: "Analytics",
      advanced: "Advanced Analytics",
      ai: "AI Assistant",
      productivity: "Productivity",
      settings: "Settings"
    };
    toast.success(`Switched to ${tabNames[value as keyof typeof tabNames]} section! 📊`);
  };

  const TabNavigation = () => (
    <TabsList className="grid w-full grid-cols-7 mb-6 sm:mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-purple-200/50 dark:border-purple-700/50 overflow-x-auto">
      <TabsTrigger value="tasks" className="transition-all hover-glow text-xs sm:text-sm p-2 sm:p-3">
        <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Tasks</span>
      </TabsTrigger>
      <TabsTrigger value="calendar" className="transition-all hover-glow text-xs sm:text-sm p-2 sm:p-3">
        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Calendar</span>
      </TabsTrigger>
      <TabsTrigger value="analytics" className="transition-all hover-glow text-xs sm:text-sm p-2 sm:p-3">
        <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Analytics</span>
      </TabsTrigger>
      <TabsTrigger value="advanced" className="transition-all hover-glow text-xs sm:text-sm p-2 sm:p-3">
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Advanced</span>
      </TabsTrigger>
      <TabsTrigger value="ai" className="transition-all hover-glow text-xs sm:text-sm p-2 sm:p-3">
        <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">AI Hub</span>
      </TabsTrigger>
      <TabsTrigger value="productivity" className="transition-all hover-glow text-xs sm:text-sm p-2 sm:p-3">
        <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Focus</span>
      </TabsTrigger>
      <TabsTrigger value="settings" className="transition-all hover-glow text-xs sm:text-sm p-2 sm:p-3">
        <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Settings</span>
      </TabsTrigger>
    </TabsList>
  );

  const MobileNavigation = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-semibold">Navigation</h3>
          <div className="space-y-2">
            {[
              { value: "tasks", label: "Tasks", icon: CheckSquare },
              { value: "calendar", label: "Calendar", icon: Calendar },
              { value: "analytics", label: "Analytics", icon: BarChart3 },
              { value: "advanced", label: "Advanced", icon: Sparkles },
              { value: "ai", label: "AI Hub", icon: Brain },
              { value: "productivity", label: "Focus", icon: Timer },
              { value: "settings", label: "Settings", icon: Settings }
            ].map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab(tab.value);
                  handleTabChange(tab.value);
                }}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-purple-200/50 dark:border-purple-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <MobileNavigation />
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-gradient rounded-full flex items-center justify-center animate-pulse-glow">
              <Book className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Aurora</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">AI-Powered Academic Planner</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <UserProfile />
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={logout}
              className="hover-glow transition-all text-xs sm:text-sm px-2 sm:px-4"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {displayName}! 👋
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Experience the future of academic planning with AI-powered insights.
          </p>
        </div>

        {/* Task Countdown */}
        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <TaskCountdown />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {!isMobile && <TabNavigation />}

          <TabsContent value="tasks" className="animate-fade-in-up">
            <TaskManager />
          </TabsContent>

          <TabsContent value="calendar" className="animate-fade-in-up">
            <CalendarSection />
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in-up">
            <AnalyticsSection />
          </TabsContent>

          <TabsContent value="advanced" className="animate-fade-in-up">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="ai" className="animate-fade-in-up">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold">AI-Powered Features</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <AIAssistant />
                <VoiceCommands 
                  onTabChange={setActiveTab}
                  onAddTask={() => toast.success("Voice command: Add task triggered! 🎤")}
                  onStartTimer={() => toast.success("Voice command: Timer started! ⏰")}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <SmartNotifications />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      <span>AI Features Roadmap</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-800 text-sm">🤖 AI Study Buddy</h4>
                        <p className="text-xs text-purple-700">Chat with AI for study help and explanations</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 text-sm">📚 Smart Content Generation</h4>
                        <p className="text-xs text-blue-700">Generate study materials and summaries</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 text-sm">🎯 Predictive Planning</h4>
                        <p className="text-xs text-green-700">AI predicts optimal study schedules</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="animate-fade-in-up">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold">Productivity Tools</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <PomodoroTimer />
                <OfflineSync />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in-up">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold">Advanced Settings</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <SmartNotifications />
                <GestureControls />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <OfflineSync />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      <span>Experimental Features</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 text-sm">⚡ Quick Actions</h4>
                        <p className="text-xs text-yellow-700">Keyboard shortcuts and quick commands</p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <h4 className="font-semibold text-indigo-800 text-sm">🌙 Dark Mode Plus</h4>
                        <p className="text-xs text-indigo-700">Enhanced dark mode with customization</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile-specific styles */}
      <style jsx global>{`
        @media (max-width: 385px) {
          .container {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          
          .grid {
            gap: 0.75rem;
          }
          
          .space-y-6 > * + * {
            margin-top: 1rem;
          }
          
          .space-y-4 > * + * {
            margin-top: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
