import { useState, useEffect } from "react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface FeaturePanel {
  id: string;
  title_th: string;
  title_en: string;
  subtitle_th: string | null;
  subtitle_en: string | null;
  image_url: string | null;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const FeaturesSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: panels = [], isLoading } = useQuery({
    queryKey: ["feature-panels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_panels")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as FeaturePanel[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto px-5 flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (panels.length === 0) return null;

  return (
    <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-background to-card relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-5 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-primary/60" />
            <span className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary font-medium">
              {language === 'th' ? 'ประสบการณ์พิเศษ' : 'Premium Experience'}
            </span>
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-primary/60" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif leading-tight">
            {t.featuresTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.featuresSubtitle}
          </p>
        </div>

        {/* Horizontal Accordion - Desktop */}
        <div className="hidden md:flex gap-2 h-[400px] lg:h-[480px] rounded-2xl overflow-hidden">
          {panels.map((panel, index) => {
            const isActive = activeIndex === index;
            const title = language === "th" ? panel.title_th : panel.title_en;
            const subtitle = language === "th" ? panel.subtitle_th : panel.subtitle_en;

            return (
              <div
                key={panel.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  isActive ? "flex-[4]" : "flex-[0.8]"
                )}
              >
                {/* Background Image */}
                {panel.image_url ? (
                  <img
                    src={panel.image_url}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                )}

                {/* Overlay */}
                <div className={cn(
                  "absolute inset-0 transition-all duration-500",
                  isActive
                    ? "bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent"
                    : "bg-foreground/50"
                )} />

                {/* Logo (shown on collapsed panels) */}
                {!isActive && panel.logo_url && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-500">
                    <img
                      src={panel.logo_url}
                      alt=""
                      className="w-10 h-10 object-contain rounded-lg bg-background/90 p-1.5 shadow-md"
                    />
                  </div>
                )}

                {/* Vertical title on collapsed panels */}
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span
                      className="text-background font-semibold text-sm tracking-wider whitespace-nowrap"
                      style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                    >
                      {title}
                    </span>
                  </div>
                )}

                {/* Active panel content */}
                {isActive && (
                  <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 lg:p-8">
                    {panel.logo_url && (
                      <img
                        src={panel.logo_url}
                        alt=""
                        className="w-14 h-14 object-contain rounded-xl bg-background/90 p-2 shadow-lg mb-4 animate-fade-in"
                      />
                    )}
                    <h3 className="text-2xl lg:text-3xl font-bold text-background font-serif mb-2 animate-fade-in">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-background/80 text-sm lg:text-base max-w-md animate-fade-in">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile - Stacked Cards */}
        <div className="md:hidden space-y-3">
          {panels.map((panel, index) => {
            const isActive = activeIndex === index;
            const title = language === "th" ? panel.title_th : panel.title_en;
            const subtitle = language === "th" ? panel.subtitle_th : panel.subtitle_en;

            return (
              <div
                key={panel.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-xl transition-all duration-500 ease-out",
                  isActive ? "h-56" : "h-16"
                )}
              >
                {panel.image_url ? (
                  <img
                    src={panel.image_url}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                )}

                <div className={cn(
                  "absolute inset-0 transition-all duration-500",
                  isActive
                    ? "bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent"
                    : "bg-foreground/50"
                )} />

                <div className="absolute inset-0 z-10 flex items-end p-4">
                  <div>
                    <div className="flex items-center gap-3">
                      {panel.logo_url && (
                        <img
                          src={panel.logo_url}
                          alt=""
                          className={cn(
                            "object-contain rounded-lg bg-background/90 p-1 shadow-md transition-all duration-300",
                            isActive ? "w-10 h-10" : "w-8 h-8"
                          )}
                        />
                      )}
                      <h3 className={cn(
                        "font-bold text-background font-serif transition-all duration-300",
                        isActive ? "text-xl" : "text-base"
                      )}>
                        {title}
                      </h3>
                    </div>
                    {isActive && subtitle && (
                      <p className="text-background/80 text-sm mt-2 animate-fade-in">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom decorative element */}
        <div className="flex justify-center mt-10 sm:mt-16">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/30" />
            <div className="w-8 h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
            <div className="w-2 h-2 rounded-full bg-primary/20" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
