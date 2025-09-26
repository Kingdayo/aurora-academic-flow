import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import SplashScreen from "./components/SplashScreen";
import { toast } from "sonner";
import { PasswordResetDialog } from "@/components/PasswordResetDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sun, Moon, User as UserIcon } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (name: string, email: string, password: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  loading: boolean;
  loggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function App() {
  const { user, loading } = useEnhancedAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'groups' | 'chat'>('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentView('chat');
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
    setCurrentView('groups');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedGroupId(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentView !== 'dashboard' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={currentView === 'chat' ? handleBackToGroups : handleBackToDashboard}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h1 className="text-2xl font-bold">
                {currentView === 'dashboard' && 'Dashboard'}
                {currentView === 'groups' && 'Groups'}
                {currentView === 'chat' && 'Group Chat'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <UserProfile />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {currentView === 'dashboard' && (
              <Dashboard onNavigateToGroups={() => setCurrentView('groups')} />
            )}
            {currentView === 'groups' && (
              <GroupManager onGroupSelect={handleGroupSelect} />
            )}
            {currentView === 'chat' && selectedGroupId && (
              <GroupChat
                groupId={selectedGroupId}
                onBack={handleBackToGroups}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;