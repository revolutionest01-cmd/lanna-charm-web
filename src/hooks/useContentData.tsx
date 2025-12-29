import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

// Function to invalidate all content caches
export const invalidateContentCache = (): void => {
  // Dispatch custom event to notify all components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('content-cache-invalidated'));
  }
};

// Fetch all content data in parallel for better performance
export const useContentData = () => {
  const queryClient = useQueryClient();
  
  // Function to refresh all content (called after admin updates)
  const refreshContent = useCallback(() => {
    // Invalidate all queries to force refetch
    queryClient.invalidateQueries({ queryKey: ["hero-content"] });
    queryClient.invalidateQueries({ queryKey: ["event-spaces"] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["menus"] });
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
    queryClient.invalidateQueries({ queryKey: ["menu_categories"] });
    queryClient.invalidateQueries({ queryKey: ["business_info"] });
    queryClient.invalidateQueries({ queryKey: ["business_info_footer"] });
    queryClient.invalidateQueries({ queryKey: ["visitor_stats"] });
  }, [queryClient]);

  // Common query options for faster loading
  const queryOptions = {
    staleTime: 30 * 1000, // 30 seconds - data is fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests twice
  };

  // Hero Content
  const heroQuery = useQuery({
    queryKey: ["hero-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    ...queryOptions,
  });

  // Event Spaces
  const eventsQuery = useQuery({
    queryKey: ["event-spaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_spaces")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    ...queryOptions,
  });

  // Rooms with Images (using JOIN)
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
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
      return data || [];
    },
    ...queryOptions,
  });

  // Menu Categories and Items
  const menusQuery = useQuery({
    queryKey: ["menus"],
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
        menus: menusRes.data || [],
      };
    },
    ...queryOptions,
  });

  // Gallery Images
  const galleryQuery = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .limit(9);
      
      if (error) throw error;
      return data || [];
    },
    ...queryOptions,
  });

  // Reviews
  const reviewsQuery = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(9);
      
      if (error) throw error;
      return data || [];
    },
    ...queryOptions,
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
    refreshContent,
  };
};
