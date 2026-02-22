import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const ADMIN_CACHE_KEY = 'app-admin-status';
const ADMIN_CACHE_EXPIRY_KEY = 'app-admin-status-time';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

interface AdminCache {
  userId: string;
  isAdmin: boolean;
  timestamp: number;
}

/**
 * Hook for checking and caching admin status
 * Loads from localStorage first (for instant UX), then verifies with database
 */
export const useAdminStatus = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    // Initialize from cache if available (even during auth initialization)
    try {
      const cached = localStorage.getItem(ADMIN_CACHE_KEY);
      if (cached) {
        const data: AdminCache = JSON.parse(cached);
        console.log('[AdminStatus] Initialized from cache:', data.isAdmin);
        return data.isAdmin;
      }
    } catch (error) {
      console.warn('[AdminStatus] Error initializing from cache:', error);
    }
    return false;
  });
  const [isChecking, setIsChecking] = useState(true);

  // Load cached admin status from localStorage
  const getCachedAdminStatus = (userId: string): boolean | null => {
    try {
      const cached = localStorage.getItem(ADMIN_CACHE_KEY);
      const timestamp = localStorage.getItem(ADMIN_CACHE_EXPIRY_KEY);
      
      if (!cached || !timestamp) return null;
      
      const cacheTime = parseInt(timestamp, 10);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cacheTime > CACHE_DURATION) {
        console.log('[AdminStatus] Cache expired');
        localStorage.removeItem(ADMIN_CACHE_KEY);
        localStorage.removeItem(ADMIN_CACHE_EXPIRY_KEY);
        return null;
      }
      
      const cachedData: AdminCache = JSON.parse(cached);
      
      // Verify cache is for the current user
      if (cachedData.userId !== userId) {
        console.log('[AdminStatus] Cache is for different user, ignoring');
        localStorage.removeItem(ADMIN_CACHE_KEY);
        localStorage.removeItem(ADMIN_CACHE_EXPIRY_KEY);
        return null;
      }
      
      console.log('[AdminStatus] Using cached admin status:', cachedData.isAdmin);
      return cachedData.isAdmin;
    } catch (error) {
      console.warn('[AdminStatus] Error reading cache:', error);
      return null;
    }
  };

  // Cache admin status to localStorage
  const cacheAdminStatus = (userId: string, isAdminValue: boolean) => {
    try {
      const data: AdminCache = {
        userId,
        isAdmin: isAdminValue,
        timestamp: Date.now(),
      };
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(ADMIN_CACHE_EXPIRY_KEY, Date.now().toString());
      console.log('[AdminStatus] Cached admin status:', isAdminValue);
    } catch (error) {
      console.warn('[AdminStatus] Error caching admin status:', error);
    }
  };

  // Check admin status from database
  const checkAdminStatusFromDB = async (userId: string): Promise<boolean> => {
    try {
      console.log('[AdminStatus] Checking admin status from database for user:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Database check timeout')), 5000)
      );
      
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single()
        .then(({ data, error }) => {
          console.log('[AdminStatus] Query result - data:', data, 'error:', error?.message);
          const isAdminUser = !!data && data.role === 'admin' && !error;
          return isAdminUser;
        });
        
      const isAdminUser = await Promise.race([queryPromise, timeoutPromise]);
      console.log('[AdminStatus] Database check completed:', isAdminUser);
      
      // Cache the result
      cacheAdminStatus(userId, isAdminUser);
      
      return isAdminUser;
    } catch (error) {
      console.error('[AdminStatus] Error checking admin status:', error);
      // Try to use cache as fallback
      const cached = getCachedAdminStatus(userId);
      if (cached !== null) {
        console.log('[AdminStatus] Using cached status as fallback:', cached);
        return cached;
      }
      console.log('[AdminStatus] No fallback cache available, returning false');
      return false;
    }
  };

  useEffect(() => {
    const updateAdminStatus = async () => {
      console.log('[AdminStatus] Effect triggered - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user?.id);
      
      // Only process when auth is fully loaded
      if (isLoading) {
        console.log('[AdminStatus] Auth still loading, waiting...');
        return; // Wait for auth to finish loading
      }

      if (!isAuthenticated || !user) {
        console.log('[AdminStatus] No authenticated user');
        setIsAdmin(false);
        setIsChecking(false);
        // Clear cache if user logs out
        localStorage.removeItem(ADMIN_CACHE_KEY);
        localStorage.removeItem(ADMIN_CACHE_EXPIRY_KEY);
        return;
      }

      console.log('[AdminStatus] Auth loaded, checking admin status for:', user.id);
      
      // 1. Try to load from cache first (instant feedback)
      const cachedStatus = getCachedAdminStatus(user.id);
      if (cachedStatus !== null) {
        console.log('[AdminStatus] Using cached admin status:', cachedStatus);
        setIsAdmin(cachedStatus);
        
        // Verify in background
        console.log('[AdminStatus] Verifying cache with database in background...');
        checkAdminStatusFromDB(user.id).catch(error => {
          console.error('[AdminStatus] Background verification failed:', error);
        });
        
        setIsChecking(false);
        return;
      }
      
      // 2. No cache, check database
      console.log('[AdminStatus] No cached status, checking database...');
      setIsChecking(true);
      try {
        const dbStatus = await checkAdminStatusFromDB(user.id);
        console.log('[AdminStatus] Admin check complete, result:', dbStatus);
        setIsAdmin(dbStatus);
      } catch (error) {
        console.error('[AdminStatus] Error checking admin:', error);
        // Keep existing state on error
      } finally {
        setIsChecking(false);
      }
    };

    updateAdminStatus();
  }, [user?.id, isAuthenticated, isLoading]); // Only re-run when user ID or auth state changes

  return {
    isAdmin,
    isChecking,
  };
};

/**
 * Clear admin cache when needed
 */
export const clearAdminCache = () => {
  localStorage.removeItem(ADMIN_CACHE_KEY);
  localStorage.removeItem(ADMIN_CACHE_EXPIRY_KEY);
  console.log('[AdminStatus] Admin cache cleared');
};
