import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title_en: "",
    title_th: "",
    files: [] as File[],
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: ${language === "th" ? "กรุณาเลือกไฟล์รูปภาพเท่านั้น" : "Please select an image file"}`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: ${language === "th" ? "ขนาดไฟล์ต้องไม่เกิน 5MB" : "File size must not exceed 5MB"}`);
        return;
      }
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    setFormData({ ...formData, files: [...formData.files, ...validFiles] });
    setPreviewUrls([...previewUrls, ...previews]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const removeFile = (index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
    setPreviewUrls(newPreviews);
  };

  const handleUpload = async () => {
    try {
      if (formData.files.length === 0) {
        toast.error(language === "th" ? "กรุณาเลือกรูปภาพอย่างน้อย 1 รูป" : "Please select at least 1 image");
        return;
      }

      setSubmitting(true);

      // Upload all images
      for (let i = 0; i < formData.files.length; i++) {
        const file = formData.files[i];
        const fileName = `${Date.now()}_${i}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, file);

        if (uploadError) {
          toast.error(`${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);

        // Insert into database
        const { error: dbError } = await supabase.from("gallery_images").insert({
          image_url: urlData.publicUrl,
          title_en: formData.title_en || `Gallery Image ${i + 1}`,
          title_th: formData.title_th || `รูปภาพแกลเลอรี่ ${i + 1}`,
          sort_order: images.length + i,
        });

        if (dbError) {
          toast.error(`${file.name}: ${dbError.message}`);
          continue;
        }
      }

      toast.success(language === "th" ? `เพิ่มรูปภาพสำเร็จ ${formData.files.length} รูป` : `${formData.files.length} images added successfully`);
      setFormData({ title_en: "", title_th: "", files: [] });
      setPreviewUrls([]);
      fetchGalleryImages();
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการอัพโหลด" : "Error uploading images");
    } finally {
      setSubmitting(false);
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
      
      // Invalidate queries to refresh data on homepage
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      
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
            <Label>{language === "th" ? "รูปภาพ (ลากวางหรือคลิกเพื่อเลือกหลายไฟล์)" : "Images (Drag & drop or click to select multiple files)"}</Label>
            
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => document.getElementById('gallery-upload')?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {language === "th" 
                  ? "ลากหลายไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก" 
                  : "Drag multiple files here or click to select"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "th" 
                  ? `รองรับไฟล์ภาพ (สูงสุด 5MB ต่อไฟล์) • ${formData.files.length} ไฟล์ที่เลือก` 
                  : `Supports image files (max 5MB per file) • ${formData.files.length} files selected`}
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="gallery-upload"
              />
            </div>

            {/* Preview Grid */}
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-24 object-cover rounded border border-border" 
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-center mt-1 text-muted-foreground truncate">
                      {formData.files[index]?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleUpload} disabled={submitting} className="mt-4">
            {submitting ? (
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
