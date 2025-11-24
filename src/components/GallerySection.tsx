import { useLanguage, translations } from "@/hooks/useLanguage";

const galleryImages = [
  {
    url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    alt: "Tropical garden setting",
  },
  {
    url: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
    alt: "Artisan coffee being poured",
  },
  {
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    alt: "Restaurant interior",
  },
  {
    url: "https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&q=80",
    alt: "Thai cuisine plating",
  },
  {
    url: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    alt: "Outdoor dining area",
  },
  {
    url: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&q=80",
    alt: "Cozy seating area",
  },
];

const GallerySection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section id="gallery" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            {t.galleryTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.gallerySubtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg aspect-square group cursor-pointer animate-scale-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-foreground font-medium">{image.alt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
