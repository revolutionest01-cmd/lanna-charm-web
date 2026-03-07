import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";

interface CustomSection {
  id: string;
  section_type: string;
  title_th: string;
  title_en: string;
  subtitle_th: string | null;
  subtitle_en: string | null;
  content: any;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
}

const DynamicSections = () => {
  const { language } = useLanguage();
  const [sections, setSections] = useState<CustomSection[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("custom_sections")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      if (data) setSections(data as unknown as CustomSection[]);
    };
    fetch();
  }, []);

  const t = (th: string | null | undefined, en: string | null | undefined) => {
    if (language === "th") return th || en || "";
    return en || th || "";
  };

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section, i) => (
        <ScrollReveal key={section.id} animation="fade-up" delay={i % 2 === 0 ? 0 : 100}>
          <div className={i % 2 === 0 ? "section-glow" : ""}>
            <SectionRenderer section={section} t={t} language={language} />
          </div>
        </ScrollReveal>
      ))}
    </>
  );
};

interface RendererProps {
  section: CustomSection;
  t: (th: string | null | undefined, en: string | null | undefined) => string;
  language: string;
}

const SectionRenderer = ({ section, t, language }: RendererProps) => {
  const title = t(section.title_th, section.title_en);
  const subtitle = t(section.subtitle_th, section.subtitle_en);

  switch (section.section_type) {
    case "text_image":
      return <TextImageSection section={section} title={title} subtitle={subtitle} t={t} />;
    case "banner":
      return <BannerSection section={section} title={title} subtitle={subtitle} t={t} />;
    case "grid_cards":
      return <GridCardsSection section={section} title={title} subtitle={subtitle} t={t} language={language} />;
    case "rich_text":
      return <RichTextSection section={section} title={title} subtitle={subtitle} t={t} language={language} />;
    default:
      return null;
  }
};

/* ─── Text + Image ─── */
const TextImageSection = ({ section, title, subtitle, t }: RendererProps & { title: string; subtitle: string }) => {
  const content = section.content || {};
  const isLeft = content.image_position === "left";
  const text = t(content.text_th, content.text_en);
  const ctaText = t(content.cta_text_th, content.cta_text_en);

  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}
        <div className={`flex flex-col ${isLeft ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 items-center`}>
          {section.image_url && (
            <div className="w-full lg:w-1/2">
              <img src={section.image_url} alt={title} className="rounded-2xl w-full object-cover max-h-[400px] shadow-lg" />
            </div>
          )}
          <div className={`w-full ${section.image_url ? "lg:w-1/2" : ""} space-y-4`}>
            {text && <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{text}</p>}
            {ctaText && content.cta_url && (
              <Button asChild>
                <a href={content.cta_url} target="_blank" rel="noopener noreferrer">{ctaText}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Promo Banner ─── */
const BannerSection = ({ section, title, subtitle, t }: RendererProps & { title: string; subtitle: string }) => {
  const content = section.content || {};
  const ctaText = t(content.cta_text_th, content.cta_text_en);

  return (
    <section className="py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div
          className="relative rounded-2xl overflow-hidden min-h-[220px] sm:min-h-[280px] flex items-center justify-center"
          style={{
            backgroundImage: section.image_url ? `url(${section.image_url})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: content.overlay_color || "rgba(0,0,0,0.4)" }} />
          <div className="relative z-10 text-center px-6 py-8">
            {title && <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">{title}</h2>}
            {subtitle && <p className="text-white/80 text-sm sm:text-base max-w-lg mx-auto mb-4">{subtitle}</p>}
            {ctaText && content.cta_url && (
              <Button variant="secondary" size="lg" asChild>
                <a href={content.cta_url} target="_blank" rel="noopener noreferrer">{ctaText}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Grid Cards ─── */
const GridCardsSection = ({ section, title, subtitle, t, language }: RendererProps & { title: string; subtitle: string }) => {
  const cards = section.content?.cards || [];
  if (cards.length === 0) return null;
  const cols = cards.length <= 2 ? "sm:grid-cols-2" : cards.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}
        <div className={`grid grid-cols-1 ${cols} gap-4 sm:gap-6`}>
          {cards.map((card: any, i: number) => (
            <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
              {card.image_url && (
                <img src={card.image_url} alt={t(card.title_th, card.title_en)} className="w-full h-40 object-cover" />
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">{t(card.title_th, card.title_en)}</h3>
                {(card.description_th || card.description_en) && (
                  <p className="text-sm text-muted-foreground mt-1">{t(card.description_th, card.description_en)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Rich Text ─── */
const RichTextSection = ({ section, title, subtitle, t, language }: RendererProps & { title: string; subtitle: string }) => {
  const html = language === "th" ? (section.content?.html_th || section.content?.html_en) : (section.content?.html_en || section.content?.html_th);

  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>
        )}
        {html && (
          <div
            className="prose prose-sm sm:prose-base max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </section>
  );
};

export default DynamicSections;
