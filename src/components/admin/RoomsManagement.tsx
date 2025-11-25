import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
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

const roomFormSchema = z.object({
  name_th: z.string().min(1, "กรุณากรอกชื่อภาษาไทย"),
  name_en: z.string().min(1, "Please enter English name"),
  description_th: z.string().optional(),
  description_en: z.string().optional(),
  price: z.string().min(1, "กรุณากรอกราคา"),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface Room {
  id: string;
  name_th: string;
  name_en: string;
  description_th?: string;
  description_en?: string;
  price: number;
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
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [imageToDelete, setImageToDelete] = useState<RoomImage | null>(null);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name_th: "",
      name_en: "",
      description_th: "",
      description_en: "",
      price: "",
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(
          language === "th"
            ? `${file.name} ไม่ใช่ไฟล์รูปภาพ`
            : `${file.name} is not an image file`
        );
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          language === "th"
            ? `${file.name} มีขนาดเกิน 5MB`
            : `${file.name} exceeds 5MB`
        );
        return false;
      }
      return true;
    });

    setImageFiles((prev) => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach((file) => {
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

  const uploadImages = async (roomId: string): Promise<boolean> => {
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

        // Save to database
        const { error: dbError } = await supabase
          .from("room_images")
          .insert([{
            room_id: roomId,
            image_url: publicUrl,
            sort_order: i,
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
      setLoading(true);

      // Delete from storage
      const fileName = image.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("rooms").remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from("room_images")
        .delete()
        .eq("id", image.id);

      if (error) throw error;

      toast.success(
        language === "th" ? "ลบรูปภาพสำเร็จ" : "Image deleted successfully"
      );
      
      setImageToDelete(null);
      loadRooms();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(
        language === "th" ? "ไม่สามารถลบรูปภาพได้" : "Failed to delete image"
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: RoomFormValues) => {
    try {
      setLoading(true);

      const roomData = {
        name_th: values.name_th,
        name_en: values.name_en,
        description_th: values.description_th || null,
        description_en: values.description_en || null,
        price: parseFloat(values.price),
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
        await uploadImages(selectedRoom.id);

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
        if (newRoom) {
          await uploadImages(newRoom.id);
        }

        toast.success(
          language === "th" ? "เพิ่มห้องพักสำเร็จ" : "Room added successfully"
        );
      }

      setIsDialogOpen(false);
      resetForm();
      loadRooms();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error(
        language === "th" ? "ไม่สามารถบันทึกได้" : "Failed to save"
      );
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {language === "th" ? "จัดการห้องพัก" : "Manage Rooms"}
          </h3>
          <p className="text-sm text-muted-foreground">
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
              <DialogTitle>
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
                        <FormLabel>
                          {language === "th" ? "ชื่อห้อง (ไทย)" : "Room Name (Thai)"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={loading} />
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
                        <FormLabel>
                          {language === "th" ? "ชื่อห้อง (อังกฤษ)" : "Room Name (English)"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} disabled={loading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "th" ? "ราคา (บาท)" : "Price (THB)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description_th"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "th" ? "รายละเอียด (ไทย)" : "Description (Thai)"}
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={loading} rows={3} />
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
                        <Textarea {...field} disabled={loading} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Existing Images */}
                {selectedRoom && selectedRoom.images && selectedRoom.images.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel>
                      {language === "th" ? "รูปภาพปัจจุบัน" : "Current Images"}
                    </FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedRoom.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.image_url}
                            alt="Room"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setImageToDelete(image)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Upload */}
                <div className="space-y-2">
                  <FormLabel>
                    {language === "th" ? "เพิ่มรูปภาพ" : "Add Images"}
                  </FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    disabled={loading || uploadingImages}
                  />
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImagePreview(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    disabled={loading || uploadingImages}
                  >
                    {language === "th" ? "ยกเลิก" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={loading || uploadingImages}>
                    {loading || uploadingImages ? (
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

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === "th"
                ? "ยังไม่มีห้องพัก กดปุ่มเพิ่มห้องพักเพื่อเริ่มต้น"
                : "No rooms yet. Click Add Room to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="overflow-hidden">
              {room.images && room.images.length > 0 && (
                <img
                  src={room.images[0].image_url}
                  alt={room.name_en}
                  className="w-full h-48 object-cover"
                />
              )}
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div>
                    <div className="text-lg">
                      {language === "th" ? room.name_th : room.name_en}
                    </div>
                    <div className="text-sm font-normal text-primary mt-1">
                      ฿{room.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(room)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setRoomToDelete(room)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {(room.description_th || room.description_en) && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {language === "th"
                      ? room.description_th
                      : room.description_en}
                  </p>
                  {room.images && room.images.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {room.images.length}{" "}
                      {language === "th" ? "รูปภาพ" : "images"}
                    </p>
                  )}
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
              onClick={() => imageToDelete && handleDeleteImage(imageToDelete)}
            >
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
