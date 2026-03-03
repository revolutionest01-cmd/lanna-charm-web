import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, X, Plus, Image as ImageIcon, Trash2, Upload, GripVertical } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "@/lib/toast";
import { SectionHeadingEditor } from "./SectionHeadingEditor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Available icons for features
const AVAILABLE_ICONS = [
  "Presentation", "Utensils", "Wifi", "Monitor", "Mic", "Music",
  "Camera", "Projector", "Coffee", "UtensilsCrossed", "Wine",
  "Tv", "Speaker", "Headphones", "Laptop", "Printer",
  "AirVent", "Lightbulb", "Armchair", "Car", "ParkingCircle",
  "Shield", "Lock", "Users", "UserCheck", "Star",
  "Heart", "Zap", "Clock", "CalendarDays", "MapPin",
];

const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.HelpCircle;
};

const eventSpaceFormSchema = z.object({
  title_th: z.string().min(1, "กรุณากรอกชื่อภาษาไทย"),
  title_en: z.string().min(1, "Please enter English title"),
  description_th: z.string().optional(),
  description_en: z.string().optional(),
  keywords_th: z.string().optional(),
  keywords_en: z.string().optional(),
});

type EventSpaceFormValues = z.infer<typeof eventSpaceFormSchema>;

type Feature = {
  id?: string;
  event_space_id: string;
  icon_name: string;
  title_th: string;
  title_en: string;
  description_th: string;
  description_en: string;
  sort_order: number;
  is_active: boolean;
};

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
  const [draggedGalleryImageId, setDraggedGalleryImageId] = useState<string | null>(null);
  const [dragOverGalleryImageId, setDragOverGalleryImageId] = useState<string | null>(null);
  const [savingGalleryOrder, setSavingGalleryOrder] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [savingFeatures, setSavingFeatures] = useState(false);

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
        loadGalleryImages(data.id);
        loadFeatures(data.id);
      }
    } catch (error) {
      console.error("Error loading event space data:", error);
      toast.error(language === "th" ? "ไม่สามารถโหลดข้อมูลได้" : "Failed to load data");
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

  const loadFeatures = async (eventSpaceId: string) => {
    const { data } = await (supabase as any)
      .from("event_space_features")
      .select("*")
      .eq("event_space_id", eventSpaceId)
      .order("sort_order");
    setFeatures(data || []);
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
      const match = imageUrl.match(/event-spaces\/(.+)$/);
      if (match) await supabase.storage.from("event-spaces").remove([match[1]]);
      await supabase.from("event_space_images").delete().eq("id", imageId);
      toast.success(language === "th" ? "ลบรูปสำเร็จ" : "Image deleted");
      loadGalleryImages(currentEventSpace.id);
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["event-space-images"] });
    } catch (error) {
      toast.error(language === "th" ? "ลบรูปล้มเหลว" : "Delete failed");
    }
  };

  const reorderGalleryImages = (items: any[], draggedId: string, targetId: string) => {
    const fromIndex = items.findIndex((item) => item.id === draggedId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;

    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return updated;
  };

  const handleGalleryReorderDrop = async (targetId: string) => {
    if (!draggedGalleryImageId || draggedGalleryImageId === targetId || !currentEventSpace?.id) {
      setDraggedGalleryImageId(null);
      setDragOverGalleryImageId(null);
      return;
    }

    const previousImages = [...galleryImages];
    const reorderedImages = reorderGalleryImages(previousImages, draggedGalleryImageId, targetId);

    setGalleryImages(reorderedImages);
    setDraggedGalleryImageId(null);
    setDragOverGalleryImageId(null);
    setSavingGalleryOrder(true);

    try {
      const results = await Promise.all(
        reorderedImages.map((image, index) =>
          supabase
            .from("event_space_images")
            .update({ sort_order: index + 1 })
            .eq("id", image.id)
        )
      );

      const hasError = results.some((result) => result.error);
      if (hasError) {
        setGalleryImages(previousImages);
        toast.error(language === "th" ? "จัดลำดับรูปภาพไม่สำเร็จ" : "Failed to reorder images");
        return;
      }

      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["event-space-images"] });
      toast.success(language === "th" ? "อัปเดตลำดับรูปภาพแล้ว" : "Image order updated");
    } catch (error) {
      console.error("Error reordering event gallery images:", error);
      setGalleryImages(previousImages);
      toast.error(language === "th" ? "จัดลำดับรูปภาพไม่สำเร็จ" : "Failed to reorder images");
    } finally {
      setSavingGalleryOrder(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(language === "th" ? "กรุณาเลือกไฟล์รูปภาพ" : "Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "th" ? "ไฟล์ต้องมีขนาดไม่เกิน 5MB" : "File size must not exceed 5MB");
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
      if (currentEventSpace?.image_url) {
        const oldFileName = currentEventSpace.image_url.split("/").pop();
        if (oldFileName) await supabase.storage.from("event-spaces").remove([oldFileName]);
      }
      const { error: uploadError } = await supabase.storage
        .from("event-spaces")
        .upload(fileName, imageFile, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("event-spaces").getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(language === "th" ? "ไม่สามารถอัพโหลดรูปภาพได้" : "Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!currentEventSpace?.image_url) return;
    try {
      setLoading(true);
      const fileName = currentEventSpace.image_url.split("/").pop();
      if (fileName) await supabase.storage.from("event-spaces").remove([fileName]);
      const { error } = await supabase.from("event_spaces").update({ image_url: null }).eq("id", currentEventSpace.id);
      if (error) throw error;
      toast.success(language === "th" ? "ลบรูปภาพสำเร็จ" : "Image deleted successfully");
      setImagePreview("");
      loadEventSpaceData();
    } catch (error) {
      toast.error(language === "th" ? "ไม่สามารถลบรูปภาพได้" : "Failed to delete image");
    } finally {
      setLoading(false);
      setIsDeletingImage(false);
    }
  };

  const addFeature = () => {
    if (!currentEventSpace?.id) return;
    setFeatures((prev) => [
      ...prev,
      {
        event_space_id: currentEventSpace.id,
        icon_name: "Presentation",
        title_th: "",
        title_en: "",
        description_th: "",
        description_en: "",
        sort_order: prev.length + 1,
        is_active: true,
      },
    ]);
  };

  const updateFeature = (index: number, field: keyof Feature, value: any) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const removeFeature = async (index: number) => {
    const feature = features[index];
    if (feature.id) {
      await (supabase as any).from("event_space_features").delete().eq("id", feature.id);
    }
    setFeatures((prev) => prev.filter((_, i) => i !== index));
    toast.success(language === "th" ? "ลบสำเร็จ" : "Removed");
    invalidateContentCache();
    queryClient.invalidateQueries({ queryKey: ["event-space-features"] });
  };

  const saveFeatures = async () => {
    if (!currentEventSpace?.id) return;
    setSavingFeatures(true);
    try {
      for (let i = 0; i < features.length; i++) {
        const f = features[i];
        const payload = {
          event_space_id: currentEventSpace.id,
          icon_name: f.icon_name,
          title_th: f.title_th,
          title_en: f.title_en,
          description_th: f.description_th || null,
          description_en: f.description_en || null,
          sort_order: i + 1,
          is_active: f.is_active,
        };
        if (f.id) {
          await (supabase as any).from("event_space_features").update(payload).eq("id", f.id);
        } else {
          await (supabase as any).from("event_space_features").insert(payload);
        }
      }
      toast.success(language === "th" ? "บันทึกบริการสำเร็จ" : "Features saved");
      loadFeatures(currentEventSpace.id);
      invalidateContentCache();
      queryClient.invalidateQueries({ queryKey: ["event-space-features"] });
    } catch (error) {
      console.error("Error saving features:", error);
      toast.error(language === "th" ? "บันทึกล้มเหลว" : "Save failed");
    } finally {
      setSavingFeatures(false);
    }
  };

  const onSubmit = async (values: EventSpaceFormValues) => {
    try {
      setSubmitting(true);
      const imageUrl = await uploadImage();

      if (currentEventSpace) {
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

      toast.success(language === "th" ? "บันทึกสำเร็จ" : "Saved successfully");
      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["event-spaces"] });
      await queryClient.refetchQueries({ queryKey: ["event-spaces"] });
      loadEventSpaceData();
      setImageFile(null);
    } catch (error) {
      console.error("Error saving event space:", error);
      toast.error(language === "th" ? "ไม่สามารถบันทึกได้" : "Failed to save");
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
      <SectionHeadingEditor sectionKey="events" label={language === "th" ? "หัวข้อ Section อีเว้นท์" : "Events Section Heading"} />
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-primary">
          {language === "th" ? "จัดการห้องประชุม & งานเลี้ยง" : "Manage Meeting & Event Space"}
        </h3>
        <p className="text-xs sm:text-sm text-foreground">
          {language === "th" ? "อัพโหลดรูปภาพและแก้ไขข้อมูล" : "Upload images and edit information"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <FormLabel>{language === "th" ? "รูปภาพหลัก" : "Main Image"}</FormLabel>
                <div className="flex flex-col gap-4">
                  {imagePreview && (
                    <div className="relative w-full aspect-video rounded-lg border border-border group">
                      <img src={imagePreview} alt="Event space preview" className="w-full h-full object-cover rounded-lg" />
                      {currentEventSpace?.image_url && (
                        <Button type="button" variant="destructive" size="icon"
                          className="absolute top-2 right-2 z-20 h-8 w-8 bg-destructive text-destructive-foreground border border-destructive/70 hover:bg-destructive/90 shadow-sm"
                          disabled={loading} onClick={() => setIsDeletingImage(true)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Input type="file" accept="image/*" onChange={handleImageChange} disabled={loading || uploading} className="flex-1" />
                    <Button type="button" variant="outline" size="icon"
                      disabled={!imageFile || loading || uploading}
                      onClick={() => { setImageFile(null); setImagePreview(currentEventSpace?.image_url || ""); }}>
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
                  <FormLabel>{language === "th" ? "รูปภาพเพิ่มเติม (Gallery)" : "Gallery Images"}</FormLabel>
                  <label className="cursor-pointer">
                    <Input type="file" accept="image/*" multiple className="hidden"
                      onChange={handleGalleryUpload} disabled={uploadingGallery || !currentEventSpace} />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingGallery || !currentEventSpace} asChild>
                      <span>
                        {uploadingGallery ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
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
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {language === "th" ? "ลากวางรูปเพื่อจัดลำดับ" : "Drag and drop to reorder"}
                      </p>
                      {savingGalleryOrder && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {language === "th" ? "กำลังบันทึกลำดับ..." : "Saving order..."}
                        </span>
                      )}
                    </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {galleryImages.map((img, index) => (
                      <div
                        key={img.id}
                        draggable={!savingGalleryOrder}
                        onDragStart={() => setDraggedGalleryImageId(img.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverGalleryImageId !== img.id) setDragOverGalleryImageId(img.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverGalleryImageId === img.id) setDragOverGalleryImageId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleGalleryReorderDrop(img.id);
                        }}
                        onDragEnd={() => {
                          setDraggedGalleryImageId(null);
                          setDragOverGalleryImageId(null);
                        }}
                        className={`relative group aspect-video rounded-lg overflow-hidden border border-border transition-all ${
                          dragOverGalleryImageId === img.id ? "ring-2 ring-primary scale-[1.02]" : ""
                        } ${draggedGalleryImageId === img.id ? "opacity-70" : ""}`}
                      >
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/55 text-white rounded px-1 py-0.5 flex items-center gap-1 z-20">
                          <GripVertical className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">#{index + 1}</span>
                        </div>
                        <Button type="button" variant="destructive" size="icon"
                          className="absolute top-1 right-1 h-6 w-6 bg-destructive text-destructive-foreground border border-destructive/70 hover:bg-destructive/90 shadow-sm"
                          onClick={() => handleDeleteGalleryImage(img.id, img.image_url)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Text Fields */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="title_th" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "th" ? "ชื่อ (ไทย)" : "Title (Thai)"}</FormLabel>
                    <FormControl><Input {...field} disabled={submitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="title_en" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "th" ? "ชื่อ (อังกฤษ)" : "Title (English)"}</FormLabel>
                    <FormControl><Input {...field} disabled={submitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description_th" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "th" ? "รายละเอียด (ไทย)" : "Description (Thai)"}</FormLabel>
                  <FormControl><Textarea {...field} disabled={submitting} rows={4} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description_en" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "th" ? "รายละเอียด (อังกฤษ)" : "Description (English)"}</FormLabel>
                  <FormControl><Textarea {...field} disabled={submitting} rows={4} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="keywords_th" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "th" ? "คำสำคัญ (ไทย)" : "Keywords (Thai)"}</FormLabel>
                  <FormControl><Input {...field} disabled={submitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="keywords_en" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "th" ? "คำสำคัญ (อังกฤษ)" : "Keywords (English)"}</FormLabel>
                  <FormControl><Input {...field} disabled={submitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || uploading} className="min-w-[120px]">
              {submitting || uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{language === "th" ? "กำลังบันทึก..." : "Saving..."}</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />{language === "th" ? "บันทึก" : "Save"}</>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Features / Services Management */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm sm:text-base">
                {language === "th" ? "จัดการบริการ / จุดเด่น" : "Manage Features / Services"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {language === "th" ? "เพิ่ม ลบ แก้ไข Icon และข้อความสำหรับแต่ละบริการ" : "Add, remove, edit icons and text for each service"}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFeature} disabled={!currentEventSpace}>
              <Plus className="w-4 h-4 mr-1" />
              {language === "th" ? "เพิ่ม" : "Add"}
            </Button>
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {language === "th" ? "ยังไม่มีบริการ — กดเพิ่มเพื่อสร้าง" : "No features yet — click Add to create"}
            </p>
          ) : (
            <div className="space-y-4">
              {features.map((feature, index) => {
                const IconComponent = getIcon(feature.icon_name);
                return (
                  <div key={feature.id || `new-${index}`} className="border border-border rounded-xl p-4 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="h-7 w-7 bg-destructive text-destructive-foreground border border-destructive/70 hover:bg-destructive/90 shadow-sm"
                        onClick={() => removeFeature(index)}
                        title={language === "th" ? "ลบ" : "Delete"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Icon selector */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        {language === "th" ? "เลือก Icon" : "Select Icon"}
                      </label>
                      <Select value={feature.icon_name} onValueChange={(val) => updateFeature(index, "icon_name", val)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {AVAILABLE_ICONS.map((iconName) => {
                            const Ic = getIcon(iconName);
                            return (
                              <SelectItem key={iconName} value={iconName}>
                                <div className="flex items-center gap-2">
                                  <Ic className="w-4 h-4" />
                                  <span>{iconName}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Title fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {language === "th" ? "ชื่อ (ไทย)" : "Title (Thai)"}
                        </label>
                        <Input value={feature.title_th} onChange={(e) => updateFeature(index, "title_th", e.target.value)}
                          placeholder="ห้องบรรยาย/นำเสนอ" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {language === "th" ? "ชื่อ (อังกฤษ)" : "Title (English)"}
                        </label>
                        <Input value={feature.title_en} onChange={(e) => updateFeature(index, "title_en", e.target.value)}
                          placeholder="Presentation Room" />
                      </div>
                    </div>

                    {/* Description fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {language === "th" ? "คำอธิบาย (ไทย)" : "Description (Thai)"}
                        </label>
                        <Input value={feature.description_th || ""} onChange={(e) => updateFeature(index, "description_th", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {language === "th" ? "คำอธิบาย (อังกฤษ)" : "Description (English)"}
                        </label>
                        <Input value={feature.description_en || ""} onChange={(e) => updateFeature(index, "description_en", e.target.value)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {features.length > 0 && (
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={saveFeatures} disabled={savingFeatures}>
                {savingFeatures ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{language === "th" ? "กำลังบันทึก..." : "Saving..."}</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />{language === "th" ? "บันทึกบริการ" : "Save Features"}</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Image Confirmation */}
      <AlertDialog open={isDeletingImage} onOpenChange={setIsDeletingImage}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "th" ? "ยืนยันการลบรูปภาพ" : "Confirm Delete Image"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "th" ? "คุณต้องการลบรูปภาพนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้" : "Are you sure you want to delete this image? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "th" ? "ยกเลิก" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
