import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit, Star } from "lucide-react";
import { z } from "zod";

const reviewSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required").max(100),
  rating: z.number().min(1).max(5),
  review_text_en: z.string().min(1, "English review is required").max(500),
  review_text_th: z.string().min(1, "Thai review is required").max(500),
});

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text_en: string;
  review_text_th: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export const ReviewsManagement = () => {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    rating: 5,
    review_text_en: "",
    review_text_th: "",
    image_url: "",
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการโหลดรีวิว" : "Error loading reviews");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: "",
      rating: 5,
      review_text_en: "",
      review_text_th: "",
      image_url: "",
    });
    setEditingReview(null);
  };

  const handleSubmit = async () => {
    try {
      reviewSchema.parse(formData);

      if (editingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            customer_name: formData.customer_name,
            rating: formData.rating,
            review_text_en: formData.review_text_en,
            review_text_th: formData.review_text_th,
            image_url: formData.image_url || null,
          })
          .eq("id", editingReview.id);

        if (error) throw error;
        toast.success(language === "th" ? "อัพเดทรีวิวสำเร็จ" : "Review updated successfully");
      } else {
        const { error } = await supabase.from("reviews").insert({
          customer_name: formData.customer_name,
          rating: formData.rating,
          review_text_en: formData.review_text_en,
          review_text_th: formData.review_text_th,
          image_url: formData.image_url || null,
        });

        if (error) throw error;
        toast.success(language === "th" ? "เพิ่มรีวิวสำเร็จ" : "Review added successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchReviews();
    } catch (error: any) {
      console.error("Error saving review:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(language === "th" ? "เกิดข้อผิดพลาดในการบันทึก" : "Error saving review");
      }
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      customer_name: review.customer_name,
      rating: review.rating,
      review_text_en: review.review_text_en,
      review_text_th: review.review_text_th,
      image_url: review.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === "th" ? "คุณต้องการลบรีวิวนี้หรือไม่?" : "Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;

      toast.success(language === "th" ? "ลบรีวิวสำเร็จ" : "Review deleted successfully");
      fetchReviews();
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการลบ" : "Error deleting review");
    }
  };

  const toggleActive = async (review: Review) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ is_active: !review.is_active })
        .eq("id", review.id);

      if (error) throw error;
      toast.success(
        language === "th"
          ? review.is_active
            ? "ซ่อนรีวิวสำเร็จ"
            : "แสดงรีวิวสำเร็จ"
          : review.is_active
          ? "Review hidden successfully"
          : "Review shown successfully"
      );
      fetchReviews();
    } catch (error: any) {
      console.error("Error toggling active:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {language === "th" ? "จัดการรีวิว" : "Manage Reviews"}
        </h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {language === "th" ? "เพิ่มรีวิว" : "Add Review"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReview
                  ? language === "th"
                    ? "แก้ไขรีวิว"
                    : "Edit Review"
                  : language === "th"
                  ? "เพิ่มรีวิวใหม่"
                  : "Add New Review"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === "th" ? "ชื่อลูกค้า" : "Customer Name"}</Label>
                <Input
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder={language === "th" ? "คุณสมชาย" : "John Doe"}
                />
              </div>
              <div>
                <Label>{language === "th" ? "คะแนน" : "Rating"}</Label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {language === "th" ? "ดาว" : "Stars"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === "th" ? "รีวิวภาษาอังกฤษ" : "English Review"}</Label>
                <Textarea
                  value={formData.review_text_en}
                  onChange={(e) => setFormData({ ...formData, review_text_en: e.target.value })}
                  placeholder="Great service and delicious food!"
                  rows={3}
                />
              </div>
              <div>
                <Label>{language === "th" ? "รีวิวภาษาไทย" : "Thai Review"}</Label>
                <Textarea
                  value={formData.review_text_th}
                  onChange={(e) => setFormData({ ...formData, review_text_th: e.target.value })}
                  placeholder="บริการดีมาก อาหารอร่อย!"
                  rows={3}
                />
              </div>
              <div>
                <Label>{language === "th" ? "URL รูปภาพ (ถ้ามี)" : "Image URL (Optional)"}</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingReview
                  ? language === "th"
                    ? "อัพเดท"
                    : "Update"
                  : language === "th"
                  ? "เพิ่ม"
                  : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <Card key={review.id} className={review.is_active ? "" : "opacity-50"}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{review.customer_name}</h4>
                  <div className="flex gap-1 mt-1">
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
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(review)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(review)}>
                    {review.is_active ? "👁️" : "👁️‍🗨️"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {language === "th" ? review.review_text_th : review.review_text_en}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{language === "th" ? "ยังไม่มีรีวิว" : "No reviews yet"}</p>
        </div>
      )}
    </div>
  );
};
