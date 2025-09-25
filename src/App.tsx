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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      return savedTheme || "light";
    } catch {
      return "light";
    }
  });

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

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('[App] Service Worker registered with scope:', registration.scope);
          await registration.update();
        } catch (error) {
          console.error('[App] Service Worker registration failed:', error);
        }
      });
    }

    return () => {
      clearTimeout(initialLoadingTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('[App] Attempting login for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[App] Login error:', error);
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
      const redirectUrl = `${window.location.origin}/`;
      console.log('[App] Attempting password reset for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      if (error) {
        console.error('[App] Password reset error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('[App] Password reset exception:', error);
      return { error: { message: 'An unexpected error occurred. Please try again.' } };
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[App] Logout error:', error);
        toast.error('Failed to logout. Please try again.');
        setLoggingOut(false);
      }
    } catch (error) {
      console.error('[App] Logout exception:', error);
      toast.error('An unexpected error occurred during logout.');
      setLoggingOut(false);
    }
  };

  const authContextValue: AuthContextType = {
    user,
    session,
    login,
    register,
    resetPassword,
    logout,
    loading,
    loggingOut,
  };

  const themeContextValue: ThemeContextType = {
    theme,
    toggleTheme,
  };

  if (initialLoading) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={themeContextValue}>
        <AuthContext.Provider value={authContextValue}>
          <BrowserRouter>
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
              <Routes>
                <Route
                  path="/"
                  element={
                    session ? <Navigate to="/dashboard" replace /> : <AuthPage />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    session ? <Dashboard /> : <Navigate to="/" replace />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              <PasswordResetDialog
                open={isPasswordResetOpen}
                onOpenChange={setIsPasswordResetOpen}
              />
              
              <Toaster />
              <Sonner />
            </div>
          </BrowserRouter>
        </AuthContext.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;