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
    console.log('[Auth] Starting initialization...');
    
    // First, get the session from localStorage/Supabase
    console.log('[Auth] Getting initial session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Auth] Error getting session:', error.message);
    }
    
    if (session?.user) {
      console.log('[Auth] Found existing session:', session.user.email);
      const basicUser = buildUserFromSession(session);
      setAuthState({
        user: basicUser,
        session,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Enrich with profile data in background
      fetchAndEnrichUser(session).then(enrichedUser => {
        setAuthState({ user: enrichedUser });
      }).catch(err => {
        console.error('[Auth] Error enriching user:', err);
      });
    } else {
      console.log('[Auth] No existing session found');
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
    
    // Set up auth state listener for future changes (login/logout/refresh)
    const unsubscribe = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        console.log('[Auth] onAuthStateChange fired, event:', _event, 'session:', !!newSession);
        
        if (newSession?.user) {
          const basicUser = buildUserFromSession(newSession);
          console.log('[Auth] Session updated in listener:', basicUser.email);
          setAuthState({
            user: basicUser,
            session: newSession,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Enrich with profile data in background
          const enrichedUser = await fetchAndEnrichUser(newSession);
          setAuthState({ user: enrichedUser });
        } else {
          console.log('[Auth] Session cleared in listener');
          setAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('[Auth] Error in state change handler:', error);
        setAuthState({
          user: null,
          session: newSession || null,
          isAuthenticated: !!newSession,
          isLoading: false,
        });
      }
    });
    
    // Keep the unsubscribe for potential cleanup
    return () => unsubscribe?.();
  } catch (error) {
    console.error('[Auth] Initialization error:', error);
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
    console.log('[Auth] Logging out...');
    
    // Preserve language preference
    const language = localStorage.getItem('language-storage');
    
    // Sign out from Supabase FIRST (this will clear auth tokens)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth] Error during signOut:', error);
    }
    
    // Clear non-auth localStorage items only
    const keysToPreserve = ['language-storage'];
    const keysToDelete: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToPreserve.includes(key) && !key.includes('sb-') && !key.includes('auth') && !key.includes('supabase')) {
        keysToDelete.push(key);
      }
    }
    
    // Delete non-auth keys
    keysToDelete.forEach(key => localStorage.removeItem(key));
    
    // Preserve language
    if (language) {
      localStorage.setItem('language-storage', language);
    }
    
    // Clear sessionStorage (it's not persisted anyway)
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
