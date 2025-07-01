
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import ThemeToggle from "@/components/ThemeToggle";
import UserProfile from "@/components/UserProfile";
import TaskManager from "@/components/TaskManager";
import CalendarSection from "@/components/CalendarSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import { Calendar, CheckSquare, BarChart3, User } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const tabNames = {
      tasks: "Tasks",
      calendar: "Calendar", 
      analytics: "Analytics"
    };
    toast.success(`Switched to ${tabNames[value as keyof typeof tabNames]} section! 📊`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-purple-200/50 dark:border-purple-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-gradient rounded-full flex items-center justify-center animate-pulse-glow">
              <span className="text-lg font-bold text-white">E</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">EduPlanner</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Academic Task Manager</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <UserProfile />
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={logout}
              className="hover-glow transition-all"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Let's make today productive and organized.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-purple-200/50 dark:border-purple-700/50">
            <TabsTrigger value="tasks" className="transition-all hover-glow">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="calendar" className="transition-all hover-glow">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="transition-all hover-glow">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="animate-fade-in-up">
            <TaskManager />
          </TabsContent>

          <TabsContent value="calendar" className="animate-fade-in-up">
            <CalendarSection />
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in-up">
            <AnalyticsSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
