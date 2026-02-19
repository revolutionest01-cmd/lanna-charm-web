import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import sweetAlert from "@/lib/sweetAlert";
import { Loader2, Plus, Trash2, Edit, Star } from "lucide-react";
import { z } from "zod";

const AVATAR_OPTIONS = [
  "😊", "😄", "😎", "🤩", "😍", 
  "🥳", "😇", "🤓", "😌", "😊",
  "👨", "👩", "👴", "👵", "👦",
  "👧", "🧔", "👱", "🤵", "💼"
];

const reviewSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required").max(100),
  rating: z.number().min(1).max(5),
  review_text_en: z.string().min(1, "English review is required").max(500),
  review_text_th: z.string().min(1, "Thai review is required").max(500),
  avatar: z.string().default("😊"),
});

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text_en: string;
  review_text_th: string;
  image_url: string | null;
  avatar: string;
  is_active: boolean;
  created_at: string;
};

export const ReviewsManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    rating: 5,
    review_text_en: "",
    review_text_th: "",
    avatar: "😊",
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
      avatar: "😊",
      review_text_th: "",
    });
    setEditingReview(null);
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        language === "th" ? "กรุณาเลือกไฟล์รูปภาพ" : "Please select an image file"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        language === "th" ? "ไฟล์ต้องมีขนาดไม่เกิน 5MB" : "File size must not exceed 5MB"
      );
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        language === "th" ? "กรุณาเลือกไฟล์รูปภาพ" : "Please select an image file"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        language === "th" ? "ไฟล์ต้องมีขนาดไม่เกิน 5MB" : "File size must not exceed 5MB"
      );
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return editingReview?.image_url || null;

    try {
      setUploadingImage(true);
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `review-${Date.now()}.${fileExt}`;

      // Delete old image if exists
      if (editingReview?.image_url) {
        const oldFileName = editingReview.image_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage.from("reviews").remove([oldFileName]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("reviews")
        .upload(fileName, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("reviews")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        language === "th" ? "ไม่สามารถอัพโหลดรูปภาพได้" : "Failed to upload image"
      );
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      reviewSchema.parse(formData);
      setSubmitting(true);

      const imageUrl = await uploadImage();

      if (editingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({
            customer_name: formData.customer_name,
            rating: formData.rating,
            avatar: formData.avatar,
            review_text_en: formData.review_text_en,
            review_text_th: formData.review_text_th,
            image_url: imageUrl,
          })
          .eq("id", editingReview.id);

        if (error) throw error;
        toast.success(language === "th" ? "อัพเดทรีวิวสำเร็จ" : "Review updated successfully");
      } else {
        const { error } = await supabase.from("reviews").insert({
          customer_name: formData.customer_name,
          rating: formData.rating,
          avatar: formData.avatar,
          review_text_en: formData.review_text_en,
          review_text_th: formData.review_text_th,
          image_url: imageUrl,
        });

        if (error) throw error;
        toast.success(language === "th" ? "เพิ่มรีวิวสำเร็จ" : "Review added successfully");
      }

      // Update cache version and force refetch
      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      await queryClient.refetchQueries({ queryKey: ["reviews"] });

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
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      customer_name: review.customer_name,
      avatar: review.avatar || "😊",
      rating: review.rating,
      review_text_en: review.review_text_en,
      review_text_th: review.review_text_th,
    });
    setImagePreview(review.image_url || "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await sweetAlert.modal.confirmDelete(
      language === "th" ? "ยืนยันการลบ" : "Confirm Delete",
      language === "th" ? "คุณต้องการลบรีวิวนี้หรือไม่?" : "Are you sure you want to delete this review?"
    );
    
    if (!confirmed) return;

    try {
      // Get the review to delete its image
      const review = reviews.find(r => r.id === id);
      
      // Try to delete image from storage if it exists
      if (review?.image_url) {
        try {
          // Check if it's a Supabase storage URL
          if (review.image_url.includes('supabase.co/storage')) {
            const fileName = review.image_url.split("/").pop();
            if (fileName) {
              await supabase.storage.from("reviews").remove([fileName]);
            }
          }
          // If it's not a Supabase URL (e.g., mockup data with external URLs), skip storage deletion
        } catch (storageError) {
          console.warn("Could not delete image from storage:", storageError);
          // Continue with database deletion even if image deletion fails
        }
      }

      // Delete the review from database
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;

      toast.success(language === "th" ? "ลบรีวิวสำเร็จ" : "Review deleted successfully");
      
      // Update cache version and force refetch
      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      await queryClient.refetchQueries({ queryKey: ["reviews"] });
      
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
      
      // Update cache version and force refetch
      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      await queryClient.refetchQueries({ queryKey: ["reviews"] });
      
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
            <div className="space-y-6">
              {/* Customer Name & Avatar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-primary">{language === "th" ? "ชื่อลูกค้า" : "Customer Name"}</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder={language === "th" ? "คุณสมชาย" : "John Doe"}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-primary">{language === "th" ? "เลือก Avatar" : "Select Avatar"}</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar })}
                        className={`text-3xl p-2 rounded-lg transition-all border-2 ${
                          formData.avatar === avatar
                            ? "border-primary bg-primary/10 scale-110"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rating with Stars Preview */}
              <div>
                <Label className="text-primary">{language === "th" ? "คะแนน" : "Rating"}</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Select
                    value={formData.rating.toString()}
                    onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                  >
                    <SelectTrigger className="w-32">
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
                  {/* Star Preview */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 transition-all ${
                          i < formData.rating
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "fill-muted text-muted/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="space-y-3">
                <div>
                  <Label className="text-primary">{language === "th" ? "รีวิวภาษาอังกฤษ" : "English Review"}</Label>
                  <Textarea
                    value={formData.review_text_en}
                    onChange={(e) => setFormData({ ...formData, review_text_en: e.target.value })}
                    placeholder="Great service and delicious food!"
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-primary">{language === "th" ? "รีวิวภาษาไทย" : "Thai Review"}</Label>
                  <Textarea
                    value={formData.review_text_th}
                    onChange={(e) => setFormData({ ...formData, review_text_th: e.target.value })}
                    placeholder="บริการดีมาก อาหารอร่อย!"
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-primary">{language === "th" ? "รูปภาพ (ถ้ามี)" : "Image (Optional)"}</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={loading || uploadingImage}
                    className="hidden"
                    id="review-image-upload"
                  />
                  <label
                    htmlFor="review-image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                      📷
                    </div>
                    <p className="text-sm text-foreground/70">
                      {language === "th"
                        ? "คลิกหรือลากไฟล์มาวาง"
                        : "Click or drag file here"}
                    </p>
                    <p className="text-xs text-foreground/70 mt-1">
                      {language === "th" ? "ไฟล์ต้องมีขนาดไม่เกิน 5MB" : "Max 5MB"}
                    </p>
                  </label>
                </div>
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Review preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                    >
                      {language === "th" ? "ลบ" : "Remove"}
                    </Button>
                  </div>
                )}
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={submitting || uploadingImage}>
                {submitting || uploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "th" ? "กำลังบันทึก..." : "Saving..."}
                  </>
                ) : editingReview ? (
                  language === "th" ? "อัพเดท" : "Update"
                ) : (
                  language === "th" ? "เพิ่ม" : "Add"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <Card key={review.id} className={`overflow-hidden transition-all hover:shadow-lg ${review.is_active ? "" : "opacity-50"}`}>
            <CardContent className="p-6">
              {/* Header with Avatar & Name */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl p-2 bg-primary/10 rounded-lg">
                    {review.avatar || "😊"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-foreground">{review.customer_name}</h4>
                    {/* Star Rating Display */}
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
                </div>
                {/* Actions */}
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(review)}
                    className="hover:bg-primary/10"
                  >
                    <Edit className="w-4 h-4 text-primary" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleActive(review)}
                    title={review.is_active ? "Hide" : "Show"}
                  >
                    {review.is_active ? "👁️" : "👁️‍🗨️"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(review.id)}
                    className="hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Review Image if exists */}
              {review.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={review.image_url} 
                    alt="Review" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Review Text */}
              <p className="text-sm text-foreground/80 line-clamp-4 mb-2">
                {language === "th" ? review.review_text_th : review.review_text_en}
              </p>

              {/* Date */}
              <p className="text-xs text-foreground/50">
                {new Date(review.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12 text-foreground/70">
          <p>{language === "th" ? "ยังไม่มีรีวิว" : "No reviews yet"}</p>
        </div>
      )}
    </div>
  );
};
