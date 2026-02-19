import { useState, useRef, useEffect } from "react";
import { X, Heart, Share2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
}

const MenuDetailModal = ({ menu, isOpen, onClose }: MenuDetailModalProps) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useAuth();
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div
          className="relative bg-background rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
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
              aria-label="Share menu"
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
            {/* Image Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Main Image */}
              {allImages.length > 0 || menu.icon_url ? (
                <div className="relative bg-foreground/5 rounded-lg sm:rounded-xl overflow-hidden aspect-square lg:h-80">
                  <img
                    src={allImages.length > 0 ? allImages[0].url : menu.icon_url || "/placeholder.svg"}
                    alt={menuName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative bg-foreground/5 rounded-lg sm:rounded-xl overflow-hidden aspect-square lg:h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {language === 'th' ? 'ไม่มีรูปภาพ' : language === 'zh' ? '无图片' : 'No image'}
                  </p>
                </div>
              )}

              {/* Uploaded Images - Admin Only */}
              {isAdmin && uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2">
                    {language === 'th' ? 'ภาพที่อัพโหลด' : language === 'zh' ? '上传的图片' : 'Uploaded Images'}
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
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
                  className="border-2 border-dashed border-primary/40 rounded-lg p-3 sm:p-4 text-center hover:border-primary/60 transition-colors cursor-pointer"
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
                          {language === 'th' ? `อัพโหลดภาพ (${maxImages - uploadedImages.length} ภาพเหลือ)` :
                           language === 'zh' ? `上传图片 (还可上传 ${maxImages - uploadedImages.length} 张)` :
                           `Upload images (${maxImages - uploadedImages.length} remaining)`}
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
              {/* Menu Name & Price */}
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-foreground mb-2 sm:mb-3">
                  {menuName}
                </h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                    ฿{menu.price}
                  </span>
                </div>
              </div>

              {/* Description */}
              {menuDescription && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    {language === 'th' ? 'รายละเอียด' : language === 'zh' ? '描述' : 'Description'}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {menuDescription}
                  </p>
                </div>
              )}

              {/* Recommended Badge */}
              {menu.is_recommended && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 sm:p-4 text-center">
                  <p className="font-semibold text-primary text-sm sm:text-base">
                    ⭐ {language === 'th' ? 'เมนูแนะนำของเรา' : language === 'zh' ? '我们推荐' : 'Our Recommendation'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-primary/20">
                <Button
                  variant="highlight"
                  className="w-full font-bold h-11 sm:h-12 text-sm sm:text-base rounded-xl"
                >
                  {language === 'th' ? 'เพิ่มไปยังตะกร้า' : language === 'zh' ? '加入购物车' : 'Add to Cart'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full font-semibold h-10 sm:h-11 rounded-xl text-sm sm:text-base"
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

export default MenuDetailModal;
