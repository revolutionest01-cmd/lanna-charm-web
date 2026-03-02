import { useState, useRef, useEffect } from "react";
import { X, Heart, Share2, Upload, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useModalState } from "@/contexts/ModalContext";
import { Portal } from "@/components/ui/portal";

interface Menu {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  icon_url: string | null;
  is_recommended: boolean;
  is_active: boolean;
}

interface MenuDetailModalProps {
  menu: Menu | null;
  isOpen: boolean;
  onClose: () => void;
  allMenus?: Menu[];
  onMenuChange?: (menu: Menu) => void;
}

const MenuDetailModal = ({ menu, isOpen, onClose, allMenus = [], onMenuChange }: MenuDetailModalProps) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useAuth();
  const { setIsModalOpen } = useModalState();
  const [isLiked, setIsLiked] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageContainerSize, setImageContainerSize] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusPoint, setFocusPoint] = useState({ x: 50, y: 50 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const maxImages = 5;
  const minSwipeDistance = 50;
  const minZoom = 1;
  const maxZoom = 3;
  const zoomStep = 0.25;

  // Get current menu index
  const currentMenuIndex = menu ? allMenus.findIndex(m => m.id === menu.id) : -1;
  const hasNextMenu = currentMenuIndex < allMenus.length - 1;
  const hasPrevMenu = currentMenuIndex > 0;

  const handlePrevMenu = () => {
    if (hasPrevMenu && allMenus[currentMenuIndex - 1] && onMenuChange) {
      onMenuChange(allMenus[currentMenuIndex - 1]);
    }
  };

  const handleNextMenu = () => {
    if (hasNextMenu && allMenus[currentMenuIndex + 1] && onMenuChange) {
      onMenuChange(allMenus[currentMenuIndex + 1]);
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
      handleNextMenu();
    } else if (isRightSwipe) {
      handlePrevMenu();
    }
  };

  // Update Modal state when isOpen changes
  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen, setIsModalOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevMenu();
      } else if (e.key === 'ArrowRight') {
        handleNextMenu();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentMenuIndex, allMenus, onMenuChange]);

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

  useEffect(() => {
    if (!isOpen) return;
    if (!imageContainerRef.current) return;

    const updateContainerSize = () => {
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      setImageContainerSize({ width: rect.width, height: rect.height });
    };

    updateContainerSize();

    const observer = new ResizeObserver(() => updateContainerSize());
    observer.observe(imageContainerRef.current);
    window.addEventListener("resize", updateContainerSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateContainerSize);
    };
  }, [isOpen, menu?.id]);

  useEffect(() => {
    setZoomLevel(1);
    setFocusPoint({ x: 50, y: 50 });
  }, [menu?.id]);

  if (!isOpen || !menu) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesToUpload = Array.from(files).slice(0, maxImages - uploadedImages.length);
    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${menu.id}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("menus")
          .upload(fileName, file);

        if (error) {
          console.error("Upload error:", error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("menus")
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
    const menuName = language === "th" ? menu.name_th : menu.name_en;
    const shareText = `${menuName} - ฿${menu.price}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: menuName,
        text: shareText,
        url: shareUrl,
      }).catch((err) => console.log("Share cancelled:", err));
    } else {
      const encodedText = encodeURIComponent(shareText);
      const encodedUrl = encodeURIComponent(shareUrl);

      const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        line: `https://line.me/R/msg/text/${encodedText}%20${encodedUrl}`,
      };

      const platform = window.innerWidth < 640 ? "whatsapp" : "facebook";
      window.open(shareLinks[platform as keyof typeof shareLinks], "_blank");
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const menuName = language === "th" ? menu.name_th : menu.name_en;
  const menuDescription = language === "th" ? menu.description_th : menu.description_en;
  const allImages = [
    ...(menu.image_url ? [{ url: menu.image_url, isOriginal: true }] : []),
    ...uploadedImages.map(url => ({ url, isOriginal: false }))
  ];

  const mainImageUrl = allImages.length > 0 ? allImages[0].url : menu.icon_url || "/placeholder.svg";

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const getViewportRect = () => {
    const naturalWidth = imageNaturalSize.width;
    const naturalHeight = imageNaturalSize.height;
    const containerWidth = imageContainerSize.width;
    const containerHeight = imageContainerSize.height;

    if (!naturalWidth || !naturalHeight || !containerWidth || !containerHeight) {
      return { left: 0, top: 0, width: 100, height: 100 };
    }

    const visibleWidth = naturalWidth / zoomLevel;
    const visibleHeight = naturalHeight / zoomLevel;

    const desiredCenterX = (focusPoint.x / 100) * naturalWidth;
    const desiredCenterY = (focusPoint.y / 100) * naturalHeight;

    const clampedCenterX = clamp(desiredCenterX, visibleWidth / 2, naturalWidth - visibleWidth / 2);
    const clampedCenterY = clamp(desiredCenterY, visibleHeight / 2, naturalHeight - visibleHeight / 2);

    const viewportLeft = clampedCenterX - visibleWidth / 2;
    const viewportTop = clampedCenterY - visibleHeight / 2;

    return {
      left: (viewportLeft / naturalWidth) * 100,
      top: (viewportTop / naturalHeight) * 100,
      width: (visibleWidth / naturalWidth) * 100,
      height: (visibleHeight / naturalHeight) * 100,
    };
  };

  const viewportRect = getViewportRect();
  const viewportIndicatorStyle = {
    left: `${viewportRect.left}%`,
    top: `${viewportRect.top}%`,
    width: `${viewportRect.width}%`,
    height: `${viewportRect.height}%`,
  };

  const handleZoomIn = () => setZoomLevel((prev) => clamp(prev + zoomStep, minZoom, maxZoom));
  const handleZoomOut = () => setZoomLevel((prev) => clamp(prev - zoomStep, minZoom, maxZoom));
  const handleResetView = () => {
    setZoomLevel(1);
    setFocusPoint({ x: 50, y: 50 });
  };

  const handleMainImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoomLevel((prev) => {
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      return clamp(prev + delta, minZoom, maxZoom);
    });
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!miniMapRef.current) return;

    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const clickY = clamp((e.clientY - rect.top) / rect.height, 0, 1);

    setFocusPoint({ x: clickX * 100, y: clickY * 100 });
  };

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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        <div
          className="relative bg-background rounded-2xl shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Action Buttons */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-50 flex items-center gap-1 sm:gap-2">
            {/* Like Button */}
            <button
              onClick={toggleLike}
              className="p-1.5 sm:p-2 rounded-full bg-white hover:bg-white/90 transition-all"
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
              className="p-1.5 sm:p-2 rounded-full bg-white hover:bg-white/90 transition-colors"
              aria-label="Share menu"
            >
              <Share2 size={20} className="text-foreground" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full bg-white hover:bg-white/90 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} className="text-foreground" />
            </button>
          </div>

          {/* Content Container */}
          <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6">
            {/* Image Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Main Image */}
              {allImages.length > 0 || menu.icon_url ? (
                <div
                  ref={imageContainerRef}
                  className="relative bg-foreground/5 rounded-lg overflow-hidden aspect-square sm:h-64 md:h-72"
                  onWheel={handleMainImageWheel}
                >
                  <img
                    src={mainImageUrl}
                    alt={menuName}
                    className="w-full h-full object-contain transition-transform duration-200 ease-out select-none"
                    style={{
                      objectPosition: `${focusPoint.x}% ${focusPoint.y}%`,
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "center center",
                    }}
                    onLoad={(e) => {
                      setImageNaturalSize({
                        width: e.currentTarget.naturalWidth,
                        height: e.currentTarget.naturalHeight,
                      });
                    }}
                  />

                  <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-md border border-white/60 bg-black/45 p-1.5 backdrop-blur-[1px]">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= minZoom}
                      className="h-7 w-7 rounded bg-white/90 text-foreground flex items-center justify-center hover:bg-white disabled:opacity-50"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-semibold text-white min-w-[42px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= maxZoom}
                      className="h-7 w-7 rounded bg-white/90 text-foreground flex items-center justify-center hover:bg-white disabled:opacity-50"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetView}
                      className="h-7 w-7 rounded bg-white/90 text-foreground flex items-center justify-center hover:bg-white"
                      aria-label="Reset view"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-2 right-2 z-10 rounded-md border border-white/60 bg-black/45 backdrop-blur-[1px] p-1.5">
                    <div
                      ref={miniMapRef}
                      className="relative w-20 h-14 rounded-sm overflow-hidden border border-white/50 bg-black/40 cursor-crosshair"
                      onClick={handleMinimapClick}
                      title={language === "th" ? "คลิกเพื่อเลื่อนตำแหน่งภาพ" : "Click to move viewport"}
                    >
                      <img
                        src={mainImageUrl}
                        alt="Image area map"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                      <div
                        className="absolute border border-white bg-white/20 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                        style={viewportIndicatorStyle}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative bg-foreground/5 rounded-lg overflow-hidden aspect-square sm:h-64 md:h-72 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    {language === 'th' ? 'ไม่มีรูปภาพ' : language === 'zh' ? '无图片' : 'No image'}
                  </p>
                </div>
              )}

              {/* Uploaded Images - Admin Only */}
              {isAdmin && uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2">
                    {language === 'th' ? 'ภาพที่อัพโหลด' : language === 'zh' ? '上传的图片' : 'Uploaded Images'}
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((imgUrl, index) => (
                      <button
                        key={imgUrl}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all"
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
                <div 
                  className="border-2 border-dashed border-primary/40 rounded-lg p-3 text-center hover:border-primary/60 transition-colors cursor-pointer"
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
                  <div className="flex flex-col items-center gap-1">
                    {isUploading ? (
                      <>
                        <Loader2 size={18} className="text-primary animate-spin" />
                        <p className="text-xs text-muted-foreground">
                          {language === 'th' ? 'กำลังอัพโหลด...' : language === 'zh' ? '上传中...' : 'Uploading...'}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="text-primary" />
                        <p className="text-xs font-medium text-foreground">
                          {language === 'th' ? `อัพโหลดภาพ (${maxImages - uploadedImages.length} เหลือ)` :
                           language === 'zh' ? `上传图片 (还可 ${maxImages - uploadedImages.length} 张)` :
                           `Upload (${maxImages - uploadedImages.length} left)`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {language === 'th' ? 'คลิกหรือลากไฟล์' : language === 'zh' ? '点击或拖拽' : 'Click or drag'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Menu Name & Price */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground mb-1.5">
                  {menuName}
                </h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    ฿{menu.price}
                  </span>
                </div>
              </div>

              {/* Description */}
              {menuDescription && (
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {menuDescription}
                  </p>
                </div>
              )}

              {/* Recommended Badge */}
              {menu.is_recommended && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-2.5 sm:p-3 text-center">
                  <p className="font-semibold text-primary text-xs sm:text-sm">
                    ⭐ {language === 'th' ? 'เมนูแนะนำของเรา' : language === 'zh' ? '我们推荐' : 'Our Recommendation'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-primary/20">
                {/* Menu Navigation - Horizontal Layout */}
                {allMenus.length > 1 && (
                  <div className="flex items-center justify-between gap-3 px-2 py-3 bg-primary/5 rounded-lg border border-primary/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevMenu();
                      }}
                      disabled={!hasPrevMenu}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-sm",
                        hasPrevMenu
                          ? "hover:bg-primary/20 cursor-pointer text-foreground"
                          : "opacity-40 cursor-not-allowed text-muted-foreground"
                      )}
                      aria-label="Previous menu"
                    >
                      <ChevronLeft size={18} />
                      <span className="hidden sm:inline">
                        {language === 'th' ? 'เมนูก่อนหน้า' : 'Previous'}
                      </span>
                    </button>

                    <div className="flex-shrink-0 px-2 py-1 rounded-full bg-primary/10 text-center min-w-[60px]">
                      <span className="font-semibold text-sm text-foreground">
                        {currentMenuIndex + 1} / {allMenus.length}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextMenu();
                      }}
                      disabled={!hasNextMenu}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-sm justify-end",
                        hasNextMenu
                          ? "hover:bg-primary/20 cursor-pointer text-foreground"
                          : "opacity-40 cursor-not-allowed text-muted-foreground"
                      )}
                      aria-label="Next menu"
                    >
                      <span className="hidden sm:inline">
                        {language === 'th' ? 'เมนูถัดไป' : 'Next'}
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                <Button
                  onClick={onClose}
                  className="w-full font-semibold h-10 rounded-lg text-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  {language === 'th' ? 'ปิด' : language === 'zh' ? '关闭' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </>
    </Portal>
  );
};

export default MenuDetailModal;
