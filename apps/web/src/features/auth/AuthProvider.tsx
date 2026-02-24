import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/db';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isProfileComplete: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function computeProfileComplete(profile: Profile | null): boolean {
  if (!profile) {
    return false;
  }
  return Boolean(profile.full_name?.trim() && profile.phone?.trim() && profile.address?.trim());
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async (): Promise<void> => {
    const currentUser = user;
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle<Profile>();

    if (error) {
      throw error;
    }

    setProfile(data ?? null);
  }, [user]);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthLoading(false);
        return;
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    void refreshProfile()
      .catch(() => {
        // Errors are surfaced by downstream screens when they fetch data directly.
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, [user, refreshProfile]);

  const loading = authLoading || (!!user && profileLoading);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      refreshProfile,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      isAdmin: profile?.role === 'admin',
      isProfileComplete: computeProfileComplete(profile),
    }),
    [user, session, profile, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
