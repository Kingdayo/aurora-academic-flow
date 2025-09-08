import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import SplashScreen from "./components/SplashScreen";
import { toast } from "sonner";
import { PasswordResetDialog } from "@/components/PasswordResetDialog";

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

const App = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      return savedTheme || "light";
    } catch {
      return "light";
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);

  useEffect(() => {
    const initialLoadingTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 6000);

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[App] Auth event:', event, 'Session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordResetOpen(true);
        } else if (event === 'SIGNED_IN') {
          toast.success("Welcome back! 👋");
        } else if (event === 'SIGNED_OUT') {
          toast.success("Logged out successfully! See you soon! 👋");
          setLoggingOut(false);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[App] Token refreshed successfully');
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[App] Error getting session:', error);
          // Clear any stale auth data on error
          setSession(null);
          setUser(null);
        } else {
          console.log('[App] Initial session:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('[App] Error initializing auth:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Register Service Worker (skip in development)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('[App] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('[App] Service Worker registration failed:', error);
          });
      });
    }

    return () => {
      clearTimeout(initialLoadingTimer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // Save theme to localStorage
    const saveThemeToStorage = () => {
      try {
        localStorage.setItem("theme", theme);
      } catch (error) {
        console.error("Error saving theme to localStorage:", error);
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(saveThemeToStorage);
    } else {
      setTimeout(saveThemeToStorage, 0);
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    toast.success(`Switched to ${newTheme} mode! ${newTheme === "dark" ? "🌙" : "☀️"}`);
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[App] Attempting login for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[App] Login error:', error);
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Invalid email or password. Please check your credentials and try again.' } };
        } else if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Please check your email and click the confirmation link before signing in.' } };
        } else if (error.message.includes('Invalid API key')) {
          return { error: { message: 'Authentication service is temporarily unavailable. Please try again later.' } };
        }
      }
      
      return { error };
    } catch (error) {
      console.error('[App] Login exception:', error);
      return { error: { message: 'An unexpected error occurred. Please try again.' } };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      console.log('[App] Attempting registration for:', email, 'with redirect:', redirectUrl);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          }
        }
      });
      
      if (error) {
        console.error('[App] Registration error:', error);
        // Provide more specific error messages for registration
        if (error.message.includes('User already registered')) {
          return { error: { message: 'An account with this email already exists. Please sign in instead.' } };
        } else if (error.message.includes('Invalid API key')) {
          return { error: { message: 'Authentication service is temporarily unavailable. Please try again later.' } };
        }
      }
      
      return { error };
    } catch (error) {
      console.error('[App] Registration exception:', error);
      return { error: { message: 'An unexpected error occurred during registration. Please try again.' } };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = "https://aurora-task-flow.netlify.app/dashboard";
      console.log('[App] Attempting password reset for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      if (error) {
        console.error('[App] Password reset error:', error);
        if (error.message.includes('Invalid API key')) {
          return { error: { message: 'Authentication service is temporarily unavailable. Please try again later.' } };
        }
        // Check for network errors which might indicate a redirect URL issue
        if (error.name === 'AuthRetryableFetchError' || error.message.includes('NetworkError')) {
          return { error: { message: 'Network error. Please check your connection and ensure the app URL is in your Supabase project\'s redirect list.' } };
        }
      }
      
      return { error };
    } catch (error: any) {
      console.error('[App] Password reset exception:', error);
      if (error.name === 'AuthRetryableFetchError' || error.message.includes('NetworkError')) {
        return { error: { message: 'Network error. Please check your connection and ensure the app URL is in your Supabase project\'s redirect list.' } };
      }
      return { error: { message: 'An unexpected error occurred. Please try again.' } };
    }
  };

  const logout = async () => {
    try {
      setLoggingOut(true);
      console.log('[App] Attempting logout');
      
      setTimeout(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('[App] Logout error:', error);
          setLoggingOut(false);
        }
      }, 2000);
    } catch (error) {
      console.error('[App] Logout exception:', error);
      setLoggingOut(false);
    }
  };

  const handlePasswordUpdate = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        toast.error(error.message);
        throw error;
    }
  };

  if (initialLoading || loading) {
    return <SplashScreen />;
  }

  if (loggingOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex items-center justify-center relative">
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 z-10" />
        <div className="relative z-20 flex flex-col items-center space-y-6 p-8">
          <div className="w-20 h-20 bg-purple-gradient rounded-full flex items-center justify-center animate-pulse-glow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Signing you out...
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              See you next time!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PasswordResetDialog
            isOpen={isPasswordResetOpen}
            onClose={() => setIsPasswordResetOpen(false)}
            onSubmit={handlePasswordUpdate}
          />
          <BrowserRouter>
            <AuthContext.Provider value={{ user, session, login, register, resetPassword, logout, loading, loggingOut }}>
              <Routes>
                <Route 
                  path="/" 
                  element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
                />
                <Route 
                  path="/dashboard" 
                  element={user ? <Dashboard /> : <Navigate to="/" replace />} 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthContext.Provider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
