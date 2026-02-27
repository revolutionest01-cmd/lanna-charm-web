import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'user' | 'developer' | 'admin';
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const PROFILE_CACHE_KEY = 'app-cached-user-profile';

const getCachedProfile = (): User | null => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return null;
};

const setCachedProfile = (user: User | null) => {
  try {
    if (user) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch {}
};

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
    role: metadata.role || 'user',
  };
};

// Role is fetched from user_roles table in fetchAndEnrichUser

const fetchAndEnrichUser = async (session: Session): Promise<User> => {
  const baseUser = buildUserFromSession(session);
  try {
    const metadata = session.user?.user_metadata || {};
    const displayName = metadata.full_name || metadata.name || session.user.email?.split('@')[0] || 'User';
    const avatarUrl = metadata.avatar_url || metadata.picture;

    // Fetch profile and role in parallel
    const [profileResult, roleResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle(),
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle(),
    ]);

    const profile = profileResult.data;
    const userRole = (roleResult.data?.role as User['role']) || 'user';

    return {
      ...baseUser,
      name: profile?.display_name || displayName,
      avatar: profile?.avatar_url || avatarUrl,
      role: userRole,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return baseUser;
  }
};

// Initialize auth state
const initializeAuth = () => {
  console.log('[Auth] Starting initialization...');
  let initialSessionHandled = false;

  const applySessionState = async (newSession: Session | null, eventSource: string) => {
    try {
      console.log('[Auth] applySessionState source:', eventSource, 'session:', !!newSession);

      if (newSession?.user) {
        const cachedUser = getCachedProfile();
        const basicUser = buildUserFromSession(newSession);
        const immediateUser = (cachedUser && cachedUser.id === newSession.user.id) ? cachedUser : basicUser;

        setAuthState({
          user: immediateUser,
          session: newSession,
          isAuthenticated: true,
          isLoading: false,
        });

        fetchAndEnrichUser(newSession).then(enrichedUser => {
          setCachedProfile(enrichedUser);
          setAuthState({ user: enrichedUser });
        }).catch(err => {
          console.error('[Auth] Error enriching user:', err);
        });
      } else {
        if (eventSource === 'SIGNED_OUT') {
          setCachedProfile(null);
        }
        setAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[Auth] Error applying session state:', error);
      setAuthState({
        user: null,
        session: newSession || null,
        isAuthenticated: !!newSession,
        isLoading: false,
      });
    }
  };
  
  // CRITICAL: Set up onAuthStateChange FIRST before getSession
  // This ensures we don't miss any auth events
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
    console.log('[Auth] onAuthStateChange fired, event:', _event, 'session:', !!newSession);
    if (_event === 'INITIAL_SESSION') {
      initialSessionHandled = true;
    }
    await applySessionState(newSession, _event);
  });

  // Then call getSession to handle existing session from storage
  // Keep this as a safety fallback in case INITIAL_SESSION is delayed/missed
  supabase.auth.getSession()
    .then(async ({ data, error }) => {
      if (error) {
        console.error('[Auth] getSession fallback error:', error);
      }

      if (!initialSessionHandled) {
        console.log('[Auth] Applying getSession fallback, session:', !!data.session);
        await applySessionState(data.session, 'GET_SESSION_FALLBACK');
      }
    })
    .catch((error) => {
      console.error('[Auth] getSession fallback exception:', error);
      if (authState.isLoading) {
        setAuthState({ isLoading: false });
      }
    });

  // Fail-safe: never keep auth loading forever
  setTimeout(() => {
    if (authState.isLoading) {
      console.warn('[Auth] Initialization timeout, forcing loading=false');
      setAuthState({ isLoading: false });
    }
  }, 3000);
  
  return () => subscription?.unsubscribe();
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

      // Wait for onAuthStateChange to fire and update auth state
      // This prevents race condition where UI errors before auth state syncs
      let attempts = 0;
      while (attempts < 20) {
        if (authState.isAuthenticated && authState.user) {
          console.log('[Auth] Session confirmed after login');
          return { success: true };
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // Login succeeded, return true even if state wasn't updated yet
      console.log('[Auth] Login succeeded, returning success');
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
    console.log('[Auth] Logging out...');
    
    // Preserve language preference
    const language = localStorage.getItem('language-storage');
    
    // Clear cached profile immediately
    setCachedProfile(null);
    
    // Sign out from Supabase FIRST (this will clear auth tokens)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth] Error during signOut:', error);
    }
    
    // Clear admin cache explicitly on logout
    localStorage.removeItem('app-admin-status');
    localStorage.removeItem('app-admin-status-time');
    
    // Clear non-auth localStorage items only
    const keysToPreserve = ['language-storage'];
    const keysToDelete: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToPreserve.includes(key) && !key.includes('sb-') && !key.includes('auth') && !key.includes('supabase') && !key.includes('admin')) {
        keysToDelete.push(key);
      }
    }
    
    // Delete non-auth keys
    keysToDelete.forEach(key => localStorage.removeItem(key));
    
    // Preserve language
    if (language) {
      localStorage.setItem('language-storage', language);
    }
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('[Auth] Logout complete');
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
