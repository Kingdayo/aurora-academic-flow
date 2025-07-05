import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth, useTheme } from "@/App";
import { toast } from "sonner";
import { Book, CheckSquare, Calendar, BarChart3, Brain, Timer, Settings, Plus, Mic, LogOut } from "lucide-react";
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
import UserTour from "@/components/UserTour";
import ScrollAnimations from "@/components/ScrollAnimations";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("tasks");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check if user needs tour on first visit
  useEffect(() => {
    const tourCompleted = localStorage.getItem('aurora-tour-completed');
    if (!tourCompleted) {
      // Show tour after a brief delay
      setTimeout(() => setShowTour(true), 1000);
    }
  }, []);

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
      console.log("Voice add task triggered");
      setShowAddTask(true);
    };
    const handleVoiceTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      setActiveTab(tab);
    };
    const handleVoiceStartTimer = () => {
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

  const handleVoiceCommandsClick = () => {
    setShowVoiceCommands(true);
  };

  const handleAddTaskClick = () => {
    console.log("Add task clicked - Dashboard");
    setShowAddTask(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out successfully! 👋");
    } catch (error) {
      toast.error("Error logging out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Improved mobile tab change handler that prevents freezing
  const handleMobileTabChange = (tabId: string) => {
    // Use requestAnimationFrame to ensure smooth transition
    requestAnimationFrame(() => {
      setActiveTab(tabId);
    });
  };

  const mobileNavTabs = [
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "ai-hub", label: "AI Hub", icon: Brain },
    { id: "productivity", label: "Productivity", icon: Timer },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <ScrollAnimations />
      
      {/* Header */}
      <header id="header" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-purple-200/50 dark:border-purple-700/50 sticky top-0 z-40">
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
            <UserProfile onAddTask={handleAddTaskClick} onTabChange={setActiveTab} onVoiceCommands={handleVoiceCommandsClick} isLoggingOut={isLoggingOut} onLogout={handleLogout} />
          </div>
        </div>
        
        {/* Mobile Navigation - Improved with better event handling */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto px-4 pb-4 space-x-2">
            {mobileNavTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleMobileTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 transform active:scale-95 ${
                  activeTab === tab.id 
                    ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shadow-sm" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Scroll Indicator */}
      <div className="md:hidden bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-center py-2 text-xs text-gray-600 dark:text-gray-300 animate-pulse">
        ↓ Scroll down to see more content ↓
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList id="tabs" className="hidden md:grid w-full grid-cols-6 mb-8">
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

          <TabsContent value="tasks" className="scroll-animate">
            <div id="task-section">
              <TaskManager showAddDialog={showAddTask} onShowAddDialogChange={setShowAddTask} />
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="scroll-animate calendar-responsive">
            <CalendarSection />
          </TabsContent>

          <TabsContent value="analytics" className="scroll-animate opacity-100 animate-fade-in">
            <div className="space-y-6">
              <AnalyticsSection />
              <AdvancedAnalytics />
            </div>
          </TabsContent>

          <TabsContent value="ai-hub" className="scroll-animate">
            <div className="space-y-6">
              <AIAssistant />
              <VoiceCommands onTabChange={setActiveTab} onAddTask={() => setShowAddTask(true)} onStartTimer={() => {
                const timerEvent = new CustomEvent('start-pomodoro-timer');
                window.dispatchEvent(timerEvent);
              }} />
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="scroll-animate">
            <div className="space-y-6">
              <PomodoroTimer />
              <TaskCountdown />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="scroll-animate">
            <div className="space-y-6">
              <SmartNotifications />
              <OfflineSync />
              <GestureControls />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Voice Commands Dialog */}
      <Dialog open={showVoiceCommands} onOpenChange={setShowVoiceCommands}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voice Commands</DialogTitle>
          </DialogHeader>
          <VoiceCommands onTabChange={tab => {
            setActiveTab(tab);
            setShowVoiceCommands(false);
          }} onAddTask={() => {
            setShowAddTask(true);
            setShowVoiceCommands(false);
          }} onStartTimer={() => {
            const timerEvent = new CustomEvent('start-pomodoro-timer');
            window.dispatchEvent(timerEvent);
            setShowVoiceCommands(false);
          }} />
        </DialogContent>
      </Dialog>

      {/* User Tour */}
      <UserTour isOpen={showTour} onClose={() => setShowTour(false)} />

      {/* Enhanced Mobile styles with improved navigation */}
      <div className="mobile-styles">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 1024px) {
              /* Improved mobile navigation handling */
              .mobile-nav-button {
                transition: all 0.2s ease-in-out !important;
                will-change: transform, background-color !important;
              }
              
              .mobile-nav-button:active {
                transform: scale(0.95) !important;
              }
              
              /* Prevent theme toggle interference with navigation */
              [data-theme-toggle] {
                isolation: isolate !important;
              }
              
              /* Fix for frozen navigation after theme toggle */
              .mobile-nav-container {
                pointer-events: auto !important;
                z-index: 30 !important;
              }
              
              /* Ensure mobile buttons remain interactive */
              button {
                pointer-events: auto !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: transparent !important;
              }
              
              /* Fixed notification positioning for mobile */
              [data-sonner-toaster] {
                position: fixed !important;
                top: env(safe-area-inset-top, 100px) !important;
                left: 16px !important;
                right: 16px !important;
                width: calc(100vw - 32px) !important;
                max-width: none !important;
                z-index: 9999 !important;
              }
              
              [data-sonner-toast] {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                backdrop-filter: blur(10px) !important;
              }
              
              /* Ensure popover positioning on mobile */
              [data-radix-popper-content-wrapper] {
                z-index: 9998 !important;
              }
              
              /* Force analytics content to be visible */
              .scroll-animate {
                opacity: 1 !important;
                transform: translateY(0) !important;
              }
            }

            @media (max-width: 400px) {
              .container {
                padding-left: 0.5rem !important;
                padding-right: 0.5rem !important;
              }
              
              .calendar-responsive .grid-cols-7 > div {
                min-height: 48px !important;
                padding: 0.25rem !important;
                font-size: 0.75rem !important;
              }
              
              .calendar-responsive button {
                padding: 0.375rem !important;
                font-size: 0.875rem !important;
              }
              
              .calendar-responsive h3 {
                font-size: 0.875rem !important;
                min-width: 100px !important;
              }
              
              .space-y-6 > * + * {
                margin-top: 1rem !important;
              }
              
              .p-4 {
                padding: 0.75rem !important;
              }
              
              .text-2xl {
                font-size: 1.25rem !important;
              }
              
              .rounded-lg {
                border-radius: 0.5rem !important;
              }
            }

            .scroll-animate {
              transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            }

            .scroll-animate.animate-fade-in {
              opacity: 1;
              transform: translateY(0);
            }
          `
        }} />
      </div>
    </div>
  );
};

export default Dashboard;
