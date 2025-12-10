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
import { Loader2, Plus, Edit, Trash2, Star, Coffee, Image as ImageIcon } from "lucide-react";
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

    setImageFiles(validFiles);
    setImagePreviews(previews);
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

    setImageFiles(validFiles);
    setImagePreviews(previews);
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
    if (imageFiles.length === 0) {
      return selectedMenu?.image_url ? [selectedMenu.image_url] : [];
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
      const iconUrl = await uploadIcon();

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
        icon_url: iconUrl,
        is_recommended: values.is_recommended,
        is_active: true,
      };

      if (selectedMenu) {
        // Edit mode: update the existing menu with first image
        // Delete old image if exists and we have a new one
        if (imageUrls.length > 0 && selectedMenu.image_url) {
          const oldFileName = selectedMenu.image_url.split("/").pop();
          if (oldFileName) {
            await supabase.storage.from("menus").remove([oldFileName]);
          }
        }

        const { error } = await supabase
          .from("menus")
          .update({
            ...baseMenuData,
            image_url: imageUrls[0] || selectedMenu.image_url,
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
        const fileName = menuToDelete.image_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("menus").remove([fileName]);
        }
      }

      if (menuToDelete.icon_url) {
        const fileName = menuToDelete.icon_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("menus").remove([fileName]);
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menus">
            {language === "th" ? "จัดการเมนู" : "Manage Menus"}
          </TabsTrigger>
          <TabsTrigger value="categories">
            {language === "th" ? "หมวดหมู่" : "Categories"}
          </TabsTrigger>
        </TabsList>

        {/* Menus Tab */}
        <TabsContent value="menus" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {language === "th" ? "จัดการเมนู" : "Manage Menus"}
              </h3>
              <p className="text-sm text-muted-foreground">
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
                <Button onClick={() => setSelectedMenu(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "th" ? "เพิ่มเมนู" : "Add Menu"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedMenu
                      ? language === "th" ? "แก้ไขเมนู" : "Edit Menu"
                      : language === "th" ? "เพิ่มเมนูใหม่" : "Add New Menu"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...menuForm}>
                  <form onSubmit={menuForm.handleSubmit(onSubmitMenu)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={menuForm.control}
                        name="name_th"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "th" ? "ชื่อเมนู (ไทย)" : "Menu Name (Thai)"}</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={submitting} />
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
                            <FormLabel>{language === "th" ? "ชื่อเมนู (อังกฤษ)" : "Menu Name (English)"}</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={submitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={menuForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "th" ? "ราคา (บาท)" : "Price (THB)"}</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" disabled={submitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={menuForm.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "th" ? "หมวดหมู่" : "Category"}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={submitting}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={language === "th" ? "เลือกหมวดหมู่" : "Select category"} />
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
                        )}
                      />
                    </div>

                    <FormField
                      control={menuForm.control}
                      name="description_th"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "th" ? "รายละเอียด (ไทย)" : "Description (Thai)"}</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={submitting} rows={3} />
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
                          <FormLabel>{language === "th" ? "รายละเอียด (อังกฤษ)" : "Description (English)"}</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={submitting} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={menuForm.control}
                      name="is_recommended"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {language === "th" ? "เมนูแนะนำ" : "Recommended Menu"}
                            </FormLabel>
                            <FormDescription>
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
                    <div className="space-y-2">
                      <Label>{language === "th" ? "รูปภาพเมนู" : "Menu Image"}</Label>
                      <div
                        onDragOver={handleImageDragOver}
                        onDragLeave={handleImageDragLeave}
                        onDrop={handleImageDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                          <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {language === "th"
                              ? "คลิกหรือลากไฟล์มาวาง (อัพโหลดได้หลายรูป)"
                              : "Click or drag files here (Multiple uploads)"}
                          </p>
                        </label>
                      </div>
                      {imagePreviews.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Menu preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => {
                                  setImageFiles(prev => prev.filter((_, i) => i !== index));
                                  setImagePreviews(prev => prev.filter((_, i) => i !== index));
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Icon Upload */}
                    <div className="space-y-2">
                      <Label>{language === "th" ? "ไอคอนเมนู" : "Menu Icon"}</Label>
                      <div
                        onDragOver={handleIconDragOver}
                        onDragLeave={handleIconDragLeave}
                        onDrop={handleIconDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isDraggingIcon
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleIconSelect}
                          disabled={loading || uploadingIcon}
                          className="hidden"
                          id="menu-icon-upload"
                        />
                        <label
                          htmlFor="menu-icon-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {language === "th"
                              ? "คลิกหรือลากไฟล์มาวาง"
                              : "Click or drag file here"}
                          </p>
                        </label>
                      </div>
                      {iconPreview && (
                        <div className="mt-2 relative inline-block">
                          <img
                            src={iconPreview}
                            alt="Icon preview"
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => {
                              setIconFile(null);
                              setIconPreview("");
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsMenuDialogOpen(false);
                          resetMenuForm();
                        }}
                        disabled={submitting || uploadingImage || uploadingIcon}
                      >
                        {language === "th" ? "ยกเลิก" : "Cancel"}
                      </Button>
                      <Button type="submit" disabled={submitting || uploadingImage || uploadingIcon}>
                        {submitting || uploadingImage || uploadingIcon ? (
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

          {/* Menus Grid */}
          {menus.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Coffee className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {language === "th"
                    ? "ยังไม่มีเมนู กดปุ่มเพิ่มเมนูเพื่อเริ่มต้น"
                    : "No menus yet. Click Add Menu to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menus.map((menu) => (
                <Card key={menu.id} className="overflow-hidden">
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
                          {menu.icon_url && (
                            <img
                              src={menu.icon_url}
                              alt="icon"
                              className="w-6 h-6 object-contain"
                            />
                          )}
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
                        <div className="text-xs text-muted-foreground mt-1">
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {language === "th" ? menu.description_th : menu.description_en}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {language === "th" ? "จัดการหมวดหมู่" : "Manage Categories"}
              </h3>
              <p className="text-sm text-muted-foreground">
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
                <Button onClick={() => setSelectedCategory(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "th" ? "เพิ่มหมวดหมู่" : "Add Category"}
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
                          <FormLabel>{language === "th" ? "ชื่อหมวดหมู่ (ไทย)" : "Category Name (Thai)"}</FormLabel>
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
                          <FormLabel>{language === "th" ? "ชื่อหมวดหมู่ (อังกฤษ)" : "Category Name (English)"}</FormLabel>
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
                <Coffee className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
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
    </div>
  );
};
