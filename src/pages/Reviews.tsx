import { useState } from "react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { Loader2, Star, Send, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import sweetAlert from "@/lib/sweetAlert";
import { z } from "zod";
import { format } from "date-fns";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text_en: string;
  review_text_th: string;
  image_url: string | null;
  created_at: string;
  user_id: string | null;
  helpful_count: number;
};

type ReviewLike = {
  review_id: string;
  user_id: string;
};

const reviewSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  rating: z.number().min(1).max(5),
  review_text_en: z.string().trim().min(10, "Review must be at least 10 characters").max(500, "Review must be less than 500 characters"),
  review_text_th: z.string().trim().min(10, "รีวิวต้องมีอย่างน้อย 10 ตัวอักษร").max(500, "รีวิวต้องมีไม่เกิน 500 ตัวอักษร"),
});

const Reviews = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    rating: 5,
    review_text_en: "",
    review_text_th: "",
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's likes
  const { data: userLikes = [] } = useQuery({
    queryKey: ["user-review-likes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("review_likes")
        .select("review_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map(like => like.review_id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ reviewId, isLiked }: { reviewId: string; isLiked: boolean }) => {
      if (!user?.id) {
        throw new Error("Must be logged in");
      }

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("review_likes")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("review_likes")
          .insert({
            review_id: reviewId,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews-all"] });
      queryClient.invalidateQueries({ queryKey: ["user-review-likes"] });
    },
    onError: (error: any) => {
      console.error("Error toggling like:", error);
      if (error.message === "Must be logged in") {
        sweetAlert.error(
          language === "th" 
            ? "กรุณาเข้าสู่ระบบเพื่อกดถูกใจ" 
            : "Please login to like reviews"
        );
      } else {
        sweetAlert.error(
          language === "th" 
            ? "เกิดข้อผิดพลาด" 
            : "An error occurred"
        );
      }
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: typeof formData) => {
      // Validate
      const validated = reviewSchema.parse(reviewData);
      
      const { error } = await supabase
        .from("reviews")
        .insert({
          customer_name: validated.customer_name,
          rating: validated.rating,
          review_text_en: validated.review_text_en,
          review_text_th: validated.review_text_th,
          user_id: user?.id || null,
          is_active: false, // Pending admin approval
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      sweetAlert.success(
        language === "th" 
          ? "ส่งรีวิวสำเร็จ! รอการอนุมัติจากผู้ดูแล" 
          : "Review submitted! Pending admin approval"
      );
      setFormData({
        customer_name: "",
        rating: 5,
        review_text_en: "",
        review_text_th: "",
      });
      queryClient.invalidateQueries({ queryKey: ["reviews-all"] });
    },
    onError: (error: any) => {
      console.error("Error submitting review:", error);
      if (error instanceof z.ZodError) {
        sweetAlert.error(error.errors[0].message);
      } else {
        sweetAlert.error(
          language === "th" 
            ? "เกิดข้อผิดพลาดในการส่งรีวิว" 
            : "Failed to submit review"
        );
      }
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    submitReviewMutation.mutate(formData);
  };

  const filteredReviews = filterRating 
    ? reviews.filter(review => review.rating === filterRating)
    : reviews;

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive}
            className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
              {language === "th" ? "รีวิวจากลูกค้า" : "Customer Reviews"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === "th" 
                ? "ความคิดเห็นและประสบการณ์จากลูกค้าของเรา" 
                : "Feedback and experiences from our valued customers"}
            </p>
          </div>

          {/* Write Review Form (Authenticated Users Only) */}
          {isAuthenticated ? (
            <Card className="mb-12 max-w-3xl mx-auto">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-6">
                  {language === "th" ? "เขียนรีวิว" : "Write a Review"}
                </h2>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <Label htmlFor="customer_name">
                      {language === "th" ? "ชื่อของคุณ" : "Your Name"}
                    </Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder={language === "th" ? "กรอกชื่อของคุณ" : "Enter your name"}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div>
                    <Label>
                      {language === "th" ? "คะแนน" : "Rating"}
                    </Label>
                    {renderStars(formData.rating, true, (rating) => 
                      setFormData({ ...formData, rating })
                    )}
                  </div>

                  <div>
                    <Label htmlFor="review_text_th">
                      {language === "th" ? "รีวิว (ภาษาไทย)" : "Review (Thai)"}
                    </Label>
                    <Textarea
                      id="review_text_th"
                      value={formData.review_text_th}
                      onChange={(e) => setFormData({ ...formData, review_text_th: e.target.value })}
                      placeholder={language === "th" ? "เขียนรีวิวของคุณเป็นภาษาไทย..." : "Write your review in Thai..."}
                      rows={4}
                      maxLength={500}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.review_text_th.length}/500
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="review_text_en">
                      {language === "th" ? "รีวิว (ภาษาอังกฤษ)" : "Review (English)"}
                    </Label>
                    <Textarea
                      id="review_text_en"
                      value={formData.review_text_en}
                      onChange={(e) => setFormData({ ...formData, review_text_en: e.target.value })}
                      placeholder={language === "th" ? "เขียนรีวิวของคุณเป็นภาษาอังกฤษ..." : "Write your review in English..."}
                      rows={4}
                      maxLength={500}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.review_text_en.length}/500
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={submitReviewMutation.isPending}
                    className="w-full"
                  >
                    {submitReviewMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === "th" ? "กำลังส่ง..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {language === "th" ? "ส่งรีวิว" : "Submit Review"}
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    {language === "th" 
                      ? "รีวิวของคุณจะแสดงหลังจากได้รับการอนุมัติ" 
                      : "Your review will be displayed after approval"}
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-12 max-w-3xl mx-auto bg-muted/50">
              <CardContent className="pt-6 text-center">
                <p className="text-lg text-muted-foreground mb-4">
                  {language === "th" 
                    ? "กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว" 
                    : "Please login to write a review"}
                </p>
                <Button onClick={() => window.location.href = "/auth"}>
                  {language === "th" ? "เข้าสู่ระบบ" : "Login"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Filter by Rating */}
          <div className="mb-8 flex justify-center">
            <Tabs 
              value={filterRating?.toString() || "all"} 
              onValueChange={(value) => setFilterRating(value === "all" ? null : parseInt(value))}
              className="w-full max-w-2xl"
            >
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">
                  {language === "th" ? "ทั้งหมด" : "All"}
                </TabsTrigger>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <TabsTrigger key={rating} value={rating.toString()}>
                    {rating} <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Reviews Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {language === "th" 
                  ? filterRating 
                    ? `ไม่มีรีวิว ${filterRating} ดาว` 
                    : "ยังไม่มีรีวิว"
                  : filterRating
                    ? `No ${filterRating}-star reviews`
                    : "No reviews yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReviews.map((review, index) => {
                const isLiked = userLikes.includes(review.id);
                
                return (
                  <Card 
                    key={review.id}
                    className="animate-scale-in hover:shadow-lg transition-shadow"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{review.customer_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      
                      {review.image_url && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img 
                            src={review.image_url} 
                            alt={review.customer_name}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}

                      <p className="text-muted-foreground line-clamp-4 mb-4">
                        {language === "th" ? review.review_text_th : review.review_text_en}
                      </p>

                      {/* Helpful Button */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button
                          variant={isLiked ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleLikeMutation.mutate({ reviewId: review.id, isLiked })}
                          disabled={toggleLikeMutation.isPending || !isAuthenticated}
                          className="gap-2"
                        >
                          <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                          {language === "th" ? "เป็นประโยชน์" : "Helpful"}
                          {review.helpful_count > 0 && (
                            <span className="font-semibold">({review.helpful_count})</span>
                          )}
                        </Button>
                        {!isAuthenticated && (
                          <p className="text-xs text-muted-foreground">
                            {language === "th" ? "เข้าสู่ระบบเพื่อกดถูกใจ" : "Login to like"}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Reviews;
