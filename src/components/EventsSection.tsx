import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Presentation, Utensils, Wifi } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useEventSpaces } from "@/hooks/useContentData";
import { EventSkeleton } from "@/components/SkeletonCard";
import StaggerReveal from "@/components/StaggerReveal";

interface EventSpace {
  id: string;
  title_th: string;
  title_en: string;
  description_th: string | null;
  description_en: string | null;
  image_url: string | null;
  keywords_th: string | null;
  keywords_en: string | null;
  is_active: boolean | null;
}

const EventsSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { data: eventSpace, isLoading: loading } = useEventSpaces();

  if (loading) {
    return (
      <section id="events" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              {t.eventsTitle}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t.eventsSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <EventSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const title = language === "th" ? eventSpace?.title_th : eventSpace?.title_en;
  const description = language === "th" ? eventSpace?.description_th : eventSpace?.description_en;
  const imageUrl = eventSpace?.image_url;

  return (
    <section id="events" className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-10 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-foreground">
            {t.eventsTitle}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-2">
            {t.eventsSubtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center mb-10 sm:mb-12">
          <div className="animate-fade-in order-1">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={title || "Conference Room"}
              className="rounded-xl sm:rounded-lg shadow-lg w-full h-[220px] sm:h-[300px] md:h-[400px] object-cover"
            />
          </div>

          <div className="space-y-4 sm:space-y-6 animate-fade-in order-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {description}
            </p>

            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
                {t.ourServices}
              </h4>

              <div className="flex gap-3 items-start">
                <div className="bg-muted p-2.5 sm:p-3 rounded-lg flex-shrink-0">
                  <Presentation className="w-5 h-5 sm:w-6 sm:h-6 text-highlight" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {t.presentationRoom}
                  </h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t.presentationRoomDesc}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="bg-muted p-2.5 sm:p-3 rounded-lg flex-shrink-0">
                  <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-highlight" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {t.cateringService}
                  </h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t.cateringServiceDesc}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="bg-muted p-2.5 sm:p-3 rounded-lg flex-shrink-0">
                  <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-highlight" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {t.privateEvents}
                  </h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t.privateEventsDesc}
                  </p>
                </div>
              </div>
            </div>

            <Button variant="highlight" size="lg" className="mt-4 sm:mt-6 w-full sm:w-auto h-12 sm:h-11 text-base rounded-xl sm:rounded-lg">
              {t.inquirePrice}
            </Button>
          </div>
        </div>

        <StaggerReveal 
          animation="zoom-in" 
          staggerDelay={150} 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12"
        >
          <Card className="p-5 sm:p-6 text-center hover:shadow-lg transition-shadow bg-card">
            <div className="bg-muted w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Presentation className="w-7 h-7 sm:w-8 sm:h-8 text-highlight" />
            </div>
            <h4 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
              {t.presentationRoomShort}
            </h4>
            <p className="text-muted-foreground text-sm">
              {t.presentationRoomShortDesc}
            </p>
          </Card>

          <Card className="p-5 sm:p-6 text-center hover:shadow-lg transition-shadow bg-card">
            <div className="bg-muted w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Utensils className="w-7 h-7 sm:w-8 sm:h-8 text-highlight" />
            </div>
            <h4 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
              {t.cateringServiceShort}
            </h4>
            <p className="text-muted-foreground text-sm">
              {t.cateringServiceShortDesc}
            </p>
          </Card>

          <Card className="p-5 sm:p-6 text-center hover:shadow-lg transition-shadow bg-card">
            <div className="bg-muted w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Wifi className="w-7 h-7 sm:w-8 sm:h-8 text-highlight" />
            </div>
            <h4 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
              {t.privateEvents}
            </h4>
            <p className="text-muted-foreground text-sm">
              {t.privateEventsDesc}
            </p>
          </Card>
        </StaggerReveal>
      </div>
    </section>
  );
};

export default EventsSection;
