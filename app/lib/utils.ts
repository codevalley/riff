import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a SEO-friendly share slug from a deck title
 * Format: slugified-title-xxxx (e.g., "politics-behind-the-font-a3f2")
 */
export function generateShareSlug(title: string): string {
  // Slugify the title
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special chars (including emojis)
    .replace(/\s+/g, '-')       // Spaces to hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .substring(0, 50)           // Limit length
    .replace(/^-|-$/g, '');     // Trim leading/trailing hyphens

  // Append short unique ID for uniqueness
  const shortId = nanoid(4).toLowerCase();

  // Handle edge case where slug is empty (title was all emojis/special chars)
  if (!slug) {
    return shortId;
  }

  return `${slug}-${shortId}`;
}
