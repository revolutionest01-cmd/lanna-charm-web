import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

let authState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
};

let listeners: Set<(state: AuthState) => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener(authState));
};

const setAuthState = (updates: Partial<AuthState>) => {
  authState = { ...authState, ...updates };
  notifyListeners();
};

const buildUserFromSession = (session: Session): User => {
  const metadata = session.user?.user_metadata || {};
  return {
    id: session.user.id,
    name: metadata.full_name || metadata.name || session.user.email?.split('@')[0] || 'User',
    email: session.user.email || '',
    avatar: metadata.avatar_url || metadata.picture,
  };
};

const fetchAndEnrichUser = async (session: Session): Promise<User> => {
  const baseUser = buildUserFromSession(session);
  try {
    const metadata = session.user?.user_metadata || {};
    const displayName = metadata.full_name || metadata.name || session.user.email?.split('@')[0] || 'User';
    const avatarUrl = metadata.avatar_url || metadata.picture;

    await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    return {
      ...baseUser,
      name: profile?.display_name || displayName,
      avatar: profile?.avatar_url || avatarUrl,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return baseUser;
  }
};

// Initialize auth state
const initializeAuth = async () => {
  try {
    // Set a timeout to ensure auth initializes within 2 seconds max
    let authCompleted = false;
    const authTimeoutId = setTimeout(() => {
      if (!authCompleted && authState.isLoading) {
        console.warn('Auth initialization timeout - forcing completion');
        setAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
        authCompleted = true;
      }
    }, 2000);

    // Set up auth state listener FIRST
    supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          // Set basic user immediately so isLoading clears
          const basicUser = buildUserFromSession(session);
          setAuthState({
            user: basicUser,
            session,
            isAuthenticated: true,
            isLoading: false,
          });
          authCompleted = true;
          clearTimeout(authTimeoutId);

          // Enrich with profile data in background
          const enrichedUser = await fetchAndEnrichUser(session);
          setAuthState({ user: enrichedUser });
        } else {
          setAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
          authCompleted = true;
          clearTimeout(authTimeoutId);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState({
          user: null,
          session,
          isAuthenticated: !!session,
          isLoading: false,
        });
        authCompleted = true;
        clearTimeout(authTimeoutId);
      }
    });

    // THEN check for existing session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error && error.message !== 'JSON.parse: unexpected character') {
      console.error('Error getting session:', error);
    }

    if (session?.user) {
      const basicUser = buildUserFromSession(session);
      setAuthState({
        user: basicUser,
        session,
        isAuthenticated: true,
        isLoading: false,
      });
      authCompleted = true;
      clearTimeout(authTimeoutId);

      // Enrich in background
      fetchAndEnrichUser(session).then(enrichedUser => {
        setAuthState({ user: enrichedUser });
      }).catch(err => {
        console.error('Error enriching user:', err);
      });
    } else {
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      authCompleted = true;
      clearTimeout(authTimeoutId);
    }
  } catch (error) {
    console.error('Auth initialization error:', error);
    setAuthState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
};

// Initialize on module load
initializeAuth();

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(authState);

  useEffect(() => {
    listeners.add(setState);
    // Sync with current state in case it changed before subscription
    setState({ ...authState });
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: name,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
    }
  };

  const logout = async () => {
    // Clear all localStorage except language
    const language = localStorage.getItem('language-storage');
    localStorage.clear();
    if (language) {
      localStorage.setItem('language-storage', language);
    }
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
  };

  return {
    user: state.user,
    session: state.session,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    register,
    logout,
  };
};
