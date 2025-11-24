import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Presentation, Utensils, Wifi } from "lucide-react";
import eventsImage from "@/assets/events-conference.jpg";
import { useLanguage, translations } from "@/hooks/useLanguage";

const EventsSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section id="events" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t.eventsTitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.eventsSubtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="animate-fade-in">
            <img
              src={eventsImage}
              alt="Conference Room"
              className="rounded-lg shadow-lg w-full h-[400px] object-cover"
            />
          </div>

          <div className="space-y-6 animate-fade-in">
            <h3 className="text-3xl font-bold text-foreground">
              {t.eventsMainTitle}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {t.eventsMainDesc}
            </p>

            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-foreground mb-4">
                {t.ourServices}
              </h4>

              <div className="flex gap-3 items-start">
                <div className="bg-muted p-3 rounded-lg">
                  <Presentation className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h5 className="font-semibold text-foreground mb-1">
                    {t.presentationRoom}
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {t.presentationRoomDesc}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="bg-muted p-3 rounded-lg">
                  <Utensils className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h5 className="font-semibold text-foreground mb-1">
                    {t.cateringService}
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {t.cateringServiceDesc}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="bg-muted p-3 rounded-lg">
                  <Wifi className="w-6 h-6 text-highlight" />
                </div>
                <div>
                  <h5 className="font-semibold text-foreground mb-1">
                    {t.privateEvents}
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {t.privateEventsDesc}
                  </p>
                </div>
              </div>
            </div>

            <Button variant="highlight" size="lg" className="mt-6">
              {t.inquirePrice}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow animate-fade-in bg-card">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Presentation className="w-8 h-8 text-highlight" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-foreground">
              {t.presentationRoomShort}
            </h4>
            <p className="text-muted-foreground">
              {t.presentationRoomShortDesc}
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow animate-fade-in bg-card">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-highlight" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-foreground">
              {t.cateringServiceShort}
            </h4>
            <p className="text-muted-foreground">
              {t.cateringServiceShortDesc}
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow animate-fade-in bg-card">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-highlight" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-foreground">
              {t.privateEvents}
            </h4>
            <p className="text-muted-foreground">
              {t.privateEventsDesc}
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
