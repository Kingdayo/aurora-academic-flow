import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { User, Session } from "@supabase/gotrue-js";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import SplashScreen from "./components/SplashScreen";
import { toast } from "sonner";
import { PasswordResetDialog } from "@/components/PasswordResetDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sun, Moon, User as UserIcon } from "lucide-react";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import LoadingScreen from '@/components/LoadingScreen';
import ThemeToggle from '@/components/ThemeToggle';
import UserProfile from '@/components/UserProfile';
import GroupManager from '@/components/GroupManager';
import GroupChat from '@/components/GroupChat';

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
  const authContextValue = useEnhancedAuth();
  const { user, loading } = authContextValue;
  const [currentView, setCurrentView] = useState<'dashboard' | 'groups' | 'chat'>('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const themeContextValue = { theme, toggleTheme };

  const handlePasswordUpdate = (password: string) => {
    // Add password update logic here
    console.log('Password update requested with:', password);
    setIsPasswordResetOpen(false);
  };

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
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={themeContextValue}>
        <BrowserRouter>
          <AuthContext.Provider value={authContextValue}>
            <Toaster />
            <Sonner />
            <PasswordResetDialog
              isOpen={isPasswordResetOpen}
              onClose={() => setIsPasswordResetOpen(false)}
              onSubmit={handlePasswordUpdate}
            />
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
              <Routes>
                <Route
                  path="/"
                  element={
                    user ? <Navigate to="/dashboard" replace /> : <AuthPage />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    user ? <Dashboard /> : <Navigate to="/" replace />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <UserProfile />
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
          </AuthContext.Provider>
        </BrowserRouter>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
