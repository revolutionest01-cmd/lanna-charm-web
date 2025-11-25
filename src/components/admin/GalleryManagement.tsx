import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { z } from "zod";

const gallerySchema = z.object({
  title_en: z.string().min(1, "English title is required").max(100),
  title_th: z.string().min(1, "Thai title is required").max(100),
});

type GalleryImage = {
  id: string;
  image_url: string;
  title_en: string | null;
  title_th: string | null;
  sort_order: number;
};

export const GalleryManagement = () => {
  const { language } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title_en: "",
    title_th: "",
    file: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error("Error fetching gallery:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการโหลดแกลเลอรี่" : "Error loading gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(language === "th" ? "กรุณาเลือกไฟล์รูปภาพเท่านั้น" : "Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(language === "th" ? "ขนาดไฟล์ต้องไม่เกิน 5MB" : "File size must not exceed 5MB");
        return;
      }
      setFormData({ ...formData, file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    try {
      gallerySchema.parse(formData);
      
      if (!formData.file) {
        toast.error(language === "th" ? "กรุณาเลือกรูปภาพ" : "Please select an image");
        return;
      }

      setUploading(true);

      // Upload image
      const fileName = `${Date.now()}_${formData.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, formData.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);

      // Insert into database
      const { error: dbError } = await supabase.from("gallery_images").insert({
        image_url: urlData.publicUrl,
        title_en: formData.title_en,
        title_th: formData.title_th,
        sort_order: images.length,
      });

      if (dbError) throw dbError;

      toast.success(language === "th" ? "เพิ่มรูปภาพสำเร็จ" : "Image added successfully");
      setFormData({ title_en: "", title_th: "", file: null });
      setPreviewUrl(null);
      fetchGalleryImages();
    } catch (error: any) {
      console.error("Error uploading image:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(language === "th" ? "เกิดข้อผิดพลาดในการอัพโหลด" : "Error uploading image");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm(language === "th" ? "คุณต้องการลบรูปภาพนี้หรือไม่?" : "Are you sure you want to delete this image?")) {
      return;
    }

    try {
      // Extract filename from URL
      const fileName = image.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("gallery").remove([fileName]);
      }

      const { error } = await supabase.from("gallery_images").delete().eq("id", image.id);
      if (error) throw error;

      toast.success(language === "th" ? "ลบรูปภาพสำเร็จ" : "Image deleted successfully");
      fetchGalleryImages();
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการลบ" : "Error deleting image");
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
      {/* Upload Form */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">
            {language === "th" ? "เพิ่มรูปภาพใหม่" : "Add New Image"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{language === "th" ? "ชื่อภาษาอังกฤษ" : "English Title"}</Label>
              <Input
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="Beautiful garden"
              />
            </div>
            <div>
              <Label>{language === "th" ? "ชื่อภาษาไทย" : "Thai Title"}</Label>
              <Input
                value={formData.title_th}
                onChange={(e) => setFormData({ ...formData, title_th: e.target.value })}
                placeholder="สวนสวยงาม"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>{language === "th" ? "รูปภาพ" : "Image"}</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {previewUrl && (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={() => {
                      setPreviewUrl(null);
                      setFormData({ ...formData, file: null });
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="mt-4">
            {uploading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                {language === "th" ? "กำลังอัพโหลด..." : "Uploading..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 w-4 h-4" />
                {language === "th" ? "อัพโหลด" : "Upload"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="group relative overflow-hidden">
            <CardContent className="p-0">
              <img
                src={image.image_url}
                alt={language === "th" ? image.title_th || "" : image.title_en || ""}
                className="w-full h-48 object-cover"
              />
              <div className="p-3">
                <p className="text-sm font-medium truncate">
                  {language === "th" ? image.title_th : image.title_en}
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(image)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{language === "th" ? "ยังไม่มีรูปภาพในแกลเลอรี่" : "No images in gallery yet"}</p>
        </div>
      )}
    </div>
  );
};
