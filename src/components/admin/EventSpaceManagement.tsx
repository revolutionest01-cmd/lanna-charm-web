import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, X, Plus, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "@/lib/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const eventSpaceFormSchema = z.object({
  title_th: z.string().min(1, "กรุณากรอกชื่อภาษาไทย"),
  title_en: z.string().min(1, "Please enter English title"),
  description_th: z.string().optional(),
  description_en: z.string().optional(),
  keywords_th: z.string().optional(),
  keywords_en: z.string().optional(),
});

type EventSpaceFormValues = z.infer<typeof eventSpaceFormSchema>;

export const EventSpaceManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentEventSpace, setCurrentEventSpace] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const form = useForm<EventSpaceFormValues>({
    resolver: zodResolver(eventSpaceFormSchema),
    defaultValues: {
      title_th: "",
      title_en: "",
      description_th: "",
      description_en: "",
      keywords_th: "",
      keywords_en: "",
    },
  });

  // Load current event space data
  useEffect(() => {
    loadEventSpaceData();
  }, []);

  const loadEventSpaceData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("event_spaces")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentEventSpace(data);
        form.reset({
          title_th: data.title_th || "",
          title_en: data.title_en || "",
          description_th: data.description_th || "",
          description_en: data.description_en || "",
          keywords_th: data.keywords_th || "",
          keywords_en: data.keywords_en || "",
        });
        setImagePreview(data.image_url || "");
        // Load gallery images
        loadGalleryImages(data.id);
      }
    } catch (error) {
      console.error("Error loading event space data:", error);
      toast.error(
        language === "th"
          ? "ไม่สามารถโหลดข้อมูลได้"
          : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryImages = async (eventSpaceId: string) => {
    const { data } = await supabase
      .from("event_space_images")
      .select("*")
      .eq("event_space_id", eventSpaceId)
      .order("sort_order");
    setGalleryImages(data || []);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !currentEventSpace?.id) return;

    setUploadingGallery(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const fileExt = file.name.split(".").pop();
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("event-spaces")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("event-spaces").getPublicUrl(fileName);

        await supabase.from("event_space_images").insert({
          event_space_id: currentEventSpace.id,
          image_url: publicUrl,
          sort_order: galleryImages.length + 1,
        });
      }

      toast.success(language === "th" ? "อัพโหลดสำเร็จ" : "Upload successful");
      loadGalleryImages(currentEventSpace.id);
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["event-space-images"] });
    } catch (error) {
      console.error("Gallery upload error:", error);
      toast.error(language === "th" ? "อัพโหลดล้มเหลว" : "Upload failed");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleDeleteGalleryImage = async (imageId: string, imageUrl: string) => {
    try {
      // Extract file name from URL
      const match = imageUrl.match(/event-spaces\/(.+)$/);
      if (match) {
        await supabase.storage.from("event-spaces").remove([match[1]]);
      }
      await supabase.from("event_space_images").delete().eq("id", imageId);
      toast.success(language === "th" ? "ลบรูปสำเร็จ" : "Image deleted");
      loadGalleryImages(currentEventSpace.id);
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["event-space-images"] });
    } catch (error) {
      toast.error(language === "th" ? "ลบรูปล้มเหลว" : "Delete failed");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(
        language === "th"
          ? "กรุณาเลือกไฟล์รูปภาพ"
          : "Please select an image file"
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        language === "th"
          ? "ไฟล์ต้องมีขนาดไม่เกิน 5MB"
          : "File size must not exceed 5MB"
      );
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return currentEventSpace?.image_url || null;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `event-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old image if exists
      if (currentEventSpace?.image_url) {
        const oldFileName = currentEventSpace.image_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage.from("event-spaces").remove([oldFileName]);
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from("event-spaces")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("event-spaces").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        language === "th"
          ? "ไม่สามารถอัพโหลดรูปภาพได้"
          : "Failed to upload image"
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!currentEventSpace?.image_url) return;

    try {
      setLoading(true);

      // Delete from storage
      const fileName = currentEventSpace.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("event-spaces").remove([fileName]);
      }

      // Update database
      const { error } = await supabase
        .from("event_spaces")
        .update({ image_url: null })
        .eq("id", currentEventSpace.id);

      if (error) throw error;

      toast.success(
        language === "th" ? "ลบรูปภาพสำเร็จ" : "Image deleted successfully"
      );

      setImagePreview("");
      loadEventSpaceData();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(
        language === "th" ? "ไม่สามารถลบรูปภาพได้" : "Failed to delete image"
      );
    } finally {
      setLoading(false);
      setIsDeletingImage(false);
    }
  };

  const onSubmit = async (values: EventSpaceFormValues) => {
    try {
      setSubmitting(true);

      // Upload image if there's a new one
      const imageUrl = await uploadImage();

      const eventSpaceData = {
        ...values,
        image_url: imageUrl || currentEventSpace?.image_url,
        is_active: true,
      };

      if (currentEventSpace) {
        // Update existing event space
        const { error } = await supabase
          .from("event_spaces")
          .update({
            title_th: values.title_th,
            title_en: values.title_en,
            description_th: values.description_th || null,
            description_en: values.description_en || null,
            keywords_th: values.keywords_th || null,
            keywords_en: values.keywords_en || null,
            image_url: imageUrl || currentEventSpace.image_url,
            is_active: true,
          })
          .eq("id", currentEventSpace.id);

        if (error) throw error;
      } else {
        // Create new event space
        const { error } = await supabase
          .from("event_spaces")
          .insert([{
            title_th: values.title_th,
            title_en: values.title_en,
            description_th: values.description_th || null,
            description_en: values.description_en || null,
            keywords_th: values.keywords_th || null,
            keywords_en: values.keywords_en || null,
            image_url: imageUrl || null,
            is_active: true,
          }]);

        if (error) throw error;
      }

      toast.success(
        language === "th" ? "บันทึกสำเร็จ" : "Saved successfully"
      );
      
      // Update cache version and force refetch
      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["event-spaces"] });
      await queryClient.refetchQueries({ queryKey: ["event-spaces"] });
      
      loadEventSpaceData();
      setImageFile(null);
    } catch (error) {
      console.error("Error saving event space:", error);
      toast.error(
        language === "th" ? "ไม่สามารถบันทึกได้" : "Failed to save"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !currentEventSpace) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">
          {language === "th"
            ? "จัดการห้องประชุม & งานเลี้ยง"
            : "Manage Meeting & Event Space"}
        </h3>
        <p className="text-xs sm:text-sm text-foreground/70">
          {language === "th"
            ? "อัพโหลดรูปภาพและแก้ไขข้อมูล"
            : "Upload images and edit information"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <FormLabel>
                  {language === "th" ? "รูปภาพหลัก" : "Main Image"}
                </FormLabel>
                <div className="flex flex-col gap-4">
                  {imagePreview && (
                    <div className="relative w-full aspect-video rounded-lg border border-border group">
                      <img
                        src={imagePreview}
                        alt="Event space preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {currentEventSpace?.image_url && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          disabled={loading}
                          onClick={() => setIsDeletingImage(true)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={loading || uploading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={!imageFile || loading || uploading}
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(currentEventSpace?.image_url || "");
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Images */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>
                    {language === "th" ? "รูปภาพเพิ่มเติม (Gallery)" : "Gallery Images"}
                  </FormLabel>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                      disabled={uploadingGallery || !currentEventSpace}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingGallery || !currentEventSpace} asChild>
                      <span>
                        {uploadingGallery ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-1" />
                        )}
                        {language === "th" ? "เพิ่มรูป" : "Add Images"}
                      </span>
                    </Button>
                  </label>
                </div>
                {galleryImages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {language === "th" ? "ยังไม่มีรูปภาพ Gallery — กดเพิ่มรูปเพื่ออัพโหลด" : "No gallery images yet — click Add Images to upload"}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {galleryImages.map((img) => (
                      <div key={img.id} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteGalleryImage(img.id, img.image_url)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Text Fields */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title_th"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "th" ? "ชื่อ (ไทย)" : "Title (Thai)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            language === "th"
                              ? "กรอกชื่อภาษาไทย"
                              : "Enter Thai title"
                          }
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "th"
                          ? "ชื่อ (อังกฤษ)"
                          : "Title (English)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            language === "th"
                              ? "กรอกชื่อภาษาอังกฤษ"
                              : "Enter English title"
                          }
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description_th"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === "th"
                        ? "รายละเอียด (ไทย)"
                        : "Description (Thai)"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={
                          language === "th"
                            ? "กรอกรายละเอียดภาษาไทย"
                            : "Enter Thai description"
                        }
                        disabled={submitting}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === "th"
                        ? "รายละเอียด (อังกฤษ)"
                        : "Description (English)"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={
                          language === "th"
                            ? "กรอกรายละเอียดภาษาอังกฤษ"
                            : "Enter English description"
                        }
                        disabled={submitting}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords_th"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === "th"
                        ? "คำสำคัญ (ไทย)"
                        : "Keywords (Thai)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          language === "th"
                            ? "กรอกคำสำคัญภาษาไทย (คั่นด้วยจุลภาค)"
                            : "Enter Thai keywords (comma separated)"
                        }
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === "th"
                        ? "คำสำคัญ (อังกฤษ)"
                        : "Keywords (English)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          language === "th"
                            ? "กรอกคำสำคัญภาษาอังกฤษ (คั่นด้วยจุลภาค)"
                            : "Enter English keywords (comma separated)"
                        }
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting || uploading}
              className="min-w-[120px]"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "th" ? "กำลังบันทึก..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {language === "th" ? "บันทึก" : "Save"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Delete Image Confirmation */}
      <AlertDialog open={isDeletingImage} onOpenChange={setIsDeletingImage}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "th" ? "ยืนยันการลบรูปภาพ" : "Confirm Delete Image"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "th"
                ? "คุณต้องการลบรูปภาพนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                : "Are you sure you want to delete this image? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
