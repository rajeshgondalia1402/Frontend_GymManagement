import { BACKEND_BASE_URL } from '@/services/api';

/**
 * Get the full URL for an image
 *
 * This utility handles both:
 * - R2 URLs (full URLs starting with http/https)
 * - Legacy local paths (e.g., /uploads/member-photos/xxx.jpg)
 *
 * @param imagePath - The image path or URL from the database
 * @returns The full URL for the image, or empty string if no path
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '';
  }

  // If already a full URL (R2 or other CDN), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a data URL (from camera capture preview), return as-is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Legacy local path - prepend backend URL
  return `${BACKEND_BASE_URL}${imagePath}`;
};

/**
 * Check if the image path is a local legacy path
 */
export const isLocalPath = (imagePath: string | null | undefined): boolean => {
  if (!imagePath) return false;
  return imagePath.startsWith('/uploads/');
};

/**
 * Check if the image path is an R2/CDN URL
 */
export const isR2Url = (imagePath: string | null | undefined): boolean => {
  if (!imagePath) return false;
  return imagePath.startsWith('http://') || imagePath.startsWith('https://');
};

/**
 * Get placeholder image URL
 */
export const getPlaceholderImage = (): string => {
  return '/placeholder-user.png';
};

export default {
  getImageUrl,
  isLocalPath,
  isR2Url,
  getPlaceholderImage,
};
