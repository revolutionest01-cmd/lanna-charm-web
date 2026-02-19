import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Wifi, Heart, Share2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import BookingDialog from "./BookingDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxImages = 5;

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data && !error);
    };
    checkAdminStatus();
  }, [user]);

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
      >
        <div
          className="relative bg-background rounded-xl sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-4xl md:max-w-5xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Action Buttons */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-50 flex items-center gap-1 sm:gap-2">
            {/* Like Button */}
            <button
              onClick={toggleLike}
              className="p-1.5 sm:p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-all"
              aria-label="Toggle like"
            >
              <Heart
                size={20}
                className={cn("transition-colors", isLiked ? "fill-primary text-primary" : "text-foreground")}
              />
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-1.5 sm:p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
              aria-label="Share room"
            >
              <Share2 size={20} className="text-foreground" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} className="text-foreground" />
            </button>
          </div>

          {/* Content Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
            {/* Image Gallery Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Main Image */}
              <div className="relative bg-foreground/5 rounded-lg sm:rounded-xl overflow-hidden aspect-square lg:h-80">
                <img
                  src={currentImage?.image_url || "/placeholder.svg"}
                  alt={roomName}
                  className="w-full h-full object-cover"
                />

                {/* Navigation Buttons - Only show if multiple images */}
                {totalImages > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight size={24} />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 text-white text-sm font-medium">
                      {currentImageIndex + 1} / {totalImages}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                        currentImageIndex === index
                          ? "border-primary shadow-md"
                          : "border-primary/20 hover:border-primary/40"
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
              )}

              {/* Uploaded Images Grid - Admin Only */}
              {isAdmin && uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    {language === 'th' ? 'ภาพที่อัพโหลด' : language === 'zh' ? '上传的图片' : 'Uploaded Images'}
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {uploadedImages.map((imgUrl, index) => (
                      <button
                        key={imgUrl}
                        onClick={() => setCurrentImageIndex(images.length + index)}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          currentImageIndex === images.length + index
                            ? "border-primary shadow-md"
                            : "border-primary/20 hover:border-primary/40"
                        )}
                      >
                        <img
                          src={imgUrl}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload Section - Admin Only */}
              {isAdmin && uploadedImages.length < maxImages && (
                <div className="border-2 border-dashed border-primary/40 rounded-lg p-3 sm:p-4 text-center hover:border-primary/60 transition-colors cursor-pointer"
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
                  <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                    {isUploading ? (
                      <>
                        <Loader2 size={20} className="text-primary animate-spin" />
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {language === 'th' ? 'กำลังอัพโหลด...' : language === 'zh' ? '上传中...' : 'Uploading...'}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-primary" />
                        <p className="text-xs sm:text-sm font-medium text-foreground">
                          {language === 'th' ? `อัพโหลดภาพเพิ่ม (${maxImages - uploadedImages.length} ภาพเหลือ)` : 
                           language === 'zh' ? `上传更多图片 (还可上传 ${maxImages - uploadedImages.length} 张)` :
                           `Upload more images (${maxImages - uploadedImages.length} remaining)`}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {language === 'th' ? 'คลิกหรือลากไฟล์มาวาง' : language === 'zh' ? '点击或拖拽文件' : 'Click or drag files'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Room Name & Price */}
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-foreground mb-2 sm:mb-3">
                  {roomName}
                </h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-primary">
                    ฿{room.price}
                  </span>
                  <span className="text-muted-foreground text-lg">
                    {t.perNight}
                  </span>
                </div>
              </div>

              {/* Description */}
              {roomDescription && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    {language === 'th' ? 'รายละเอียด' : language === 'zh' ? '描述' : 'Description'}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {roomDescription}
                  </p>
                </div>
              )}

              {/* Amenities */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
                  {language === 'th' ? 'สิ่งอำนวยความสะดวก' : language === 'zh' ? '便利设施' : 'Amenities'}
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground text-sm sm:text-base">
                    <Wifi size={16} className="text-primary flex-shrink-0" />
                    <span>
                      {language === 'th'
                        ? 'WiFi ฟรี'
                        : language === 'zh'
                        ? '免费WiFi'
                        : 'Free WiFi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-primary/20">
                <BookingDialog>
                  <Button
                    variant="highlight"
                    className="w-full font-bold h-12 text-base rounded-xl"
                  >
                    {t.bookRoom}
                  </Button>
                </BookingDialog>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full font-semibold h-11 rounded-xl"
                >
                  {language === 'th' ? 'ปิด' : language === 'zh' ? '关闭' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomDetailModal;
