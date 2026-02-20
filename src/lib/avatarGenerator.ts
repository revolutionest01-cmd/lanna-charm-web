/**
 * Avatar Generator - Creates random avatar emojis for new admins
 */

export const AVATAR_OPTIONS = [
  "😊", "😄", "😎", "🤩", "😍", 
  "🥳", "😇", "🤓", "😌", "😏",
  "👨", "👩", "👴", "👵", "👦",
  "👧", "🧔", "👱", "🤵", "💼",
];

/**
 * Generate a random avatar emoji
 * @returns Random emoji string from AVATAR_OPTIONS
 */
export const generateRandomAvatar = (): string => {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  }
  
  // Client-side random
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
};

/**
 * Get a consistent avatar for a user ID
 * (same user always gets same avatar across sessions)
 * @param userId User ID to generate avatar for
 * @returns Consistent emoji string based on user ID
 */
export const getConsistentAvatar = (userId: string): string => {
  // Convert user ID to hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % AVATAR_OPTIONS.length;
  return AVATAR_OPTIONS[index];
};

/**
 * Generate random avatar URL (placeholder - returns emoji as base64)
 * For now returns the emoji, but can be extended for actual image generation
 * @returns Emoji or image data URL
 */
export const generateAvatarUrl = (userId: string): string => {
  const avatar = getConsistentAvatar(userId);
  return avatar; // Return emoji directly, backend can process it
};
