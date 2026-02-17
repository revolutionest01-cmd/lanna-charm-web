import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

// Individual hooks for each data type - load only when needed

export const useHeroContent = () => {
  return useQuery({
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useEventSpaces = () => {
  return useQuery({
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useRooms = () => {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`*, images:room_images(*)`)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useMenus = () => {
  return useQuery({
    queryKey: ["menus"],
    queryFn: async () => {
      const [categoriesRes, menusRes] = await Promise.all([
        supabase.from("menu_categories").select("*").order("sort_order"),
        supabase.from("menus").select("*").eq("is_active", true).order("sort_order"),
      ]);
      if (categoriesRes.error) throw categoriesRes.error;
      if (menusRes.error) throw menusRes.error;
      return {
        categories: categoriesRes.data || [],
        menus: menusRes.data || [],
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGalleryImages = (limit: number = 9) => {
  return useQuery({
    queryKey: ["gallery", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useReviews = (limit: number = 9) => {
  return useQuery({
    queryKey: ["reviews", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useBusinessInfo = () => {
  return useQuery({
    queryKey: ["business_info"],
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

// Function to invalidate all content caches (called from admin panel after updates)
export const invalidateContentCache = (): void => {
  // No-op — admin components call useRefreshContent().refreshContent() directly
};

// Utility hook to invalidate all content caches
export const useRefreshContent = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
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

// Legacy hook for backward compatibility
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
