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
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import LoadingScreen from '@/components/LoadingScreen';

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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: any }>;
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
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('aurora-theme');
    return (storedTheme as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem('aurora-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const themeContextValue = { theme, toggleTheme };

  const handlePasswordUpdate = async (password: string) => {
    // Add password update logic here
    console.log('Password update requested with:', password);
    setIsPasswordResetOpen(false);
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
            {loading ? (
              <LoadingScreen />
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={
                    user ? <Navigate to="/dashboard" replace /> : <AuthPage />
                  }
                />
                <Route
                  path="/dashboard"
                  element={user ? <Dashboard /> : <Navigate to="/" replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </AuthContext.Provider>
        </BrowserRouter>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
