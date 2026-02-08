import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useState, useEffect } from "react";

// Cache buster version - stored in localStorage (with SSR safety)
const getCacheBusterVersion = (): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('content_cache_version') || '1';
    }
  } catch (e) {
    // localStorage might not be available (private browsing, SSR, etc.)
  }
  return '1';
};

// Function to update cache version (called from admin panel after updates)
export const invalidateContentCache = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const newVersion = Date.now().toString();
      localStorage.setItem('content_cache_version', newVersion);
      // Dispatch custom event to notify all components
      window.dispatchEvent(new CustomEvent('content-cache-invalidated', { detail: newVersion }));
    }
  } catch (e) {
    // localStorage might not be available
  }
};

// Add cache busting to image URLs using stable version
const addCacheBuster = (url: string | null, version: string): string | null => {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
};

// Hook for cache version state management
const useCacheVersion = () => {
  const [cacheVersion, setCacheVersion] = useState(getCacheBusterVersion);
  
  useEffect(() => {
    const handleCacheInvalidated = (event: CustomEvent) => {
      setCacheVersion(event.detail);
    };
    
    window.addEventListener('content-cache-invalidated', handleCacheInvalidated as EventListener);
    return () => {
      window.removeEventListener('content-cache-invalidated', handleCacheInvalidated as EventListener);
    };
  }, []);
  
  return cacheVersion;
};

// Individual hooks for each data type - load only when needed

export const useHeroContent = () => {
  const cacheVersion = useCacheVersion();
  
  return useQuery({
    queryKey: ["hero-content", cacheVersion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        return { ...data, image_url: addCacheBuster(data.image_url, cacheVersion) };
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useEventSpaces = () => {
  const cacheVersion = useCacheVersion();
  
  return useQuery({
    queryKey: ["event-spaces", cacheVersion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_spaces")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        return { ...data, image_url: addCacheBuster(data.image_url, cacheVersion) };
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useRooms = () => {
  const cacheVersion = useCacheVersion();
  
  return useQuery({
    queryKey: ["rooms", cacheVersion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          images:room_images(*)
        `)
        .eq("is_active", true)
        .order("sort_order");
      
      if (error) throw error;
      return (data || []).map(room => ({
        ...room,
        images: (room.images || []).map((img: any) => ({
          ...img,
          image_url: addCacheBuster(img.image_url, cacheVersion)
        }))
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useMenus = () => {
  const cacheVersion = useCacheVersion();
  
  return useQuery({
    queryKey: ["menus", cacheVersion],
    queryFn: async () => {
      const [categoriesRes, menusRes] = await Promise.all([
        supabase
          .from("menu_categories")
          .select("*")
          .order("sort_order"),
        supabase
          .from("menus")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (menusRes.error) throw menusRes.error;

      return {
        categories: categoriesRes.data || [],
        menus: (menusRes.data || []).map(menu => ({
          ...menu,
          image_url: addCacheBuster(menu.image_url, cacheVersion),
          icon_url: addCacheBuster(menu.icon_url, cacheVersion)
        })),
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGalleryImages = (limit: number = 9) => {
  const cacheVersion = useCacheVersion();
  
  return useQuery({
    queryKey: ["gallery", cacheVersion, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return (data || []).map(img => ({
        ...img,
        image_url: addCacheBuster(img.image_url, cacheVersion)
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useReviews = (limit: number = 9) => {
  const cacheVersion = useCacheVersion();
  
  return useQuery({
    queryKey: ["reviews", cacheVersion, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return (data || []).map(review => ({
        ...review,
        image_url: addCacheBuster(review.image_url, cacheVersion)
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useBusinessInfo = () => {
  const cacheVersion = useCacheVersion();
  
  return useQuery({
    queryKey: ["business_info", cacheVersion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_info")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Utility hook to invalidate all content caches
export const useRefreshContent = () => {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    invalidateContentCache();
    queryClient.invalidateQueries({ queryKey: ["hero-content"] });
    queryClient.invalidateQueries({ queryKey: ["event-spaces"] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["menus"] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
    queryClient.invalidateQueries({ queryKey: ["menu_categories"] });
    queryClient.invalidateQueries({ queryKey: ["business_info"] });
  }, [queryClient]);
};

// Legacy hook for backward compatibility - but now each section should use individual hooks
export const useContentData = () => {
  const heroQuery = useHeroContent();
  const eventsQuery = useEventSpaces();
  const roomsQuery = useRooms();
  const menusQuery = useMenus();
  const galleryQuery = useGalleryImages();
  const reviewsQuery = useReviews();
  const refreshContent = useRefreshContent();

  return {
    hero: heroQuery.data,
    events: eventsQuery.data,
    rooms: roomsQuery.data,
    menus: menusQuery.data,
    gallery: galleryQuery.data,
    reviews: reviewsQuery.data,
    isLoading: 
      heroQuery.isLoading || 
      eventsQuery.isLoading || 
      roomsQuery.isLoading || 
      menusQuery.isLoading || 
      galleryQuery.isLoading || 
      reviewsQuery.isLoading,
    isError: 
      heroQuery.isError || 
      eventsQuery.isError || 
      roomsQuery.isError || 
      menusQuery.isError || 
      galleryQuery.isError || 
      reviewsQuery.isError,
    refreshContent,
  };
};
