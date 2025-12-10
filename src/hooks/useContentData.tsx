import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useRef } from "react";

// Cache buster version - increment this when admin updates content
// This is stored in localStorage to persist across page loads
const getCacheBusterVersion = (): string => {
  return localStorage.getItem('content_cache_version') || '1';
};

// Function to update cache version (called from admin panel after updates)
export const invalidateContentCache = (): void => {
  const newVersion = Date.now().toString();
  localStorage.setItem('content_cache_version', newVersion);
};

// Add cache busting to image URLs using stable version
const addCacheBuster = (url: string | null, version: string): string | null => {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
};

// Fetch all content data in parallel for better performance
export const useContentData = () => {
  const queryClient = useQueryClient();
  
  // Get stable cache version that only changes on admin updates
  const cacheVersionRef = useRef(getCacheBusterVersion());
  
  // Function to refresh all content (called after admin updates)
  const refreshContent = useCallback(() => {
    invalidateContentCache();
    cacheVersionRef.current = getCacheBusterVersion();
    queryClient.invalidateQueries({ queryKey: ["hero-content"] });
    queryClient.invalidateQueries({ queryKey: ["event-spaces"] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["menus"] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  }, [queryClient]);

  const cacheVersion = cacheVersionRef.current;

  // Hero Content
  const heroQuery = useQuery({
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
    staleTime: 5 * 60 * 1000, // 5 minutes - stable cache
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent flickering
  });

  // Event Spaces
  const eventsQuery = useQuery({
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

  // Rooms with Images (using JOIN)
  const roomsQuery = useQuery({
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
      // Add cache buster to room images
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

  // Menu Categories and Items
  const menusQuery = useQuery({
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

  // Gallery Images
  const galleryQuery = useQuery({
    queryKey: ["gallery", cacheVersion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .limit(9);
      
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

  // Reviews
  const reviewsQuery = useQuery({
    queryKey: ["reviews", cacheVersion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(9);
      
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
    refreshContent, // Export refresh function for admin panel
  };
};
