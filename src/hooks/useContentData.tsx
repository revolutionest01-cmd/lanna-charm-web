import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Add cache busting to image URLs
const addCacheBuster = (url: string | null): string | null => {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
};

// Fetch all content data in parallel for better performance
export const useContentData = () => {
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
      if (data) {
        return { ...data, image_url: addCacheBuster(data.image_url) };
      }
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds - shorter for faster updates
    refetchOnWindowFocus: true,
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
      if (data) {
        return { ...data, image_url: addCacheBuster(data.image_url) };
      }
      return data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
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
      // Add cache buster to room images
      return (data || []).map(room => ({
        ...room,
        images: (room.images || []).map((img: any) => ({
          ...img,
          image_url: addCacheBuster(img.image_url)
        }))
      }));
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
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
        menus: (menusRes.data || []).map(menu => ({
          ...menu,
          image_url: addCacheBuster(menu.image_url),
          icon_url: addCacheBuster(menu.icon_url)
        })),
      };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
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
      return (data || []).map(img => ({
        ...img,
        image_url: addCacheBuster(img.image_url)
      }));
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
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
      return (data || []).map(review => ({
        ...review,
        image_url: addCacheBuster(review.image_url)
      }));
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
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
  };
};
