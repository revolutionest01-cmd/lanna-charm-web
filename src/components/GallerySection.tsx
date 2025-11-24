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
  return (
    <section id="gallery" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            Gallery
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A glimpse into our serene sanctuary
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
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
