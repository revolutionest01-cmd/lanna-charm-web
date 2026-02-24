import { useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

interface ImageUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  previews: string[];
  onRemovePreview: (index: number) => void;
  disabled?: boolean;
  maxImages?: number;
  language?: string;
}

export const ImageUploadZone = ({
  onFilesSelected,
  previews,
  onRemovePreview,
  disabled = false,
  maxImages = 10,
  language = "th",
}: ImageUploadZoneProps) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(e.type === "dragenter" || e.type === "dragover");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    // Check total image count
    const totalImages = previews.length + files.length;
    if (totalImages > maxImages) {
      toast.error(
        language === "th"
          ? `จำนวนรูปภาพไม่เกิน ${maxImages} ภาพ (ปัจจุบัน: ${previews.length})`
          : `Maximum ${maxImages} images allowed (Current: ${previews.length})`
      );
      return;
    }

    const validFiles = files.filter((file) => {
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error(
          language === "th"
            ? `${file.name} ไม่ใช่ไฟล์รูปภาพ`
            : `${file.name} is not an image file`
        );
        return false;
      }

      // Check file size (max 5MB)
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

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      toast.success(
        language === "th"
          ? `เลือก ${validFiles.length} รูปภาพสำเร็จ`
          : `Selected ${validFiles.length} images`
      );
    }
  };

  const remainingSlots = maxImages - previews.length;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200",
          isDragActive && !disabled
            ? "border-primary bg-primary/5 shadow-lg scale-105"
            : "border-muted-foreground/30 bg-white",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={cn(
              "p-3 rounded-full transition-colors",
              isDragActive && !disabled
                ? "bg-primary/20"
                : "bg-muted/50"
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8 transition-colors",
                isDragActive && !disabled
                  ? "text-primary"
                  : "text-foreground/60"
              )}
            />
          </div>

          <div className="text-center">
            <p className="font-semibold text-foreground">
              {language === "th"
                ? "ลากรูปภาพมาวางที่นี่"
                : "Drag images here"}
            </p>
            <p className="text-sm text-foreground/70 mt-1">
              {language === "th"
                ? "หรือคลิกเพื่อเลือกไฟล์"
                : "or click to select files"}
            </p>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1 text-xs text-foreground/70 mt-2">
            <p>
              {language === "th"
                ? `สนับสนุน: JPG, PNG, GIF (ไม่เกิน 5MB ต่อไฟล์)`
                : `Supported: JPG, PNG, GIF (Max 5MB per file)`}
            </p>
            <p className="font-medium text-foreground/80">
              {language === "th"
                ? `ที่เหลือ: ${remainingSlots} จาก ${maxImages} ภาพ`
                : `Available: ${remainingSlots} of ${maxImages} images`}
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          disabled={disabled || remainingSlots === 0}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              {language === "th"
                ? `อัพโหลดรูปภาพ (${previews.length}/${maxImages})`
                : `Preview (${previews.length}/${maxImages})`}
            </h4>
            {previews.length > 1 && (
              <p className="text-xs text-foreground/70">
                {language === "th"
                  ? "ลากเพื่อจัดเรียง"
                  : "Drag to reorder"}
              </p>
            )}
          </div>

          {remainingSlots === 0 && (
            <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800 font-medium">
                {language === "th"
                  ? "ถึงจำนวนรูปภาพสูงสุด"
                  : "Maximum images reached"}
              </p>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border hover:border-primary transition-colors"
              >
                {/* Image */}
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Number Badge */}
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>

                {/* Delete Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemovePreview(index)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
