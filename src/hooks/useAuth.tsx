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

// Initialize auth state
const initializeAuth = async () => {
  // Set up auth state listener FIRST
  supabase.auth.onAuthStateChange(async (event, session) => {
    let user: User | null = null;
    
    if (session?.user) {
      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .maybeSingle();
      
      user = {
        id: session.user.id,
        name: profile?.display_name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
      };
    }
    
    setAuthState({
      user,
      session,
      isAuthenticated: !!session,
      isLoading: false,
    });
  });

  // THEN check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  
  let user: User | null = null;
  
  if (session?.user) {
    // Defer profile fetch with setTimeout
    setTimeout(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .maybeSingle();
      
      const updatedUser: User = {
        id: session.user.id,
        name: profile?.display_name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
      };
      
      setAuthState({ user: updatedUser });
    }, 0);
    
    user = {
      id: session.user.id,
      name: session.user.email?.split('@')[0] || 'User',
      email: session.user.email || '',
    };
  }
  
  setAuthState({
    user,
    session,
    isAuthenticated: !!session,
    isLoading: false,
  });
};

// Initialize on module load
initializeAuth();

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(authState);

  useEffect(() => {
    listeners.add(setState);
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
