import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'user';

export type AuthState = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<unknown>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * Mount once, at the top of the app. Previously `useAuth` held local state, so
 * every consumer (7 files) opened its own `onAuthStateChange` subscription and
 * ran its own `user_roles` query, producing duplicate requests and an
 * out-of-sync `loading` flag that could bounce users back to `/auth`.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Avoids refetching roles for a user we already resolved, since
  // onAuthStateChange also fires on token refresh.
  const resolvedRolesForUser = useRef<string | null>(null);

  const fetchRoles = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('[useAuth] failed to load user roles', error.message);
      setRoles([]);
      return;
    }

    resolvedRolesForUser.current = userId;
    setRoles((data ?? []).map((row) => row.role as AppRole));
  }, []);

  useEffect(() => {
    let active = true;

    const applySession = (next: Session | null) => {
      if (!active) return;
      setSession(next);
      setUser(next?.user ?? null);

      if (!next?.user) {
        resolvedRolesForUser.current = null;
        setRoles([]);
        return;
      }

      if (resolvedRolesForUser.current !== next.user.id) {
        void fetchRoles(next.user.id);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      applySession(next);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: initial } }) => {
        applySession(initial);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchRoles]);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      roles,
      isAdmin: roles.includes('admin'),
      loading,
      signOut,
    }),
    [session, user, roles, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>. Add it in App.tsx.');
  }

  return context;
}
