/**
 * Image optimization utilities
 * Handles image compression, resizing, and validation
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  format?: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * Validate image file before upload
 */
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  // Check if file is an image
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  return { valid: true };
};

/**
 * Optimize image before upload
 * Compresses and resizes images to improve performance
 */
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            // Create optimized file
            const optimizedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          format,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Generate cache-busting URL for image
 * Appends timestamp to prevent browser caching issues
 */
export const getCacheBustedUrl = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${timestamp}`;
};

/**
 * Batch optimize multiple images
 */
export const optimizeImages = async (
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<File[]> => {
  const promises = files.map((file) => optimizeImage(file, options));
  return Promise.all(promises);
};
