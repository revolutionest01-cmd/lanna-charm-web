import { Coffee, Home, Leaf, Wifi } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage, translations } from "@/hooks/useLanguage";

const FeaturesSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const features = [
    {
      icon: Coffee,
      title: t.artisanCoffee,
      description: t.artisanCoffeeDesc,
    },
    {
      icon: Home,
      title: t.traditionalArchitecture,
      description: t.traditionalArchitectureDesc,
    },
    {
      icon: Leaf,
      title: t.gardenSetting,
      description: t.gardenSettingDesc,
    },
    {
      icon: Wifi,
      title: t.authenticCuisine,
      description: t.authenticCuisineDesc,
    },
  ];

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-20 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 font-serif">
            {t.featuresTitle}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
            {t.featuresSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-4 sm:p-5 lg:p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
                  <feature.icon className="text-primary" size={24} />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground line-clamp-3 sm:line-clamp-none">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
