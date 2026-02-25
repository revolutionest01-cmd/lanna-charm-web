import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Wifi, Heart, Share2, Upload, Loader2, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import BookingDialog from "./BookingDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useModalState } from "@/contexts/ModalContext";
import { Portal } from "@/components/ui/portal";
import toast from "@/lib/toast";

interface RoomImage {
  id: string;
  room_id: string;
  image_url: string;
  sort_order: number | null;
}

interface Room {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  price: number;
  is_active: boolean | null;
  is_available?: boolean;
  amenities_th?: string | null;
  amenities_en?: string | null;
  capacity?: string | null;
  images: RoomImage[];
}

// Map amenity keywords to emoji icons
const getAmenityIcon = (amenity: string): string => {
  const lower = amenity.toLowerCase().trim();
  if (lower.includes('wifi') || lower.includes('ไวไฟ') || lower.includes('อินเทอร์เน็ต')) return '📶';
  if (lower.includes('แอร์') || lower.includes('air') || lower.includes('เครื่องปรับอากาศ')) return '❄️';
  if (lower.includes('เตียง') || lower.includes('bed')) return '🛏️';
  if (lower.includes('ห้องน้ำ') || lower.includes('bathroom') || lower.includes('shower') || lower.includes('สระน้ำ')) return '🚿';
  if (lower.includes('ทีวี') || lower.includes('tv') || lower.includes('โทรทัศน์')) return '📺';
  if (lower.includes('ตู้เย็น') || lower.includes('fridge') || lower.includes('refrigerator')) return '🧊';
  if (lower.includes('โปรเจคเตอร์') || lower.includes('projector')) return '📽️';
  if (lower.includes('กระดาน') || lower.includes('whiteboard') || lower.includes('board')) return '📋';
  if (lower.includes('ที่จอดรถ') || lower.includes('parking') || lower.includes('จอดรถ')) return '🅿️';
  if (lower.includes('อาหาร') || lower.includes('food') || lower.includes('breakfast') || lower.includes('อาหารเช้า')) return '🍳';
  if (lower.includes('เก้าอี้') || lower.includes('chair') || lower.includes('โซฟา') || lower.includes('sofa')) return '🪑';
  if (lower.includes('ผ้าเช็ดตัว') || lower.includes('towel')) return '🛁';
  if (lower.includes('กุญแจ') || lower.includes('key') || lower.includes('ล็อค') || lower.includes('lock')) return '🔑';
  if (lower.includes('พัดลม') || lower.includes('fan')) return '🌀';
  if (lower.includes('น้ำดื่ม') || lower.includes('water') || lower.includes('drinking')) return '💧';
  if (lower.includes('คาราโอเกะ') || lower.includes('karaoke')) return '🎤';
  if (lower.includes('ไมค์') || lower.includes('mic')) return '🎙️';
  if (lower.includes('ลำโพง') || lower.includes('speaker') || lower.includes('เสียง')) return '🔊';
  return '✨';
};

const parseAmenities = (amenitiesStr: string | null | undefined): string[] => {
  if (!amenitiesStr) return [];
  return amenitiesStr.split(/[,،、]/).map(a => a.trim()).filter(a => a.length > 0);
};

interface RoomDetailModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  allRooms?: Room[];
  onRoomChange?: (room: Room) => void;
}

