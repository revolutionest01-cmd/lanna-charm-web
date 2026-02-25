import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const ROLE_CACHE_KEY = 'app-role-status';
const ROLE_CACHE_EXPIRY_KEY = 'app-role-status-time';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface RoleCache {
  userId: string;
  role: string;
  timestamp: number;
}

// Developer user ID - hardcoded for protection
const DEVELOPER_USER_ID = '1b74b1f1-20bd-4772-9fd8-5dda97ec7488';

/**
 * Hook for checking user role (developer, admin, staff, user)
 */
export const useAdminStatus = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [userRole, setUserRole] = useState<string>(() => {
    try {
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      if (cached) {
        const data: RoleCache = JSON.parse(cached);
        return data.role;
      }
    } catch {}
    return 'user';
  });
  const [isChecking, setIsChecking] = useState(true);

  const isAdmin = userRole === 'admin' || userRole === 'developer';
  const isDeveloper = userRole === 'developer';
  const isStaff = userRole === 'staff' || isAdmin;

  const getCachedRole = (userId: string): string | null => {
    try {
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      const timestamp = localStorage.getItem(ROLE_CACHE_EXPIRY_KEY);
      if (!cached || !timestamp) return null;
      if (Date.now() - parseInt(timestamp, 10) > CACHE_DURATION) {
        localStorage.removeItem(ROLE_CACHE_KEY);
        localStorage.removeItem(ROLE_CACHE_EXPIRY_KEY);
        return null;
      }
      const data: RoleCache = JSON.parse(cached);
      if (data.userId !== userId) {
        localStorage.removeItem(ROLE_CACHE_KEY);
        localStorage.removeItem(ROLE_CACHE_EXPIRY_KEY);
        return null;
      }
      return data.role;
    } catch {
      return null;
    }
  };

  const cacheRole = (userId: string, role: string) => {
    try {
      localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, role, timestamp: Date.now() }));
      localStorage.setItem(ROLE_CACHE_EXPIRY_KEY, Date.now().toString());
    } catch {}
  };

  const checkRoleFromDB = async (userId: string): Promise<string> => {
    try {
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) return 'user';
          return data.role as string;
        });
      const role = await Promise.race([queryPromise, timeoutPromise]);
      cacheRole(userId, role);
      return role;
    } catch {
      const cached = getCachedRole(userId);
      return cached || 'user';
    }
  };

  useEffect(() => {
    const update = async () => {
      if (isLoading) return;
      if (!isAuthenticated || !user) {
        setUserRole('user');
        setIsChecking(false);
        localStorage.removeItem(ROLE_CACHE_KEY);
        localStorage.removeItem(ROLE_CACHE_EXPIRY_KEY);
        return;
      }

      const cached = getCachedRole(user.id);
      if (cached) {
        setUserRole(cached);
        setIsChecking(false);
        // Background verify
        checkRoleFromDB(user.id).then(dbRole => {
          if (dbRole !== cached) setUserRole(dbRole);
        });
        return;
      }

      setIsChecking(true);
      const role = await checkRoleFromDB(user.id);
      setUserRole(role);
      setIsChecking(false);
    };
    update();
  }, [user?.id, isAuthenticated, isLoading]);

  return {
    isAdmin,
    isDeveloper,
    isStaff,
    userRole,
    isChecking,
  };
};

export const DEVELOPER_ID = DEVELOPER_USER_ID;

export const clearAdminCache = () => {
  localStorage.removeItem(ROLE_CACHE_KEY);
  localStorage.removeItem(ROLE_CACHE_EXPIRY_KEY);
};
