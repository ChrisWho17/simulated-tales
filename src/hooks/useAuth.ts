// ============================================================================
// AUTHENTICATION HOOK - Manages user authentication state
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State changed:', event);
        
        // Validate session before trusting it
        if (session?.access_token) {
          try {
            const parts = session.access_token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              if (!payload.sub) {
                console.error('[Auth] Invalid JWT - missing sub claim, clearing session');
                await supabase.auth.signOut({ scope: 'local' });
                setSession(null);
                setUser(null);
                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('[Auth] Failed to validate JWT:', e);
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Validate existing session
      if (session?.access_token) {
        try {
          const parts = session.access_token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (!payload.sub) {
              console.error('[Auth] Stored JWT is corrupted - missing sub claim');
              await supabase.auth.signOut({ scope: 'local' });
              setSession(null);
              setUser(null);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('[Auth] Failed to validate stored JWT:', e);
          await supabase.auth.signOut({ scope: 'local' });
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: displayName || email.split('@')[0],
          },
        },
      });
      return { error };
    } catch (err) {
      console.error('[Auth] Sign up error:', err);
      return { error: err as AuthError };
    }
  }, []);

  const signIn = useCallback(async (
    email: string, 
    password: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      console.error('[Auth] Sign in error:', err);
      return { error: err as AuthError };
    }
  }, []);

  const signInWithOAuth = useCallback(async (
    provider: Provider
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { error };
    } catch (err) {
      console.error('[Auth] OAuth sign in error:', err);
      return { error: err as AuthError };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
  }, []);

  const resetPassword = useCallback(async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err) {
      console.error('[Auth] Reset password error:', err);
      return { error: err as AuthError };
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
  };
}
