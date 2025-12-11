import { useLanguage, translations } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useContentData } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ReviewSkeleton } from "@/components/SkeletonCard";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text_en: string;
  review_text_th: string;
  created_at: string;
};

const ReviewsSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { reviews = [], isLoading: loading } = useContentData();

  if (loading) {
    return (
      <section id="reviews" className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
              {t.reviewsTitle}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t.reviewsSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <ReviewSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
            {t.reviewsTitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.reviewsSubtitle}
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{language === "th" ? "ยังไม่มีรีวิว" : "No reviews yet"}</p>
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            className="w-full max-w-7xl mx-auto"
          >
            <CarouselContent>
              {reviews.map((review, index) => (
                <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card
                    className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in border-border/50 h-full"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-foreground">{review.customer_name}</h3>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-muted text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {language === "th" ? review.review_text_th : review.review_text_en}
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        {new Date(review.created_at).toLocaleDateString(
                          language === "th" ? "th-TH" : "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        )}

        {/* View All Reviews Button */}
        {reviews.length > 0 && (
          <div className="text-center mt-12">
            <Link to="/reviews">
              <Button 
                size="lg" 
                className="group hover:shadow-lg transition-all duration-300"
              >
                {language === "th" ? "ดูรีวิวทั้งหมด" : "View All Reviews"}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
