import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Edit, Trash2, Star, Coffee, Image as ImageIcon, GripVertical } from "lucide-react";
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
  FormDescription,
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

const categoryFormSchema = z.object({
  name_th: z.string().min(1, "กรุณากรอกชื่อภาษาไทย"),
  name_en: z.string().min(1, "Please enter English name"),
});

const menuFormSchema = z.object({
  name_th: z.string().min(1, "กรุณากรอกชื่อภาษาไทย"),
  name_en: z.string().min(1, "Please enter English name"),
  description_th: z.string().optional(),
  description_en: z.string().optional(),
  price: z.string().min(1, "กรุณากรอกราคา"),
  category_id: z.string().optional(),
  is_recommended: z.boolean().default(false),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type MenuFormValues = z.infer<typeof menuFormSchema>;

interface Category {
  id: string;
  name_th: string;
  name_en: string;
  sort_order: number;
}

interface Menu {
  id: string;
  name_th: string;
  name_en: string;
  description_th?: string;
  description_en?: string;
  price: number;
  category_id?: string;
  image_url?: string;
  icon_url?: string;
  is_recommended: boolean;
  is_active: boolean;
  sort_order: number;
}

export const MenusManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [iconPreview, setIconPreview] = useState<string>("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingIcon, setIsDraggingIcon] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ url: string; isExisting: boolean } | null>(null);
  const [iconToDelete, setIconToDelete] = useState<{ url: string; isExisting: boolean } | null>(null);
  const [draggedMenuId, setDraggedMenuId] = useState<string | null>(null);
  const [dragOverMenuId, setDragOverMenuId] = useState<string | null>(null);
  const [savingMenuOrder, setSavingMenuOrder] = useState(false);

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name_th: "",
      name_en: "",
    },
  });

  const menuForm = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name_th: "",
      name_en: "",
      description_th: "",
      description_en: "",
      price: "",
      category_id: "",
      is_recommended: false,
    },
  });

  useEffect(() => {
    loadCategories();
    loadMenus();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error(
        language === "th" ? "ไม่สามารถโหลดหมวดหมู่ได้" : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMenus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error("Error loading menus:", error);
      toast.error(
        language === "th" ? "ไม่สามารถโหลดเมนูได้" : "Failed to load menus"
      );
    } finally {
      setLoading(false);
    }
  };

  // Category CRUD
  const onSubmitCategory = async (values: CategoryFormValues) => {
    try {
      setSubmitting(true);

      if (selectedCategory) {
        const { error } = await supabase
          .from("menu_categories")
          .update({
            name_th: values.name_th,
            name_en: values.name_en,
          })
          .eq("id", selectedCategory.id);

        if (error) throw error;
        toast.success(language === "th" ? "แก้ไขสำเร็จ" : "Updated successfully");
      } else {
        const { error } = await supabase
          .from("menu_categories")
          .insert([{
            name_th: values.name_th,
            name_en: values.name_en,
            sort_order: categories.length,
          }]);

        if (error) throw error;
        toast.success(language === "th" ? "เพิ่มสำเร็จ" : "Added successfully");
      }

      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(language === "th" ? "ไม่สามารถบันทึกได้" : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", categoryToDelete.id);

      if (error) throw error;

      toast.success(language === "th" ? "ลบสำเร็จ" : "Deleted successfully");
      setCategoryToDelete(null);
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(language === "th" ? "ไม่สามารถลบได้" : "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  // Menu CRUD
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast.error(
          language === "th" ? "กรุณาเลือกเฉพาะไฟล์รูปภาพ" : "Please select only image files"
        );
        continue;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setImageFiles(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        language === "th" ? "กรุณาเลือกไฟล์รูปภาพ" : "Please select an image file"
      );
      return;
    }

    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = () => {
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast.error(
          language === "th" ? "กรุณาเลือกเฉพาะไฟล์รูปภาพ" : "Please select only image files"
        );
        continue;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setImageFiles(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const handleIconDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingIcon(true);
  };

  const handleIconDragLeave = () => {
    setIsDraggingIcon(false);
  };

  const handleIconDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingIcon(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        language === "th" ? "กรุณาเลือกไฟล์รูปภาพ" : "Please select an image file"
      );
      return;
    }

    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const uploadImages = async (): Promise<string[]> => {
    // In edit mode, return the remaining previews that include both existing and new images
    // Filter out the ones that are URLs (existing from DB) vs Object URLs (new uploads)
    if (selectedMenu) {
      // For edit mode: use all imagePreviews as they represent the desired state
      // But only upload the new files from imageFiles
      if (imageFiles.length === 0) {
        // No new files uploaded, return existing preview URLs that are from the database
        return imagePreviews.filter(p => p.includes('http'));
      }
      
      // Upload new files and return their URLs
      const uploadedUrls: string[] = [];
      try {
        setUploadingImage(true);
        for (const imageFile of imageFiles) {
          const fileExt = imageFile.name.split(".").pop();
          const fileName = `menu-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("menus")
            .upload(fileName, imageFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("menus")
            .getPublicUrl(fileName);

          uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
      } catch (error) {
        console.error("Error uploading images:", error);
        toast.error(
          language === "th" ? "ไม่สามารถอัพโหลดรูปภาพได้" : "Failed to upload images"
        );
        return [];
      } finally {
        setUploadingImage(false);
      }
    }
    
    // Create mode: previous behavior
    if (imageFiles.length === 0) {
      return [];
    }

    try {
      setUploadingImage(true);
      const uploadedUrls: string[] = [];

      for (const imageFile of imageFiles) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `menu-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("menus")
          .upload(fileName, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("menus")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error(
        language === "th" ? "ไม่สามารถอัพโหลดรูปภาพได้" : "Failed to upload images"
      );
      return [];
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadIcon = async (): Promise<string | null> => {
    if (!iconFile) return selectedMenu?.icon_url || null;

    try {
      setUploadingIcon(true);
      const fileExt = iconFile.name.split(".").pop();
      const fileName = `icon-${Date.now()}.${fileExt}`;

      // Delete old icon if exists
      if (selectedMenu?.icon_url) {
        const oldFileName = selectedMenu.icon_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage.from("menus").remove([oldFileName]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("menus")
        .upload(fileName, iconFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("menus")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading icon:", error);
      toast.error(
        language === "th" ? "ไม่สามารถอัพโหลดไอคอนได้" : "Failed to upload icon"
      );
      return null;
    } finally {
      setUploadingIcon(false);
    }
  };

  const onSubmitMenu = async (values: MenuFormValues) => {
    try {
      setSubmitting(true);

      const imageUrls = await uploadImages();

      if (imageUrls.length === 0 && !selectedMenu) {
        toast.error(language === "th" ? "กรุณาเลือกรูปภาพอย่างน้อย 1 รูป" : "Please select at least one image");
        return;
      }

      const baseMenuData = {
        name_th: values.name_th,
        name_en: values.name_en,
        description_th: values.description_th || null,
        description_en: values.description_en || null,
        price: parseFloat(values.price),
        category_id: values.category_id || null,
        is_recommended: values.is_recommended,
        is_active: true,
      };

      if (selectedMenu) {
        // Edit mode: update the existing menu
        // Determine the final image URL to save
        let finalImageUrl: string | null = null;
        
        // If there are image URLs from upload, use the first one
        if (imageUrls.length > 0) {
          finalImageUrl = imageUrls[0];
          
          // Delete old image if exists and we're uploading a new one
          if (selectedMenu.image_url && imageFiles.length > 0) {
            const oldFileName = selectedMenu.image_url.split("/").pop();
            if (oldFileName) {
              await supabase.storage.from("menus").remove([oldFileName]);
            }
          }
        } else {
          // No new images uploaded, check if there are remaining images in previews
          // (the user may have deleted some images)
          const remainingImages = imagePreviews.filter(p => p.includes('http'));
          finalImageUrl = remainingImages.length > 0 ? remainingImages[0] : null;
        }

        const { error } = await supabase
          .from("menus")
          .update({
            ...baseMenuData,
            image_url: finalImageUrl,
          })
          .eq("id", selectedMenu.id);

        if (error) throw error;
        toast.success(language === "th" ? "แก้ไขสำเร็จ" : "Updated successfully");
      } else {
        // Create mode: create multiple menus if multiple images
        const menusToInsert = imageUrls.map((imageUrl, index) => ({
          ...baseMenuData,
          image_url: imageUrl,
          sort_order: menus.length + index,
        }));

        const { error } = await supabase
          .from("menus")
          .insert(menusToInsert);

        if (error) throw error;
        
        const count = imageUrls.length;
        toast.success(
          language === "th" 
            ? `เพิ่มเมนูสำเร็จ ${count} รายการ` 
            : `Successfully added ${count} menu${count > 1 ? 's' : ''}`
        );
      }

      // Update cache version and force refetch
      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["menus"] });
      await queryClient.refetchQueries({ queryKey: ["menus"] });

      setIsMenuDialogOpen(false);
      resetMenuForm();
      loadMenus();
    } catch (error) {
      console.error("Error saving menu:", error);
      toast.error(language === "th" ? "ไม่สามารถบันทึกได้" : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    menuForm.reset({
      name_th: menu.name_th,
      name_en: menu.name_en,
      description_th: menu.description_th || "",
      description_en: menu.description_en || "",
      price: menu.price.toString(),
      category_id: menu.category_id || "",
      is_recommended: menu.is_recommended,
    });
    setImageFiles([]);
    setImagePreviews(menu.image_url ? [menu.image_url] : []);
    setIconPreview(menu.icon_url || "");
    setIsMenuDialogOpen(true);
  };

  const handleDeleteMenu = async () => {
    if (!menuToDelete) return;

    try {
      setLoading(true);

      // Delete images from storage
      if (menuToDelete.image_url) {
        const pathMatch = menuToDelete.image_url.match(/\/storage\/v1\/object\/public\/menus\/(.+)$/);
        const storagePath = pathMatch ? pathMatch[1] : menuToDelete.image_url.split("/").pop();
        if (storagePath) {
          await supabase.storage.from("menus").remove([storagePath]);
        }
      }

      if (menuToDelete.icon_url) {
        const pathMatch = menuToDelete.icon_url.match(/\/storage\/v1\/object\/public\/menus\/(.+)$/);
        const storagePath = pathMatch ? pathMatch[1] : menuToDelete.icon_url.split("/").pop();
        if (storagePath) {
          await supabase.storage.from("menus").remove([storagePath]);
        }
      }

      const { error } = await supabase
        .from("menus")
        .delete()
        .eq("id", menuToDelete.id);

      if (error) throw error;

      toast.success(language === "th" ? "ลบเมนูสำเร็จ" : "Menu deleted successfully");
      setMenuToDelete(null);
      loadMenus();
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast.error(language === "th" ? "ไม่สามารถลบเมนูได้" : "Failed to delete menu");
    } finally {
      setLoading(false);
    }
  };

  // Direct delete without confirmation (used inside edit dialog to avoid modal stacking)
  const handleDirectImageDelete = async (url: string, isExisting: boolean, index: number) => {
    try {
      setLoading(true);

      if (isExisting) {
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/menus\/(.+)$/);
        const storagePath = pathMatch ? pathMatch[1] : url.split("/").pop();
        if (storagePath) {
          await supabase.storage.from("menus").remove([storagePath]);
        }
        if (selectedMenu) {
          await supabase.from("menus").update({ image_url: null }).eq("id", selectedMenu.id);
          setSelectedMenu({ ...selectedMenu, image_url: undefined });
        }
      }

      setImagePreviews(prev => prev.filter(p => p !== url));
      if (!isExisting) {
        const existingCount = imagePreviews.filter(p => p.startsWith("http")).length;
        const fileIndex = index - existingCount;
        if (fileIndex >= 0) {
          setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
      }

      toast.success(language === "th" ? "ลบรูปภาพสำเร็จ" : "Image deleted");
      if (isExisting) loadMenus();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(language === "th" ? "ไม่สามารถลบรูปภาพได้" : "Failed to delete image");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectIconDelete = async (url: string) => {
    try {
      setLoading(true);
      const isExisting = url.startsWith("http");

      if (isExisting) {
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/menus\/(.+)$/);
        const storagePath = pathMatch ? pathMatch[1] : url.split("/").pop();
        if (storagePath) {
          await supabase.storage.from("menus").remove([storagePath]);
        }
        if (selectedMenu) {
          await supabase.from("menus").update({ icon_url: null }).eq("id", selectedMenu.id);
        }
      }

      setIconPreview("");
      setIconFile(null);
      toast.success(language === "th" ? "ลบไอคอนสำเร็จ" : "Icon deleted");
      if (isExisting) loadMenus();
    } catch (error) {
      console.error("Error deleting icon:", error);
      toast.error(language === "th" ? "ไม่สามารถลบไอคอนได้" : "Failed to delete icon");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      setLoading(true);

      if (imageToDelete.isExisting) {
        // Delete from storage - extract path after /public/menus/
        const url = imageToDelete.url;
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/menus\/(.+)$/);
        const storagePath = pathMatch ? pathMatch[1] : url.split("/").pop();
        
        if (storagePath) {
          const { error: storageError } = await supabase.storage.from("menus").remove([storagePath]);
          if (storageError) {
            console.warn("Storage delete warning:", storageError);
          }
        }

        // Update database to remove image
        if (selectedMenu) {
          const { error } = await supabase
            .from("menus")
            .update({ image_url: null })
            .eq("id", selectedMenu.id);

          if (error) throw error;
          
          // Update local selectedMenu state
          setSelectedMenu({ ...selectedMenu, image_url: undefined });
        }
      }

      // Remove from preview arrays
      const deletedUrl = imageToDelete.url;
      const deleteIndex = imagePreviews.indexOf(deletedUrl);
      
      setImagePreviews(prev => prev.filter(p => p !== deletedUrl));
      
      // Remove corresponding file from imageFiles if it's a new upload (blob URL)
      if (!imageToDelete.isExisting && deleteIndex >= 0) {
        // Calculate the index within imageFiles (subtract existing image count)
        const existingCount = imagePreviews.filter(p => p.startsWith("http")).length;
        const fileIndex = deleteIndex - existingCount;
        if (fileIndex >= 0 && fileIndex < imageFiles.length) {
          setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
      }

      toast.success(
        language === "th" ? "ลบรูปภาพสำเร็จ" : "Image deleted successfully"
      );
      setImageToDelete(null);
      
      if (imageToDelete.isExisting) {
        loadMenus();
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(
        language === "th" ? "ไม่สามารถลบรูปภาพได้" : "Failed to delete image"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIcon = async () => {
    if (!iconToDelete) return;

    try {
      setLoading(true);

      if (iconToDelete.isExisting) {
        // Delete from storage
        const url = iconToDelete.url;
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/menus\/(.+)$/);
        const storagePath = pathMatch ? pathMatch[1] : url.split("/").pop();
        
        if (storagePath) {
          await supabase.storage.from("menus").remove([storagePath]);
        }

        // Update database
        if (selectedMenu) {
          const { error } = await supabase
            .from("menus")
            .update({ icon_url: null })
            .eq("id", selectedMenu.id);

          if (error) throw error;
        }
      }

      setIconPreview("");
      setIconFile(null);

      toast.success(
        language === "th" ? "ลบไอคอนสำเร็จ" : "Icon deleted successfully"
      );
      setIconToDelete(null);
      
      if (iconToDelete.isExisting) {
        loadMenus();
      }
    } catch (error) {
      console.error("Error deleting icon:", error);
      toast.error(
        language === "th" ? "ไม่สามารถลบไอคอนได้" : "Failed to delete icon"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetCategoryForm = () => {
    setSelectedCategory(null);
    categoryForm.reset({
      name_th: "",
      name_en: "",
    });
  };

  const resetMenuForm = () => {
    setSelectedMenu(null);
    menuForm.reset({
      name_th: "",
      name_en: "",
      description_th: "",
      description_en: "",
      price: "",
      category_id: "",
      is_recommended: false,
    });
    setImageFiles([]);
    setIconFile(null);
    setImagePreviews([]);
    setIconPreview("");
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return language === "th" ? "ไม่มีหมวดหมู่" : "No category";
    const category = categories.find((c) => c.id === categoryId);
    return category ? (language === "th" ? category.name_th : category.name_en) : "-";
  };

  const reorderMenus = (items: Menu[], draggedId: string, targetId: string) => {
    const fromIndex = items.findIndex((item) => item.id === draggedId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;

    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return updated;
  };

  const handleMenuReorderDrop = async (targetId: string) => {
    if (!draggedMenuId || draggedMenuId === targetId) {
      setDraggedMenuId(null);
      setDragOverMenuId(null);
      return;
    }

    const previousMenus = [...menus];
    const reorderedMenus = reorderMenus(previousMenus, draggedMenuId, targetId);

    setMenus(reorderedMenus);
    setDraggedMenuId(null);
    setDragOverMenuId(null);
    setSavingMenuOrder(true);

    try {
      const results = await Promise.all(
        reorderedMenus.map((menu, index) =>
          supabase
            .from("menus")
            .update({ sort_order: index })
            .eq("id", menu.id)
        )
      );

      const hasError = results.some((result) => result.error);
      if (hasError) {
        setMenus(previousMenus);
        toast.error(language === "th" ? "จัดลำดับเมนูไม่สำเร็จ" : "Failed to reorder menus");
        return;
      }

      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["menus"] });
      await queryClient.refetchQueries({ queryKey: ["menus"] });
      toast.success(language === "th" ? "อัปเดตลำดับเมนูแล้ว" : "Menu order updated");
    } catch (error) {
      console.error("Error reordering menus:", error);
      setMenus(previousMenus);
      toast.error(language === "th" ? "จัดลำดับเมนูไม่สำเร็จ" : "Failed to reorder menus");
    } finally {
      setSavingMenuOrder(false);
    }
  };

  if (loading && categories.length === 0 && menus.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="menus" className="w-full">
        <TabsList className="grid w-full md:grid-cols-2 grid-cols-1 md:w-auto inline-flex md:inline-grid bg-card/50 border border-primary/20 rounded-lg p-1 shadow-sm" style={{ scrollbarWidth: 'none' }}>
          <TabsTrigger value="menus" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all hover:bg-primary/10">
            {language === "th" ? "จัดการเมนู" : "Manage Menus"}
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all hover:bg-primary/10">
            {language === "th" ? "หมวดหมู่" : "Categories"}
          </TabsTrigger>
        </TabsList>

        {/* Menus Tab */}
        <TabsContent value="menus" className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold truncate text-primary">
                {language === "th" ? "จัดการเมนู" : "Manage Menus"}
              </h3>
              <p className="text-xs sm:text-sm text-foreground">
                {language === "th"
                  ? "เพิ่ม แก้ไข หรือลบเมนู"
                  : "Add, edit, or delete menus"}
              </p>
            </div>
            <Dialog
              open={isMenuDialogOpen}
              onOpenChange={(open) => {
                setIsMenuDialogOpen(open);
                if (!open) resetMenuForm();
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedMenu(null)} size="sm" className="shrink-0">
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">{language === "th" ? "เพิ่มเมนู" : "Add Menu"}</span>
                  <span className="sm:hidden">{language === "th" ? "เพิ่ม" : "Add"}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[95vh] overflow-y-auto p-3 sm:p-4 md:p-5">
                <DialogHeader className="pb-2">
                  <DialogTitle className={selectedMenu ? "text-base sm:text-lg md:text-xl font-bold text-amber-900" : "text-sm sm:text-base md:text-lg font-bold"}>
                    {selectedMenu
                      ? language === "th" ? "แก้ไขเมนู" : "Edit Menu"
                      : language === "th" ? "เพิ่มเมนูใหม่" : "Add New Menu"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...menuForm}>
                  <form onSubmit={menuForm.handleSubmit(onSubmitMenu)} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <FormField
                        control={menuForm.control}
                        name="name_th"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary text-sm">{language === "th" ? "ชื่อเมนู (ไทย)" : "Menu Name (Thai)"}</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={submitting} className="bg-white text-foreground" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={menuForm.control}
                        name="name_en"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary text-sm">{language === "th" ? "ชื่อเมนู (อังกฤษ)" : "Menu Name (English)"}</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={submitting} className="bg-white text-foreground" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <FormField
                        control={menuForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary text-sm">{language === "th" ? "ราคาอาหาร (บาท)" : "Food Price (THB)"}</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" disabled={submitting} className="bg-white text-foreground" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={menuForm.control}
                        name="category_id"
                        render={({ field }) => {
                          const selectedCategoryObj = categories.find(c => c.id === field.value);
                          const selectedCategoryName = selectedCategoryObj 
                            ? (language === "th" ? selectedCategoryObj.name_th : selectedCategoryObj.name_en)
                            : null;
                          return (
                            <FormItem>
                              <FormLabel className="text-primary">{language === "th" ? "หมวดหมู่" : "Category"}</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                                disabled={submitting}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-white text-foreground">
                                    <SelectValue>{selectedCategoryName || (language === "th" ? "เลือกหมวดหมู่" : "Select category")}</SelectValue>
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {language === "th" ? cat.name_th : cat.name_en}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <FormField
                      control={menuForm.control}
                      name="description_th"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary text-sm">{language === "th" ? "รายละเอียด (ไทย)" : "Description (Thai)"}</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={submitting} rows={2} className="bg-white text-foreground" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={menuForm.control}
                      name="description_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary text-sm">{language === "th" ? "รายละเอียด (อังกฤษ)" : "Description (English)"}</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={submitting} rows={2} className="bg-white text-foreground" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={menuForm.control}
                      name="is_recommended"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 sm:p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm text-primary">
                              {language === "th" ? "เมนูแนะนำ" : "Recommended Menu"}
                            </FormLabel>
                            <FormDescription className="text-xs">
                              {language === "th"
                                ? "แสดงเมนูนี้ในส่วนเมนูแนะนำ"
                                : "Show this menu in recommended section"}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={submitting}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                      <Label className="text-primary font-semibold bg-white px-2 py-0.5 rounded inline-block text-xs sm:text-sm">{language === "th" ? "รูปภาพเมนู" : "Menu Image"}</Label>
                      <div
                        onDragOver={handleImageDragOver}
                        onDragLeave={handleImageDragLeave}
                        onDrop={handleImageDrop}
                        className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors ${
                          isDraggingImage
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          disabled={loading || uploadingImage}
                          className="hidden"
                          id="menu-image-upload"
                        />
                        <label
                          htmlFor="menu-image-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <ImageIcon className="w-6 h-6 text-foreground/50 mb-1" />
                          <p className="text-xs text-foreground">
                            {language === "th"
                              ? "คลิกหรือลากไฟล์มาวาง (อัพโหลดได้หลายรูป)"
                              : "Click or drag files here (Multiple)"}
                          </p>
                        </label>
                      </div>
                      {imagePreviews.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-foreground mb-2">
                            {language === "th"
                              ? `แสดง ${imagePreviews.length} รูป (วางเมาส์เพื่อลบ)`
                              : `${imagePreviews.length} image${imagePreviews.length > 1 ? "s" : ""} (hover to delete)`}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {imagePreviews.map((preview, index) => {
                              const isExisting = preview.startsWith("http");
                              return (
                                <div key={index} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`Menu preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                  {isExisting && selectedMenu && (
                                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md opacity-80">
                                      {language === "th" ? "ปัจจุบัน" : "Current"}
                                    </div>
                                  )}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-1 right-1 h-7 w-7 p-0 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const isExistingUrl = preview.startsWith("http");
                                      // Delete directly without confirmation dialog
                                      handleDirectImageDelete(preview, isExistingUrl, index);
                                    }}
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-1.5 sm:gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        className="font-semibold text-foreground hover:bg-secondary/80 w-full sm:w-auto text-sm"
                        onClick={() => {
                          setIsMenuDialogOpen(false);
                          resetMenuForm();
                        }}
                        disabled={submitting || uploadingImage || uploadingIcon}
                      >
                        {language === "th" ? "ยกเลิก" : "Cancel"}
                      </Button>
                      <Button type="submit" disabled={submitting || uploadingImage || uploadingIcon} className="w-full sm:w-auto text-sm">
                        {submitting || uploadingImage || uploadingIcon ? (
                          <>
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            {language === "th" ? "กำลังบันทึก..." : "Saving..."}
                          </>
                        ) : (
                          language === "th" ? "บันทึก" : "Save"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Menus Grid */}
          {menus.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Coffee className="w-16 h-16 text-foreground/30 mb-4" />
                <p className="text-foreground">
                  {language === "th"
                    ? "ยังไม่มีเมนู กดปุ่มเพิ่มเมนูเพื่อเริ่มต้น"
                    : "No menus yet. Click Add Menu to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {language === "th"
                    ? "ลากการ์ดเมนูเพื่อจัดลำดับก่อน-หลัง"
                    : "Drag menu cards to reorder"}
                </p>
                {savingMenuOrder && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {language === "th" ? "กำลังบันทึกลำดับ..." : "Saving order..."}
                  </span>
                )}
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {menus.map((menu) => (
                <Card
                  key={menu.id}
                  draggable={!savingMenuOrder}
                  onDragStart={() => setDraggedMenuId(menu.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverMenuId !== menu.id) setDragOverMenuId(menu.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverMenuId === menu.id) setDragOverMenuId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleMenuReorderDrop(menu.id);
                  }}
                  onDragEnd={() => {
                    setDraggedMenuId(null);
                    setDragOverMenuId(null);
                  }}
                  className={`overflow-hidden transition-all ${
                    dragOverMenuId === menu.id ? "ring-2 ring-primary scale-[1.01]" : ""
                  } ${draggedMenuId === menu.id ? "opacity-70" : ""}`}
                >
                  {menu.image_url && (
                    <img
                      src={menu.image_url}
                      alt={menu.name_en}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded bg-primary/10 text-primary px-1.5 py-0.5">
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-lg">
                            {language === "th" ? menu.name_th : menu.name_en}
                          </span>
                          {menu.is_recommended && (
                            <Star className="w-4 h-4 fill-primary text-primary" />
                          )}
                        </div>
                        <div className="text-sm font-normal text-primary mt-1">
                          ฿{menu.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-foreground mt-1">
                          {getCategoryName(menu.category_id)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditMenu(menu)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setMenuToDelete(menu)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {(menu.description_th || menu.description_en) && (
                    <CardContent>
                      <p className="text-sm text-foreground line-clamp-2">
                        {language === "th" ? menu.description_th : menu.description_en}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold truncate text-primary">
                {language === "th" ? "จัดการหมวดหมู่" : "Manage Categories"}
              </h3>
              <p className="text-xs sm:text-sm text-foreground">
                {language === "th"
                  ? "เพิ่ม แก้ไข หรือลบหมวดหมู่เมนู"
                  : "Add, edit, or delete menu categories"}
              </p>
            </div>
            <Dialog
              open={isCategoryDialogOpen}
              onOpenChange={(open) => {
                setIsCategoryDialogOpen(open);
                if (!open) resetCategoryForm();
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedCategory(null)} size="sm" className="shrink-0">
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">{language === "th" ? "เพิ่มหมวดหมู่" : "Add Category"}</span>
                  <span className="sm:hidden">{language === "th" ? "เพิ่ม" : "Add"}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedCategory
                      ? language === "th" ? "แก้ไขหมวดหมู่" : "Edit Category"
                      : language === "th" ? "เพิ่มหมวดหมู่ใหม่" : "Add New Category"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="name_th"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">{language === "th" ? "ชื่อหมวดหมู่ (ไทย)" : "Category Name (Thai)"}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={loading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoryForm.control}
                      name="name_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">{language === "th" ? "ชื่อหมวดหมู่ (อังกฤษ)" : "Category Name (English)"}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={loading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCategoryDialogOpen(false);
                          resetCategoryForm();
                        }}
                        disabled={loading}
                      >
                        {language === "th" ? "ยกเลิก" : "Cancel"}
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === "th" ? "กำลังบันทึก..." : "Saving..."}
                          </>
                        ) : (
                          language === "th" ? "บันทึก" : "Save"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories List */}
          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Coffee className="w-16 h-16 text-foreground/30 mb-4" />
                <p className="text-foreground/70">
                  {language === "th"
                    ? "ยังไม่มีหมวดหมู่ กดปุ่มเพิ่มหมวดหมู่เพื่อเริ่มต้น"
                    : "No categories yet. Click Add Category to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {language === "th" ? category.name_th : category.name_en}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedCategory(category);
                            categoryForm.reset({
                              name_th: category.name_th,
                              name_en: category.name_en,
                            });
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setCategoryToDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "th" ? "ยืนยันการลบ" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "th"
                ? `คุณต้องการลบหมวดหมู่ "${categoryToDelete?.name_th}" หรือไม่?`
                : `Are you sure you want to delete category "${categoryToDelete?.name_en}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "th" ? "ยกเลิก" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Menu Confirmation */}
      <AlertDialog open={!!menuToDelete} onOpenChange={() => setMenuToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "th" ? "ยืนยันการลบ" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "th"
                ? `คุณต้องการลบเมนู "${menuToDelete?.name_th}" หรือไม่?`
                : `Are you sure you want to delete menu "${menuToDelete?.name_en}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "th" ? "ยกเลิก" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMenu}>
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Image Confirmation */}
      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
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
              onClick={() => imageToDelete && handleDeleteImage()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Icon Confirmation */}
      <AlertDialog open={!!iconToDelete} onOpenChange={() => setIconToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "th" ? "ยืนยันการลบไอคอน" : "Confirm Delete Icon"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "th"
                ? "คุณต้องการลบไอคอนนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                : "Are you sure you want to delete this icon? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => iconToDelete && handleDeleteIcon()}
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
