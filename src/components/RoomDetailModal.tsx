import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Wifi, Heart, Share2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import BookingDialog from "./BookingDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useModalState } from "@/contexts/ModalContext";
import { Portal } from "@/components/ui/portal";

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
  is_available?: boolean; // Room availability status (for bookings)
  images: RoomImage[];
}

interface RoomDetailModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

const RoomDetailModal = ({ room, isOpen, onClose }: RoomDetailModalProps) => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxImages = 5;

  // Update Modal state when isOpen changes
  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen, setIsModalOpen]);

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

    const filesToUpload = Array.from(files).slice(0, maxImages - uploadedImages.length);
    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${room!.id}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("rooms")
          .upload(fileName, file);

        if (error) {
          console.error("Upload error:", error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("rooms")
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          setUploadedImages((prev) => [...prev, urlData.publicUrl]);
        }
      }
    } catch (error) {
      console.error("Error uploading images:", error);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div
            className="relative bg-background rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col motion-safe:animate-in motion-safe:slide-in-from-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Fixed at top */}
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 z-50 p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
            aria-label="Close modal"
          >
            <X size={20} className="sm:w-6 sm:h-6 text-foreground group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            {/* Hero Image Gallery Section */}
            <div className="relative bg-gradient-to-br from-muted/50 to-muted/20 overflow-hidden group">
              {/* Main Image */}
              <div className="relative h-[240px] sm:h-[300px] md:h-[380px] lg:h-[450px] overflow-hidden bg-black">
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
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all hover:scale-110"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} className="sm:w-7 sm:h-7" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all hover:scale-110"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} className="sm:w-7 sm:h-7" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-xs sm:text-sm font-semibold">
                      {currentImageIndex + 1} / {totalImages}
                    </div>
                  </>
                )}

                {/* Like & Share Buttons */}
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={toggleLike}
                    className="p-1.5 sm:p-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm transition-all hover:scale-110 group/like"
                    aria-label="Toggle like"
                  >
                    <Heart
                      size={18}
                      className={cn("sm:w-5 sm:h-5 transition-all", isLiked ? "fill-red-500 text-red-500 scale-110" : "text-foreground")}
                    />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-1.5 sm:p-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm transition-all hover:scale-110"
                    aria-label="Share room"
                  >
                    <Share2 size={18} className="sm:w-5 sm:h-5 text-foreground" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {totalImages > 1 && (
                <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-gradient-to-b from-black/20 to-transparent">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {allImages.map((image, index) => (
                      <button
                        key={`${image.id}-${index}`}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "relative aspect-square rounded-lg flex-shrink-0 overflow-hidden border-2 transition-all hover:scale-105",
                          currentImageIndex === index
                            ? "border-white shadow-lg w-16 sm:w-20 md:w-24"
                            : "border-white/30 hover:border-white/60 w-14 sm:w-16 md:w-20"
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
            <div className="p-4 sm:p-5 md:p-6 lg:p-8">
              {/* Mobile Layout - Single Column */}
              <div className="lg:hidden space-y-5 sm:space-y-6">
                {/* Header */}
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
                    {roomName}
                  </h1>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-primary">
                        ฿{room.price}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t.perNight}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

                {/* Description */}
                {roomDescription && (
                  <div className="space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground">
                      {language === 'th' ? 'เกี่ยวกับห้อง' : language === 'zh' ? '关于房间' : 'About Room'}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {roomDescription}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                <div className="space-y-3">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">
                    {language === 'th' ? 'สิ่งอำนวยความสะดวก' : language === 'zh' ? '便利设施' : 'Amenities'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Wifi size={18} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-foreground">
                          {language === 'th' ? 'WiFi ฟรี' : 'Free WiFi'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {language === 'th' ? 'ความเร็วสูง' : 'High-speed'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-base">🛏️</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-foreground">
                          {language === 'th' ? 'เตียง' : 'Bed'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {language === 'th' ? 'ควีน' : 'Queen'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-base">❄️</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-foreground">
                          {language === 'th' ? 'แอร์' : 'A/C'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {language === 'th' ? 'เย็นสบาย' : 'Cool'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-base">🚿</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-foreground">
                          {language === 'th' ? 'ห้องน้ำ' : 'Bathroom'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {language === 'th' ? 'ส่วนตัว' : 'Private'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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

                    {uploadedImages.length < maxImages && (
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
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {language === 'th' ? 'ราคา' : 'Price'}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      {language === 'th' ? 'ต่อคืน' : 'Per night'}
                    </span>
                    <span className="font-bold text-lg text-primary">฿{room.price}</span>
                  </div>
                  <div className="h-px bg-primary/20" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      {language === 'th' ? 'สถานะ' : 'Status'}
                    </span>
                    {isAdmin ? (
                      <button
                        onClick={() => handleToggleAvailability()}
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
                        <span className={cn('w-2 h-2 rounded-full', isAvailable ? 'bg-green-600 animate-pulse' : 'bg-red-600')} />
                        {isTogglingAvailability ? (
                          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isAvailable ? (
                          language === 'th' ? 'ว่าง' : 'Available'
                        ) : (
                          language === 'th' ? 'ไม่ว่าง' : 'Not Available'
                        )}
                      </button>
                    ) : (
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                        isAvailable ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                      )}>
                        <span className={cn('w-2 h-2 rounded-full', isAvailable ? 'bg-green-600 animate-pulse' : 'bg-red-600')} />
                        {isAvailable ? (language === 'th' ? 'ว่าง' : 'Available') : (language === 'th' ? 'ไม่ว่าง' : 'Not Available')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Mobile stacked */}
                <div className="flex flex-col gap-2 pt-2">
                  <BookingDialog roomId={room.id}>
                    <Button
                      className="w-full font-bold h-12 text-base rounded-lg transition-all hover:scale-105 bg-[#c65539] text-white hover:bg-[#c65539]/90"
                    >
                      {t.bookRoom}
                    </Button>
                  </BookingDialog>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full font-semibold h-11 rounded-lg transition-all"
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

                  {/* Amenities */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      Amenities
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Wifi size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Free WiFi</p>
                          <p className="text-xs text-muted-foreground">High-speed</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">🛏️</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Comfortable Bed</p>
                          <p className="text-xs text-muted-foreground">Queen size</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">❄️</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Air Conditioning</p>
                          <p className="text-xs text-muted-foreground">Temperature control</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">🚿</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Private Bathroom</p>
                          <p className="text-xs text-muted-foreground">Hot shower</p>
                        </div>
                      </div>
                    </div>
                  </div>

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

                      {uploadedImages.length < maxImages && (
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
                        variant="outline"
                        onClick={onClose}
                        className="w-full font-semibold h-11 rounded-lg transition-all"
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
