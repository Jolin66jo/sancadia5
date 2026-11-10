import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext, type AuthContextValue, type AuthStatus } from '@/hooks/authContext';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      setStatus('offline');
      return;
    }

    let active = true;

    const syncSession = async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (active) {
          setSession(data.session);
          setStatus(data.session ? 'signed-in' : 'guest');
        }
      } catch (error) {
        console.error('Unable to restore the authentication session:', error);
        if (active) setStatus('error');
      } finally {
        if (active) setLoading(false);
      }
    };

    void syncSession();

    const { data: sub } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setStatus(nextSession ? 'signed-in' : 'guest');

      if (!nextSession) {
        try {
          const { error } = await client.auth.signInAnonymously();
          if (error) {
            setStatus('error');
            console.error('Anonymous bootstrap failed:', error);
          }
        } catch (error) {
          console.error('Anonymous bootstrap crashed:', error);
          setStatus('error');
        }
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = supabase;
    if (!client) return { error: 'Authentication is not configured for this deployment.' };
    const { error } = await client.auth.signUp({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = supabase;
    if (!client) return { error: 'Authentication is not configured for this deployment.' };
    const { error } = await client.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    const client = supabase;
    if (!client) return;
    await client.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isAnonymous: Boolean(session?.user && session.user.is_anonymous),
      status,
      signUp,
      signIn,
      signOut,
    }),
    [session, loading, status, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
