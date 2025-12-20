// ============================================
// Image Utilities - Server-side image handling for export
// Fetches blob URLs and converts to base64 for PDF/PPTX
// ============================================

import { ImageManifest, ImageManifestEntry, Slide } from '../types';

/**
 * Fetched image data ready for embedding
 */
export interface FetchedImage {
  description: string;
  data: string; // base64 encoded
  mimeType: string;
  width?: number;
  height?: number;
}

/**
 * Image cache to avoid re-fetching during export
 */
export type ImageCache = Map<string, FetchedImage>;

/**
 * Get the active image URL from a manifest entry
 */
function getActiveImageUrl(entry: ImageManifestEntry): string | null {
  const activeSlot = entry.active || 'generated';
  return entry[activeSlot] || entry.generated || entry.uploaded || entry.restyled || null;
}

/**
 * Fetch a single image and convert to base64
 * Only returns result if image is valid PNG or JPEG
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url, {
      // Set timeout to avoid hanging on bad URLs
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url} (${response.status})`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();

    // Validate we got actual image data
    if (arrayBuffer.byteLength < 100) {
      console.warn(`Image too small, likely invalid: ${url}`);
      return null;
    }

    // Check magic bytes to verify format
    const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;

    if (!isPng && !isJpeg) {
      console.warn(`Unsupported image format at ${url}, magic bytes:`, Array.from(bytes.slice(0, 4)));
      return null;
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = isPng ? 'image/png' : 'image/jpeg';

    return {
      data: base64,
      mimeType,
    };
  } catch (error) {
    console.warn(`Error fetching image: ${url}`, error);
    return null;
  }
}

/**
 * Fetch all images from slides and manifest
 * Returns a map of description -> base64 data
 */
export async function fetchAllImages(
  slides: Slide[],
  manifest: ImageManifest | undefined
): Promise<ImageCache> {
  const cache: ImageCache = new Map();
  const fetchPromises: Promise<void>[] = [];

  // Collect all unique image descriptions
  const descriptions = new Set<string>();
  for (const slide of slides) {
    for (const desc of slide.imageDescriptions || []) {
      descriptions.add(desc);
    }

    // Check elements for image types
    for (const element of slide.elements) {
      if (element.type === 'image' && element.content) {
        descriptions.add(element.content);
      }
      // Grid items may have images
      if (element.metadata?.gridItems) {
        for (const item of element.metadata.gridItems) {
          for (const row of item.rows) {
            if (row.type === 'image' && row.value) {
              descriptions.add(row.value);
            }
          }
        }
      }
    }
  }

  // Fetch each image
  for (const desc of Array.from(descriptions)) {
    const entry = manifest?.[desc];
    const url = entry ? getActiveImageUrl(entry) : null;

    if (url) {
      const promise = fetchImageAsBase64(url).then((result) => {
        if (result) {
          cache.set(desc, {
            description: desc,
            data: result.data,
            mimeType: result.mimeType,
          });
        }
      });
      fetchPromises.push(promise);
    }
  }

  // Wait for all fetches to complete
  await Promise.all(fetchPromises);

  return cache;
}

/**
 * Get image for a description from cache
 * Returns null if not found (caller should use placeholder)
 */
export function getImageFromCache(
  cache: ImageCache,
  description: string
): FetchedImage | null {
  return cache.get(description) || null;
}

/**
 * Create a 1x1 pixel PNG placeholder (minimal, always works)
 * Returns base64 encoded PNG
 */
export function createPlaceholderImage(
  description: string,
  bgColor: string = '#374151',
  _textColor: string = '#9ca3af'
): FetchedImage {
  // Minimal 1x1 gray PNG (always works, no SVG complexity)
  // This is a valid 1x1 PNG with the specified background color approximation
  const grayPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  return {
    description,
    data: grayPng,
    mimeType: 'image/png',
    width: 1,
    height: 1,
  };
}

/**
 * Convert base64 image to data URL for embedding
 */
export function toDataUrl(image: FetchedImage): string {
  return `data:${image.mimeType};base64,${image.data}`;
}

/**
 * Get image dimensions from base64 data
 * Note: For PNG/JPEG, dimensions are in the header
 * This is a simplified version that returns standard dimensions
 */
export function getStandardDimensions(
  aspectRatio: '16:9' | '4:3' = '16:9'
): { width: number; height: number } {
  if (aspectRatio === '4:3') {
    return { width: 800, height: 600 };
  }
  return { width: 800, height: 450 };
}