const RoomDetailModal = ({ room, isOpen, onClose, allRooms = [], onRoomChange }: RoomDetailModalProps) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useAuth();
  const { setIsModalOpen } = useModalState();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxImages = 5;
  const minSwipeDistance = 50;

  // Get current room index
  const currentRoomIndex = room ? allRooms.findIndex(r => r.id === room.id) : -1;
  const hasNextRoom = currentRoomIndex < allRooms.length - 1;
  const hasPrevRoom = currentRoomIndex > 0;

  const handlePrevRoom = () => {
    if (hasPrevRoom && allRooms[currentRoomIndex - 1] && onRoomChange) {
      onRoomChange(allRooms[currentRoomIndex - 1]);
      setCurrentImageIndex(0);
    }
  };

  const handleNextRoom = () => {
    if (hasNextRoom && allRooms[currentRoomIndex + 1] && onRoomChange) {
      onRoomChange(allRooms[currentRoomIndex + 1]);
      setCurrentImageIndex(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextRoom();
    } else if (isRightSwipe) {
      handlePrevRoom();
    }
  };

  // Update Modal state when isOpen changes
  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen, setIsModalOpen]);

  // Reset uploaded images and image index when modal opens or room changes
  useEffect(() => {
    if (isOpen && room) {
      setUploadedImages([]);
      setCurrentImageIndex(0);
    }
  }, [isOpen, room?.id]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevRoom();
      } else if (e.key === 'ArrowRight') {
        handleNextRoom();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentRoomIndex, allRooms, onRoomChange]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('[RoomModal] No user, setting isAdmin to false');
        setIsAdmin(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        const isAdminUser = !!data && !error;
        setIsAdmin(isAdminUser);
        console.log('[RoomModal] Admin status check - user:', user.id, 'isAdmin:', isAdminUser, 'data:', data, 'error:', error);
      } catch (err) {
        console.error('[RoomModal] Error checking admin status:', err);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  // Load room availability status from prop
  useEffect(() => {
    if (room) {
      // Default to true if is_available field doesn't exist (before migration)
      const available = room.is_available !== null && room.is_available !== undefined 
        ? room.is_available 
        : true;
      setIsAvailable(available);
      console.log(`[RoomModal] Room ${room.id} availability loaded from prop:`, available, 'is_available field exists:', 'is_available' in room);
    }
  }, [room]);

  // Fetch fresh availability status from database when modal opens
  useEffect(() => {
    if (isOpen && room) {
      const fetchFreshAvailability = async () => {
        try {
          const { data, error } = await supabase
            .from('rooms')
            .select('is_available')
            .eq('id', room.id)
            .maybeSingle();
          
          if (error) {
            console.error('[RoomModal] Error fetching fresh availability:', error);
            return;
          }

          if (data) {
            const available = data.is_available !== null && data.is_available !== undefined 
              ? data.is_available 
              : true;
            setIsAvailable(available);
            console.log(`[RoomModal] Fresh availability loaded from DB for room ${room.id}:`, available);
          }
        } catch (err) {
          console.error('[RoomModal] Error fetching fresh availability:', err);
        }
      };

      fetchFreshAvailability();
    }
  }, [isOpen, room?.id]);

  // Toggle room availability
  const handleToggleAvailability = async () => {
    if (!isAdmin || !room) {
      console.warn('[RoomModal] Cannot toggle - isAdmin:', isAdmin, 'room exists:', !!room);
      return;
    }
    
    try {
      setIsTogglingAvailability(true);
      const newAvailabilityStatus = !isAvailable;
      
      console.log(`[RoomModal] Toggling room ${room.id} availability to: ${newAvailabilityStatus}`);
      console.log('[RoomModal] isAdmin:', isAdmin, 'isAvailable:', isAvailable);
      
      const { data, error } = await supabase
        .from('rooms')
        .update({ is_available: newAvailabilityStatus } as any)
        .eq('id', room.id)
        .select();
      
      if (error) {
        console.error('[RoomModal] Error updating availability - Error:', error);
        console.error('[RoomModal] Error details:', error.message, error.code, error.details);
        
        // Check if it's a column doesn't exist error
        if (error.message?.includes('column') || error.code === '42703') {
          console.error('[RoomModal] Column not found - migration not run yet');
        }
        return;
      }
      
      setIsAvailable(newAvailabilityStatus);
      console.log(`[RoomModal] Room availability updated successfully`, data);
    } catch (error) {
      console.error('[RoomModal] Toggle availability error:', error);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  if (!isOpen || !room) return null;

  const images = room.images && room.images.length > 0 ? room.images : [];

  const handlePrevImage = () => {
    const totalImages = images.length + uploadedImages.length;
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNextImage = () => {
    const totalImages = images.length + uploadedImages.length;
    setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Check authentication first
    if (!user) {
      const authMsg = language === 'th' 
        ? 'กรุณเข้าสู่ระบบเพื่ออัพโหลดรูป'
        : 'Please log in to upload images';
      toast.error(authMsg);
      return;
    }

    if (!isAdmin) {
      const adminMsg = language === 'th'
        ? 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอัพโหลดรูปได้'
        : 'Only admins can upload images';
      toast.error(adminMsg);
      return;
    }

    // Calculate total images (existing + uploaded) to respect maxImages limit
    const totalCurrentImages = images.length + uploadedImages.length;
    const filesToUpload = Array.from(files).slice(0, maxImages - totalCurrentImages);
    
    if (filesToUpload.length === 0) {
      const message = language === 'th' 
        ? `ถึงจำนวน ${maxImages} รูปสูงสุดแล้ว (มีอยู่ ${totalCurrentImages} รูป)`
        : `Maximum ${maxImages} images allowed. Current total: ${totalCurrentImages}`;
      toast.warning(message);
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      for (const file of filesToUpload) {
        try {
          // Validate file size (max 5MB)
          const maxFileSize = 5 * 1024 * 1024; // 5MB
          if (file.size > maxFileSize) {
            const sizeMsg = language === 'th'
              ? `ไฟล์ ${file.name} ใหญ่เกินไป (ต้อง < 5MB)`
              : `File ${file.name} is too large (max 5MB)`;
            console.warn(sizeMsg);
            failureCount++;
            continue;
          }

          const fileExt = file.name.split(".").pop()?.toLowerCase();
          if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
            const extMsg = language === 'th'
              ? `ไฟล์ ${file.name} ไม่ใช่รูปภาพ`
              : `File ${file.name} is not an image`;
            console.warn(extMsg);
            failureCount++;
            continue;
          }

          const fileName = `${room!.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          console.log("Uploading file:", fileName, "User:", user.id);

          const { data, error } = await supabase.storage
            .from("rooms")
            .upload(fileName, file);

          if (error) {
            console.error("Upload error:", error);
            const errorMsg = error.message || (language === 'th' ? 'ไม่สามารถอัพโหลดรูป' : 'Failed to upload image');
            console.error(`Failed to upload ${file.name}: ${errorMsg}`);
            failureCount++;
            continue;
          }

          if (!data) {
            console.error("No data returned from upload");
            failureCount++;
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("rooms")
            .getPublicUrl(fileName);

          if (urlData?.publicUrl) {
            setUploadedImages((prev) => [...prev, urlData.publicUrl]);
            successCount++;
            console.log("Image uploaded successfully:", urlData.publicUrl);
          } else {
            console.error("Could not get public URL for:", fileName);
            failureCount++;
          }
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          failureCount++;
        }
      }

      // Show result messages
      if (successCount > 0) {
        const successMsg = language === 'th'
          ? `อัพโหลดรูป ${successCount} รูปสำเร็จ`
          : `Successfully uploaded ${successCount} image(s)`;
        toast.success(successMsg);
      }

      if (failureCount > 0) {
        const failMsg = language === 'th'
          ? `ไม่สามารถอัพโหลด ${failureCount} รูป` 
          : `Failed to upload ${failureCount} image(s)`;
        toast.error(failMsg);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMsg = language === 'th'
        ? 'เกิดข้อผิดพลาดในการอัพโหลด'
        : 'Error uploading images';
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleShare = () => {
    const roomName = language === "th" ? room!.name_th : room!.name_en;
    const shareText = `${roomName} - ฿${room!.price} ${language === 'th' ? 'ต่อคืน' : language === 'zh' ? '每晚' : 'per night'}`;
    const shareUrl = window.location.href;

    // Web Share API fallback to social media links
    if (navigator.share) {
      navigator.share({
        title: roomName,
        text: shareText,
        url: shareUrl,
      }).catch((err) => console.log("Share cancelled:", err));
    } else {
      // Fallback: Show social media share options
      const encodedText = encodeURIComponent(shareText);
      const encodedUrl = encodeURIComponent(shareUrl);

      const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        line: `https://line.me/R/msg/text/${encodedText}%20${encodedUrl}`,
      };

      // Open a simple share menu (you can enhance this with a dropdown)
      const platform = window.innerWidth < 640 ? "whatsapp" : "facebook";
      window.open(shareLinks[platform as keyof typeof shareLinks], "_blank");
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const roomName = language === "th" ? room!.name_th : room!.name_en;
  const roomDescription = language === "th" ? room.description_th : room.description_en;

  // Combine all images (original + uploaded)
  const allImages = [...images, ...uploadedImages.map(url => ({ id: url, image_url: url, room_id: room!.id, sort_order: null }))];
  const currentImage = allImages.length > 0 ? allImages[currentImageIndex] : null;
  const totalImages = allImages.length;

  return (
    <Portal>
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />

        {/* Modal Container - Centered on viewport */}
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative bg-background rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl w-full max-h-[90vh] sm:max-h-[95vh] md:max-w-4xl lg:max-w-5xl overflow-hidden flex flex-col motion-safe:animate-in motion-safe:slide-in-from-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Fixed at top */}
          <button
            onClick={onClose}
            className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-50 p-1.5 sm:p-2 md:p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
            aria-label="Close modal"
          >
            <X size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-foreground group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            {/* Hero Image Gallery Section */}
            <div className="relative bg-gradient-to-br from-muted/50 to-muted/20 overflow-hidden group">
              {/* Main Image */}
              <div className="relative h-[180px] sm:h-[240px] md:h-[320px] lg:h-[420px] overflow-hidden bg-black">
                <img
                  src={currentImage?.image_url || "/placeholder.svg"}
                  alt={roomName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Navigation Buttons */}
                {totalImages > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 md:p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all hover:scale-110"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 md:p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all hover:scale-110"
                      aria-label="Next image"
                    >
                      <ChevronRight size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] sm:text-xs lg:text-sm font-semibold">
                      {currentImageIndex + 1} / {totalImages}
                    </div>
                  </>
                )}

                {/* Like & Share Buttons */}
                <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                  <button
                    onClick={toggleLike}
                    className="p-1 sm:p-1.5 md:p-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm transition-all hover:scale-110 group/like"
                    aria-label="Toggle like"
                  >
                    <Heart
                      size={16}
                      className={cn("sm:w-4 sm:h-4 md:w-5 md:h-5 transition-all", isLiked ? "fill-red-500 text-red-500 scale-110" : "text-foreground")}
                    />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-1 sm:p-1.5 md:p-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm transition-all hover:scale-110"
                    aria-label="Share room"
                  >
                    <Share2 size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {totalImages > 1 && (
                <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 bg-gradient-to-b from-black/20 to-transparent">
                  <div className="flex gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {allImages.map((image, index) => (
                      <button
                        key={`${image.id}-${index}`}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "relative aspect-square rounded-lg flex-shrink-0 overflow-hidden border-2 transition-all hover:scale-105",
                          currentImageIndex === index
                            ? "border-white shadow-lg w-14 sm:w-16 md:w-20 lg:w-24"
                            : "border-white/30 hover:border-white/60 w-12 sm:w-14 md:w-16 lg:w-20"
                        )}
                      >
                        <img
                          src={image.image_url}
                          alt={`${roomName} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-3 sm:p-4 md:p-5 lg:p-8">
              {/* Mobile Layout - Single Column */}
              <div className="lg:hidden space-y-4 sm:space-y-5 md:space-y-6">
                {/* Header */}
                <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-foreground">
                    {roomName}
                  </h1>
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                        ฿{room.price}
                      </div>
                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                        {t.perNight}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

                {/* Description */}
                {roomDescription && (
                  <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                    <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-foreground">
                      {language === 'th' ? 'เกี่ยวกับห้อง' : language === 'zh' ? '关于房间' : 'About Room'}
                    </h2>
                    <p className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {roomDescription}
                    </p>
                  </div>
                )}

                {/* Amenities - Dynamic from database */}
                {(() => {
                  const amenities = parseAmenities(language === 'th' ? room.amenities_th : room.amenities_en);
                  if (amenities.length === 0) return null;
                  return (
                    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                      <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-foreground">
                        {language === 'th' ? 'สิ่งอำนวยความสะดวก' : language === 'zh' ? '便利设施' : 'Amenities'}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
                        {amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-2.5 md:p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm sm:text-base md:text-lg">{getAmenityIcon(amenity)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[10px] sm:text-xs md:text-sm text-foreground">
                                {amenity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Upload Section - Mobile Admin */}
                {isAdmin && (
                  <div className="space-y-3 pt-3 border-t border-primary/20">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {language === 'th' ? 'จัดการรูปภาพ' : 'Manage Images'}
                    </h3>

                    {uploadedImages.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {language === 'th' ? 'ภาพที่อัพโหลด' : 'Uploaded'}
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {uploadedImages.map((imgUrl, index) => (
                            <div
                              key={imgUrl}
                              className={cn(
                                "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                currentImageIndex === images.length + index
                                  ? "border-primary shadow-md scale-105"
                                  : "border-primary/20 hover:border-primary/40"
                              )}
                              onClick={() => setCurrentImageIndex(images.length + index)}
                            >
                              <img
                                src={imgUrl}
                                alt={`Uploaded ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalImages < maxImages && (
                      <div className="border-2 border-dashed border-primary/40 rounded-lg p-3 text-center hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <div className="flex flex-col items-center gap-1.5">
                          {isUploading ? (
                            <>
                              <Loader2 size={20} className="text-primary animate-spin" />
                              <p className="text-xs text-muted-foreground">
                                {language === 'th' ? 'อัพโหลด...' : 'Uploading...'}
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload size={20} className="text-primary" />
                              <p className="text-xs font-semibold text-foreground">
                                {language === 'th' ? 'อัพโหลดภาพ' : 'Upload'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {`${maxImages - uploadedImages.length} ${language === 'th' ? 'ภาพเหลือ' : 'left'}`}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Info */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-2.5 md:space-y-3">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground">
                    {language === 'th' ? 'ราคา' : 'Price'}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      {language === 'th' ? 'ต่อคืน' : 'Per night'}
                    </span>
                    <span className="font-bold text-lg sm:text-xl md:text-2xl text-primary">฿{room.price}</span>
                  </div>
                  <div className="h-px bg-primary/20" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      {language === 'th' ? 'สถานะ' : 'Status'}
                    </span>
                    {isAdmin ? (
                      <button
                        onClick={() => handleToggleAvailability()}
                        disabled={isTogglingAvailability}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-300',
                          isAvailable
                            ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-600 hover:bg-red-500/30',
                          'disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95'
                        )}
                        title={language === 'th' ? 'กดเพื่อสลับสถานะ' : 'Click to toggle status'}
                      >
                        <span className={cn('w-2 h-2 rounded-full', isAvailable ? 'bg-green-600 animate-pulse' : 'bg-red-600')} />
                        {isTogglingAvailability ? (
                          <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isAvailable ? (
                          language === 'th' ? 'ว่าง' : 'Available'
                        ) : (
                          language === 'th' ? 'ไม่ว่าง' : 'Not Available'
                        )}
                      </button>
                    ) : (
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold',
                        isAvailable ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                      )}>
                        <span className={cn('w-2 h-2 rounded-full', isAvailable ? 'bg-green-600 animate-pulse' : 'bg-red-600')} />
                        {isAvailable ? (language === 'th' ? 'ว่าง' : 'Available') : (language === 'th' ? 'ไม่ว่าง' : 'Not Available')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Room Navigation - Horizontal Layout */}
                {allRooms.length > 1 && (
                  <div className="flex items-center justify-between gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 bg-primary/5 rounded-lg border border-primary/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevRoom();
                      }}
                      disabled={!hasPrevRoom}
                      className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all font-medium text-xs sm:text-sm",
                        hasPrevRoom
                          ? "hover:bg-primary/20 cursor-pointer text-foreground"
                          : "opacity-40 cursor-not-allowed text-muted-foreground"
                      )}
                      aria-label="Previous room"
                    >
                      <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">
                        {language === 'th' ? 'ห้องก่อนหน้า' : 'Previous'}
                      </span>
                    </button>

                    <div className="flex-shrink-0 px-2 py-1 rounded-full bg-primary/10 text-center min-w-[50px]">
                      <span className="font-semibold text-xs sm:text-sm text-foreground">
                        {currentRoomIndex + 1} / {allRooms.length}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextRoom();
                      }}
                      disabled={!hasNextRoom}
                      className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all font-medium text-xs sm:text-sm justify-end",
                        hasNextRoom
                          ? "hover:bg-primary/20 cursor-pointer text-foreground"
                          : "opacity-40 cursor-not-allowed text-muted-foreground"
                      )}
                      aria-label="Next room"
                    >
                      <span className="hidden sm:inline">
                        {language === 'th' ? 'ห้องถัดไป' : 'Next'}
                      </span>
                      <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}

                {/* Action Buttons - Mobile stacked */}
                <div className="flex flex-col gap-2 md:gap-3 pt-2 md:pt-4">
                  <BookingDialog roomId={room.id}>
                    <Button
                      className="w-full font-bold h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base rounded-lg transition-all hover:scale-105 bg-[#c65539] text-white hover:bg-[#c65539]/90"
                    >
                      {t.bookRoom}
                    </Button>
                  </BookingDialog>
                  <Button
                    onClick={onClose}
                    className="w-full font-semibold h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base rounded-lg transition-all bg-foreground text-background hover:bg-foreground/90"
                  >
                    {language === 'th' ? 'ปิด' : language === 'zh' ? '关闭' : 'Close'}
                  </Button>
                </div>
              </div>

              {/* Desktop Layout - 3 Columns */}
              <div className="hidden lg:grid grid-cols-3 gap-8">
                {/* Left Column - Main Info */}
                <div className="col-span-2 space-y-6">
                  {/* Header */}
                  <div className="space-y-3">
                    <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground">
                      {roomName}
                    </h1>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-4xl font-bold text-primary">
                          ฿{room.price}
                        </div>
                        <p className="text-muted-foreground">
                          {t.perNight}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

                  {/* Description */}
                  {roomDescription && (
                    <div className="space-y-3">
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        About the Room
                      </h2>
                      <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {roomDescription}
                      </p>
                    </div>
                  )}

                  {/* Amenities - Dynamic from database */}
                  {(() => {
                    const amenities = parseAmenities(language === 'th' ? room.amenities_th : room.amenities_en);
                    if (amenities.length === 0) return null;
                    return (
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                          <div className="w-1 h-6 bg-primary rounded-full" />
                          {language === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Amenities'}
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all">
                              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xl">{getAmenityIcon(amenity)}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{amenity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Upload Section - Desktop Admin */}
                  {isAdmin && (
                    <div className="space-y-4 pt-6 border-t border-primary/20">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        Manage Images
                      </h3>

                      {uploadedImages.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {language === 'th' ? 'ภาพที่อัพโหลด' : 'Uploaded Images'}
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {uploadedImages.map((imgUrl, index) => (
                              <div
                                key={imgUrl}
                                className={cn(
                                  "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                  currentImageIndex === images.length + index
                                    ? "border-primary shadow-md scale-105"
                                    : "border-primary/20 hover:border-primary/40"
                                )}
                                onClick={() => setCurrentImageIndex(images.length + index)}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Uploaded ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {totalImages < maxImages && (
                        <div className="border-2 border-dashed border-primary/40 rounded-xl p-6 text-center hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                          <div className="flex flex-col items-center gap-3">
                            {isUploading ? (
                              <>
                                <Loader2 size={24} className="text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground font-medium">
                                  Uploading...
                                </p>
                              </>
                            ) : (
                              <>
                                <Upload size={24} className="text-primary" />
                                <p className="text-base font-semibold text-foreground">
                                  Upload more images
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {`${maxImages - uploadedImages.length} remaining`}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column - Action Area */}
                <div className="col-span-1">
                  <div className="space-y-4 sticky top-6">
                    {/* Info Card */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Price & Booking
                      </h3>
                      <div className="space-y-3 text-base">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Per night:</span>
                          <span className="font-bold text-primary">฿{room.price}</span>
                        </div>
                        <div className="h-px bg-primary/20" />
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">
                            {language === 'th' ? 'สถานะ' : 'Status'}
                          </span>
                          {isAdmin ? (
                            <button
                              onClick={() => {
                                console.log('[RoomModal] Status button clicked! isAdmin:', isAdmin, 'room:', room?.id, 'isAvailable:', isAvailable);
                                handleToggleAvailability();
                              }}
                              disabled={isTogglingAvailability}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300',
                                isAvailable
                                  ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                                  : 'bg-red-500/20 text-red-600 hover:bg-red-500/30',
                                'disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95'
                              )}
                              title={language === 'th' ? 'กดเพื่อสลับสถานะ' : 'Click to toggle status'}
                            >
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  isAvailable ? 'bg-green-600 animate-pulse' : 'bg-red-600'
                                )}
                              />
                              {isTogglingAvailability ? (
                                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : isAvailable ? (
                                language === 'th' ? 'ว่าง' : 'Available'
                              ) : (
                                language === 'th' ? 'ไม่ว่าง' : 'Not Available'
                              )}
                            </button>
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                                isAvailable
                                  ? 'bg-green-500/20 text-green-600'
                                  : 'bg-red-500/20 text-red-600'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  isAvailable ? 'bg-green-600 animate-pulse' : 'bg-red-600'
                                )}
                              />
                              {isAvailable
                                ? language === 'th' ? 'ว่าง' : 'Available'
                                : language === 'th' ? 'ไม่ว่าง' : 'Not Available'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Room Navigation - Horizontal Layout */}
                    {allRooms.length > 1 && (
                      <div className="flex items-center justify-between gap-3 px-3 py-3 bg-primary/5 rounded-lg border border-primary/20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrevRoom();
                          }}
                          disabled={!hasPrevRoom}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-sm",
                            hasPrevRoom
                              ? "hover:bg-primary/20 cursor-pointer text-foreground"
                              : "opacity-40 cursor-not-allowed text-muted-foreground"
                          )}
                          aria-label="Previous room"
                        >
                          <ChevronLeft size={18} />
                          <span>{language === 'th' ? 'ก่อนหน้า' : 'Previous'}</span>
                        </button>

                        <div className="flex-shrink-0 px-2 py-1 rounded-full bg-primary/10 text-center min-w-[60px]">
                          <span className="font-semibold text-sm text-foreground">
                            {currentRoomIndex + 1} / {allRooms.length}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextRoom();
                          }}
                          disabled={!hasNextRoom}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-sm justify-end",
                            hasNextRoom
                              ? "hover:bg-primary/20 cursor-pointer text-foreground"
                              : "opacity-40 cursor-not-allowed text-muted-foreground"
                          )}
                          aria-label="Next room"
                        >
                          <span>{language === 'th' ? 'ถัดไป' : 'Next'}</span>
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <BookingDialog roomId={room.id}>
                        <Button
                          className="w-full font-bold h-12 text-base rounded-lg transition-all hover:scale-105 bg-[#c65539] text-white hover:bg-[#c65539]/90"
                        >
                          {t.bookRoom}
                        </Button>
                      </BookingDialog>
                      <Button
                        onClick={onClose}
                        className="w-full font-semibold h-11 rounded-lg transition-all bg-foreground text-background hover:bg-foreground/90"
                      >
                        {language === 'th' ? 'ปิด' : language === 'zh' ? '关闭' : 'Close'}
                      </Button>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        💡 Click book now to check availability
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </>
    </Portal>
  );
};

export default RoomDetailModal;
