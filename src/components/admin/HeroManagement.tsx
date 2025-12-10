import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, Save, Image as ImageIcon } from "lucide-react";
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

const heroFormSchema = z.object({
  title_th: z.string().min(1, "กรุณากรอกหัวข้อภาษาไทย"),
  title_en: z.string().min(1, "Please enter English title"),
  subtitle_th: z.string().optional(),
  subtitle_en: z.string().optional(),
});

type HeroFormValues = z.infer<typeof heroFormSchema>;

export const HeroManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentHero, setCurrentHero] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroFormSchema),
    defaultValues: {
      title_th: "",
      title_en: "",
      subtitle_th: "",
      subtitle_en: "",
    },
  });

  // Load current hero data
  useEffect(() => {
    loadHeroData();
  }, []);

  const loadHeroData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentHero(data);
        form.reset({
          title_th: data.title_th || "",
          title_en: data.title_en || "",
          subtitle_th: data.subtitle_th || "",
          subtitle_en: data.subtitle_en || "",
        });
        setImagePreview(data.image_url || "");
      }
    } catch (error) {
      console.error("Error loading hero data:", error);
      toast.error(
        language === "th"
          ? "ไม่สามารถโหลดข้อมูลได้"
          : "Failed to load data"
      );
    } finally {
      setLoading(false);
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
    if (!imageFile) return currentHero?.image_url || null;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old image if exists
      if (currentHero?.image_url) {
        const oldFileName = currentHero.image_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage.from("hero").remove([oldFileName]);
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from("hero")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("hero").getPublicUrl(filePath);

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

  const onSubmit = async (values: HeroFormValues) => {
    try {
      setSubmitting(true);

      // Upload image if there's a new one
      const imageUrl = await uploadImage();
      if (!imageUrl && !currentHero?.image_url) {
        toast.error(
          language === "th"
            ? "กรุณาเลือกรูปภาพ"
            : "Please select an image"
        );
        return;
      }

      const heroData = {
        ...values,
        image_url: imageUrl || currentHero?.image_url,
        is_active: true,
      };

      if (currentHero) {
        // Update existing hero
        const { error } = await supabase
          .from("hero_content")
          .update({
            title_th: values.title_th,
            title_en: values.title_en,
            subtitle_th: values.subtitle_th || null,
            subtitle_en: values.subtitle_en || null,
            image_url: imageUrl || currentHero.image_url,
            is_active: true,
          })
          .eq("id", currentHero.id);

        if (error) throw error;
      } else {
        // Create new hero
        const { error } = await supabase
          .from("hero_content")
          .insert([{
            title_th: values.title_th,
            title_en: values.title_en,
            subtitle_th: values.subtitle_th || null,
            subtitle_en: values.subtitle_en || null,
            image_url: imageUrl!,
            is_active: true,
          }]);

        if (error) throw error;
      }

      toast.success(
        language === "th" ? "บันทึกสำเร็จ" : "Saved successfully"
      );
      
      // Update cache version and force refetch
      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      await queryClient.refetchQueries({ queryKey: ["hero-content"] });
      
      loadHeroData();
      setImageFile(null);
    } catch (error) {
      console.error("Error saving hero:", error);
      toast.error(
        language === "th" ? "ไม่สามารถบันทึกได้" : "Failed to save"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !currentHero) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {language === "th" ? "จัดการ Hero Section" : "Manage Hero Section"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {language === "th"
            ? "อัพโหลดรูปภาพ (แนะนำ 16:9) และแก้ไขข้อความ"
            : "Upload image (recommended 16:9) and edit text"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label>
                  {language === "th" ? "รูปภาพ Hero" : "Hero Image"}
                </Label>
                <div className="flex flex-col gap-4">
                  {imagePreview && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                      <img
                        src={imagePreview}
                        alt="Hero preview"
                        className="w-full h-full object-cover"
                      />
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
                        setImagePreview(currentHero?.image_url || "");
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Fields */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="title_th"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === "th"
                        ? "หัวข้อ (ไทย)"
                        : "Title (Thai)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          language === "th"
                            ? "กรอกหัวข้อภาษาไทย"
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
                        ? "หัวข้อ (อังกฤษ)"
                        : "Title (English)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          language === "th"
                            ? "กรอกหัวข้อภาษาอังกฤษ"
                            : "Enter English title"
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
                name="subtitle_th"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === "th"
                        ? "คำบรรยาย (ไทย)"
                        : "Subtitle (Thai)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          language === "th"
                            ? "กรอกคำบรรยายภาษาไทย (ไม่บังคับ)"
                            : "Enter Thai subtitle (optional)"
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
                name="subtitle_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === "th"
                        ? "คำบรรยาย (อังกฤษ)"
                        : "Subtitle (English)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          language === "th"
                            ? "กรอกคำบรรยายภาษาอังกฤษ (ไม่บังคับ)"
                            : "Enter English subtitle (optional)"
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
    </div>
  );
};
