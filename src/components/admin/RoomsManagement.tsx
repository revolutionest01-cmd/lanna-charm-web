import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, X, Image as ImageIcon, GripVertical } from "lucide-react";
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
import { ImageUploadZone } from "./ImageUploadZone";
import { RoomStats } from "./RoomStats";
import { calculateRoomStats } from "./roomManagementUtils";

const roomFormSchema = z.object({
  name_th: z.string().min(1, "กรุณากรอกชื่อภาษาไทย"),
  name_en: z.string().min(1, "Please enter English name"),
  description_th: z.string().optional(),
  description_en: z.string().optional(),
  price: z.string().min(1, "กรุณากรอกราคา"),
  capacity: z.string().optional(),
  amenities_th: z.string().optional(),
  amenities_en: z.string().optional(),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface Room {
  id: string;
  name_th: string;
  name_en: string;
  description_th?: string;
  description_en?: string;
  price: number;
  capacity?: string;
  amenities_th?: string;
  amenities_en?: string;
  is_active: boolean;
  sort_order: number;
  images?: RoomImage[];
}

interface RoomImage {
  id: string;
  room_id: string;
  image_url: string;
  sort_order: number;
}

export const RoomsManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [_imageToDelete, _setImageToDelete] = useState<RoomImage | null>(null);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name_th: "",
      name_en: "",
      description_th: "",
      description_en: "",
      price: "",
      capacity: "",
      amenities_th: "",
      amenities_en: "",
    },
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .order("sort_order", { ascending: true });

      if (roomsError) throw roomsError;

      // Load images for each room
      const roomsWithImages = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { data: images } = await supabase
            .from("room_images")
            .select("*")
            .eq("room_id", room.id)
            .order("sort_order", { ascending: true });

          return { ...room, images: images || [] };
        })
      );

      setRooms(roomsWithImages);
    } catch (error) {
      console.error("Error loading rooms:", error);
      toast.error(
        language === "th" ? "ไม่สามารถโหลดข้อมูลได้" : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (files: File[]) => {
    const MAX_IMAGES = 10;
    
    // Validate total image count
    const totalImages = imageFiles.length + imagePreviews.length + files.length;
    if (totalImages > MAX_IMAGES) {
      toast.error(
        language === "th"
          ? `จำนวนรูปภาพไม่เกิน ${MAX_IMAGES} ภาพ`
          : `Maximum ${MAX_IMAGES} images allowed`
      );
      return;
    }

    // Add new files
    setImageFiles((prev) => [...prev, ...files]);
    
    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImagePreview = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (roomId: string, startOrder: number = 0): Promise<boolean> => {
    if (imageFiles.length === 0) return true;

    try {
      setUploadingImages(true);

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `room-${roomId}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("rooms")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("rooms").getPublicUrl(filePath);

        // Save to database with sort order
        const { error: dbError } = await supabase
          .from("room_images")
          .insert([{
            room_id: roomId,
            image_url: publicUrl,
            sort_order: startOrder + i,
          }]);

        if (dbError) throw dbError;
      }

      return true;
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error(
        language === "th"
          ? "ไม่สามารถอัพโหลดรูปภาพได้"
          : "Failed to upload images"
      );
      return false;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (image: RoomImage) => {
    try {
      setUploadingImages(true);

      // Extract correct storage path from public URL
      const urlParts = image.image_url.split('/storage/v1/object/public/rooms/');
      const storagePath = urlParts.length > 1 ? urlParts[1] : image.image_url.split("/").pop();
      if (storagePath) {
        const { error: storageError } = await supabase.storage.from("rooms").remove([storagePath]);
        if (storageError) {
          console.warn("Storage delete warning:", storageError);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from("room_images")
        .delete()
        .eq("id", image.id);

      if (error) throw error;

      // Update selectedRoom state immediately so UI reflects the change
      if (selectedRoom) {
        const updatedImages = (selectedRoom.images || []).filter(img => img.id !== image.id);
        setSelectedRoom({ ...selectedRoom, images: updatedImages });
      }

      toast.success(
        language === "th" ? "ลบรูปภาพสำเร็จ" : "Image deleted successfully"
      );
      
      loadRooms();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(
        language === "th" ? "ไม่สามารถลบรูปภาพได้" : "Failed to delete image"
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const onSubmit = async (values: RoomFormValues) => {
    try {
      setSubmitting(true);

      const roomData = {
        name_th: values.name_th,
        name_en: values.name_en,
        description_th: values.description_th || null,
        description_en: values.description_en || null,
        price: parseFloat(values.price),
        capacity: values.capacity || null,
        amenities_th: values.amenities_th || null,
        amenities_en: values.amenities_en || null,
        is_active: true,
      };

      if (selectedRoom) {
        // Update existing room
        const { error } = await supabase
          .from("rooms")
          .update(roomData)
          .eq("id", selectedRoom.id);

        if (error) throw error;

        // Upload new images if any
        const existingImageCount = selectedRoom.images?.length || 0;
        if (imageFiles.length > 0) {
          await uploadImages(selectedRoom.id, existingImageCount);
        }

        toast.success(
          language === "th" ? "แก้ไขสำเร็จ" : "Updated successfully"
        );
      } else {
        // Create new room
        const { data: newRoom, error } = await supabase
          .from("rooms")
          .insert([roomData])
          .select()
          .single();

        if (error) throw error;

        // Upload images
        if (newRoom && imageFiles.length > 0) {
          await uploadImages(newRoom.id, 0);
        }

        toast.success(
          language === "th" ? "เพิ่มห้องพักสำเร็จ" : "Room added successfully"
        );
      }

      // Update cache version and force refetch
      invalidateContentCache();
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      await queryClient.refetchQueries({ queryKey: ["rooms"] });

      setIsDialogOpen(false);
      resetForm();
      loadRooms();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error(
        language === "th" ? "ไม่สามารถบันทึกได้" : "Failed to save"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    form.reset({
      name_th: room.name_th,
      name_en: room.name_en,
      description_th: room.description_th || "",
      description_en: room.description_en || "",
      price: room.price.toString(),
      capacity: (room as any).capacity || "",
      amenities_th: (room as any).amenities_th || "",
      amenities_en: (room as any).amenities_en || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;

    try {
      setLoading(true);

      // Delete all images first
      if (roomToDelete.images && roomToDelete.images.length > 0) {
        const fileNames = roomToDelete.images
          .map((img) => img.image_url.split("/").pop())
          .filter((name): name is string => !!name);

        if (fileNames.length > 0) {
          await supabase.storage.from("rooms").remove(fileNames);
        }

        await supabase
          .from("room_images")
          .delete()
          .eq("room_id", roomToDelete.id);
      }

      // Delete room
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomToDelete.id);

      if (error) throw error;

      toast.success(
        language === "th" ? "ลบห้องพักสำเร็จ" : "Room deleted successfully"
      );
      
      setRoomToDelete(null);
      loadRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error(
        language === "th" ? "ไม่สามารถลบห้องพักได้" : "Failed to delete room"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRoom(null);
    form.reset({
      name_th: "",
      name_en: "",
      description_th: "",
      description_en: "",
      price: "",
      capacity: "",
      amenities_th: "",
      amenities_en: "",
    });
    setImageFiles([]);
    setImagePreviews([]);
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {language === "th" ? "จัดการห้องพัก" : "Manage Rooms"}
          </h3>
          <p className="text-sm text-foreground/70">
            {language === "th"
              ? "เพิ่ม แก้ไข หรือลบห้องพัก"
              : "Add, edit, or delete rooms"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedRoom(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "th" ? "เพิ่มห้องพัก" : "Add Room"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className={selectedRoom ? "text-amber-900" : ""}>
                {selectedRoom
                  ? language === "th"
                    ? "แก้ไขห้องพัก"
                    : "Edit Room"
                  : language === "th"
                  ? "เพิ่มห้องพักใหม่"
                  : "Add New Room"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name_th"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary">
                          {language === "th" ? "ชื่อห้อง (ไทย)" : "Room Name (Thai)"}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="เช่น ห้องประชุมเล็ก" className="bg-white text-foreground" {...field} disabled={submitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary">
                          {language === "th" ? "ชื่อห้อง (อังกฤษ)" : "Room Name (English)"}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Small Conference Room" className="bg-white text-foreground" {...field} disabled={submitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary">
                          {language === "th" ? "ราคา (บาท)" : "Price (THB)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="100"
                            placeholder="2000"
                            className="bg-white text-foreground"
                            disabled={submitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary">
                          {language === "th" ? "จำนวนคน" : "Capacity"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="10-15"
                            className="bg-white text-foreground"
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
                      <FormLabel className="text-primary">
                        {language === "th" ? "รายละเอียด (ไทย)" : "Description (Thai)"}
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={submitting} rows={3} placeholder="เช่น ห้องประชุมสำหรับ 10-15 คน พร้อมเอก สารและห้องค้นหา..." className="bg-white text-foreground" />
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
                      <FormLabel className="text-primary">
                        {language === "th"
                          ? "รายละเอียด (อังกฤษ)"
                          : "Description (English)"}
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={submitting} rows={3} placeholder="e.g. Conference room for 10-15 people with projector..." className="bg-white text-foreground" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amenities_th"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary">
                        {language === "th" ? "สิ่งอำนวยความสะดวก (ไทย)" : "Amenities (Thai)"}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          disabled={submitting} 
                          rows={2} 
                          placeholder="เช่น WiFi, โปรเจคเตอร์, กระดานขาว, เก้าอี้สำหรับทำงาน"
                          className="bg-white text-foreground" 
                        />
                      </FormControl>
                      <p className="text-xs text-foreground/70 mt-1">
                        {language === "th" ? "แยกด้วยจุลภาค" : "Separate with commas"}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amenities_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary">
                        {language === "th"
                          ? "สิ่งอำนวยความสะดวก (อังกฤษ)"
                          : "Amenities (English)"}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          disabled={submitting} 
                          rows={2} 
                          placeholder="e.g. WiFi, Projector, Whiteboard, Work chairs"
                          className="bg-white text-foreground" 
                        />
                      </FormControl>
                      <p className="text-xs text-foreground/70 mt-1">
                        {language === "th" ? "แยกด้วยจุลภาค" : "Separate with commas"}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Existing Images */}
                {selectedRoom && selectedRoom.images && selectedRoom.images.length > 0 && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                    <FormLabel className="text-base font-semibold text-primary">
                      {language === "th" ? "รูปภาพปัจจุบัน" : "Current Images"}
                      <span className="text-xs font-normal text-foreground/70 ml-2">
                        ({selectedRoom.images.length})
                      </span>
                    </FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedRoom.images.map((image, idx) => (
                        <div key={image.id} className="group relative aspect-square rounded-lg bg-background border border-border">
                          <img
                            src={image.image_url}
                            alt="Room"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center text-xs font-bold z-10">
                            {idx + 1}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteImage(image);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Upload Zone */}
                <div className="space-y-2">
                  <FormLabel className="text-base text-primary">
                    {language === "th" ? "อัพโหลดรูปภาพ" : "Upload Images"}
                  </FormLabel>
                  <ImageUploadZone
                    onFilesSelected={handleImageSelect}
                    previews={imagePreviews}
                    onRemovePreview={removeImagePreview}
                    disabled={submitting || uploadingImages}
                    maxImages={10}
                    language={language}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-muted-foreground/40 hover:bg-muted/50 hover:text-foreground font-semibold"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    disabled={submitting || uploadingImages}
                  >
                    {language === "th" ? "ยกเลิก" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={submitting || uploadingImages}>
                    {submitting || uploadingImages ? (
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

      {/* Room Statistics */}
      {rooms.length > 0 && (
        <RoomStats 
          stats={calculateRoomStats(rooms)} 
          language={language}
        />
      )}

      {/* Rooms List */}
      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-16 h-16 text-foreground/30 mb-4" />
            <p className="text-foreground/70">
              {language === "th"
                ? "ยังไม่มีห้องพัก กดปุ่มเพิ่มห้องพักเพื่อเริ่มต้น"
                : "No rooms yet. Click Add Room to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Image Container */}
              <div className="relative h-48 bg-muted overflow-hidden">
                {room.images && room.images.length > 0 ? (
                  <>
                    <img
                      src={room.images[0].image_url}
                      alt={room.name_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {room.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                        {room.images.length} {language === "th" ? "รูป" : "photos"}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <ImageIcon className="w-12 h-12 text-foreground/20" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">
                      {language === "th" ? room.name_th : room.name_en}
                    </CardTitle>
                    <div className="text-sm font-semibold text-primary mt-2">
                      ฿{room.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(room)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setRoomToDelete(room)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {(room.description_th || room.description_en) && (
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground/70 line-clamp-2">
                    {language === "th"
                      ? room.description_th
                      : room.description_en}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete Room Confirmation */}
      <AlertDialog open={!!roomToDelete} onOpenChange={() => setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "th" ? "ยืนยันการลบ" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "th"
                ? `คุณต้องการลบห้อง "${roomToDelete?.name_th}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
                : `Are you sure you want to delete room "${roomToDelete?.name_en}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image deletion is now handled directly without confirmation dialog */}
    </div>
  );
};
