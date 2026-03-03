import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface SectionHeading {
  id: string;
  section_key: string;
  title_th: string;
  title_en: string;
  subtitle_th: string | null;
  subtitle_en: string | null;
}

export const useSectionHeading = (sectionKey: string) => {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["section-heading", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("section_headings")
        .select("*")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) throw error;
      return data as SectionHeading | null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    title: data ? (language === "th" ? data.title_th : data.title_en) : null,
    subtitle: data ? (language === "th" ? data.subtitle_th : data.subtitle_en) : null,
    isLoading,
    data,
  };
};
