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
    <section id="features" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            {t.featuresTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.featuresSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <feature.icon className="text-primary" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
