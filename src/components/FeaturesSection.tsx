import { Coffee, Home, Leaf, UtensilsCrossed } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";

const FeaturesSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const features = [
    {
      icon: Coffee,
      title: t.artisanCoffee,
      description: t.artisanCoffeeDesc,
      accent: "from-amber-500/20 to-orange-500/20",
    },
    {
      icon: Home,
      title: t.traditionalArchitecture,
      description: t.traditionalArchitectureDesc,
      accent: "from-emerald-500/20 to-teal-500/20",
    },
    {
      icon: Leaf,
      title: t.gardenSetting,
      description: t.gardenSettingDesc,
      accent: "from-green-500/20 to-lime-500/20",
    },
    {
      icon: UtensilsCrossed,
      title: t.authenticCuisine,
      description: t.authenticCuisineDesc,
      accent: "from-rose-500/20 to-pink-500/20",
    },
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background to-card relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Premium header with decorative line */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/60" />
            <span className="text-sm uppercase tracking-[0.3em] text-primary font-medium">
              {language === 'th' ? 'ประสบการณ์พิเศษ' : 'Premium Experience'}
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/60" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-serif leading-tight">
            {t.featuresTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.featuresSubtitle}
          </p>
        </div>

        {/* Premium feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative animate-scale-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Card with premium styling */}
              <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-3">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon container with premium styling */}
                  <div className="mb-6 relative">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10">
                      <feature.icon className="text-primary transition-transform duration-500 group-hover:scale-110" size={28} strokeWidth={1.5} />
                    </div>
                    {/* Decorative dot */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-foreground mb-3 font-serif transition-colors duration-300 group-hover:text-primary">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className="mt-6 h-0.5 w-0 bg-gradient-to-r from-primary to-primary/50 transition-all duration-500 group-hover:w-full rounded-full" />
                </div>
              </div>

              {/* Card number indicator */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                0{index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom decorative element */}
        <div className="flex justify-center mt-16">
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
