/**
 * Utilities for Professional Room Management
 */

export interface RoomFilters {
  search?: string;
  priceRange?: [number, number];
  capacity?: number;
  sortBy?: "name" | "price" | "recent";
}

/**
 * Format room details for display
 */
export const formatRoomDetails = (data: {
  name?: string;
  price?: number;
  capacity?: string;
  amenities?: string;
}) => {
  return {
    name: data.name || "N/A",
    price: data.price ? `฿${data.price.toLocaleString()}` : "N/A",
    capacity: data.capacity || "N/A",
    amenities: data.amenities
      ?.split(",")
      .map((a) => a.trim())
      .filter((a) => a) || [],
  };
};

/**
 * Validate room image count
 */
export const validateImageCount = (
  currentCount: number,
  newCount: number,
  maxImages: number = 10
): { valid: boolean; message?: string } => {
  const totalImages = currentCount + newCount;

  if (totalImages > maxImages) {
    return {
      valid: false,
      message: `ไม่สามารถเพิ่มรูปได้ เกินจำนวน ${maxImages} ภาพ (ปัจจุบัน: ${currentCount})`,
    };
  }

  return { valid: true };
};

/**
 * Generate room image upload path
 */
export const generateRoomImagePath = (
  roomId: string,
  index: number,
  originalFilename: string
): string => {
  const fileExt = originalFilename.split(".").pop();
  return `room-${roomId}-${Date.now()}-${index}.${fileExt}`;
};

/**
 * Check if file is a valid image
 */
export const isValidImageFile = (
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!file.type.startsWith("image/")) {
    errors.push(`${file.name} ไม่ใช่ไฟล์รูปภาพ`);
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    errors.push(`${file.name} มีขนาดเกิน ${maxSizeMB}MB`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sort rooms by criteria
 */
export const sortRooms = (
  rooms: any[],
  sortBy: "name" | "price" | "recent" = "name"
): any[] => {
  const sorted = [...rooms];

  switch (sortBy) {
    case "price":
      return sorted.sort((a, b) => a.price - b.price);
    case "recent":
      return sorted.reverse();
    case "name":
    default:
      return sorted.sort((a, b) => a.name_th.localeCompare(b.name_th));
  }
};

/**
 * Filter rooms by search term
 */
export const filterRooms = (
  rooms: any[],
  searchTerm: string,
  language: string = "th"
): any[] => {
  if (!searchTerm) return rooms;

  const term = searchTerm.toLowerCase();
  return rooms.filter((room) => {
    const nameField = language === "th" ? room.name_th : room.name_en;
    const descField =
      language === "th" ? room.description_th : room.description_en;

    return (
      nameField?.toLowerCase().includes(term) ||
      descField?.toLowerCase().includes(term)
    );
  });
};

/**
 * Calculate room statistics
 */
export const calculateRoomStats = (rooms: any[]) => {
  if (rooms.length === 0) {
    return {
      totalRooms: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      totalImages: 0,
    };
  }

  const prices = rooms.map((r) => r.price);
  const totalImages = rooms.reduce((acc, r) => acc + (r.images?.length || 0), 0);

  return {
    totalRooms: rooms.length,
    averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    totalImages,
  };
};
