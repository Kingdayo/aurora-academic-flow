import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useEnhancedAuth = (): AuthState & AuthActions => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleAuthStateChange = useCallback((event: string, session: Session | null) => {
    console.log('Auth state changed:', event, session?.user?.id);
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);

    if (event === 'SIGNED_OUT') {
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully');
    } else if (event === 'SIGNED_IN') {
      toast({
        title: "Welcome Back",
        description: "You have been signed in successfully",
      });
    }
  }, [toast]);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
        if (error.message.includes('refresh_token_not_found')) {
          // Token has expired, redirect to login
          await signOut();
        }
      }
    } catch (error) {
      console.error('Unexpected error during session refresh:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up automatic token refresh
    const refreshInterval = setInterval(() => {
      if (session && session.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at;
        // Refresh 5 minutes before expiration
        if (expiresAt - now < 300) {
          refreshSession();
        }
      }
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [handleAuthStateChange, session, refreshSession]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Sign In Error",
        description: err.message,
        variant: "destructive",
      });
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Check Your Email",
        description: "We sent you a confirmation link to complete registration",
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Sign Up Error",
        description: err.message,
        variant: "destructive",
      });
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };
};