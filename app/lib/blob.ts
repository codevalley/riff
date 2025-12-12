// ============================================
// RIFF - Vercel Blob Utilities
// User-scoped storage for decks, themes, images
// ============================================

import { put, del, list } from '@vercel/blob';
import { hashDescription } from './parser';

// Legacy prefixes (for backward compatibility / shared content)
const IMAGES_PREFIX = 'images/';

// User-scoped path helpers
function userDecksPrefix(userId: string): string {
  return `users/${userId}/decks/`;
}

function userThemesPrefix(userId: string): string {
  return `users/${userId}/themes/`;
}

function userSlidesPrefix(userId: string): string {
  return `users/${userId}/slides/`;
}

/**
 * Normalize deck ID for consistent storage
 * - Replace spaces with hyphens
 * - Lowercase
 * - Remove special characters
 */
function normalizeDeckId(id: string): string {
  return id
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ============================================
// DECK BLOB OPERATIONS (User-scoped)
// Note: Deck metadata is stored in Prisma, blobs store content only
// ============================================

export interface DeckBlobData {
  id: string;
  name: string;
  blobPath: string;
  blobUrl: string;
}

/**
 * Get deck content by blob URL (used when we already have the URL from Prisma)
 */
export async function getDeckContent(blobUrl: string): Promise<string | null> {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.error('Error getting deck content:', error);
    return null;
  }
}

/**
 * Get deck content by path (for direct blob access)
 */
export async function getDeckByPath(blobPath: string): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: blobPath });
    if (blobs.length === 0) return null;

    const response = await fetch(blobs[0].url);
    return await response.text();
  } catch (error) {
    console.error('Error getting deck by path:', error);
    return null;
  }
}

/**
 * Create or update a deck blob (user-scoped)
 * Returns blob path and URL for storing in Prisma
 */
export async function saveDeckBlob(
  userId: string,
  deckId: string,
  content: string
): Promise<{ blobPath: string; blobUrl: string }> {
  const normalizedId = normalizeDeckId(deckId);
  const blobPath = `${userDecksPrefix(userId)}${normalizedId}.md`;

  // Delete existing if updating
  try {
    const { blobs } = await list({ prefix: blobPath });
    if (blobs.length > 0) {
      await del(blobs[0].url);
    }
  } catch {
    // Ignore - might not exist
  }

  const blob = await put(blobPath, content, {
    access: 'public',
    contentType: 'text/markdown',
    addRandomSuffix: false,
  });

  return {
    blobPath,
    blobUrl: blob.url,
  };
}

/**
 * Update deck content at existing blob path
 */
export async function updateDeckBlob(blobPath: string, content: string): Promise<string> {
  // Delete existing
  try {
    const { blobs } = await list({ prefix: blobPath });
    if (blobs.length > 0) {
      await del(blobs[0].url);
    }
  } catch {
    // Ignore
  }

  const blob = await put(blobPath, content, {
    access: 'public',
    contentType: 'text/markdown',
    addRandomSuffix: false,
  });

  return blob.url;
}

/**
 * Delete a deck blob by URL
 */
export async function deleteDeckBlob(blobUrl: string): Promise<boolean> {
  try {
    await del(blobUrl);
    return true;
  } catch (error) {
    console.error('Error deleting deck blob:', error);
    return false;
  }
}

// ============================================
// IMAGE CACHE OPERATIONS
// ============================================

/**
 * Check if an image is cached
 */
export async function getImageFromCache(description: string): Promise<string | null> {
  try {
    const hash = hashDescription(description);
    const pathname = `${IMAGES_PREFIX}${hash}.png`;
    const { blobs } = await list({ prefix: pathname });

    if (blobs.length > 0) {
      return blobs[0].url;
    }
    return null;
  } catch (error) {
    console.error('Error checking image cache:', error);
    return null;
  }
}

/**
 * Save an image to cache
 */
export async function saveImageToCache(
  description: string,
  imageData: ArrayBuffer | Buffer
): Promise<string> {
  const hash = hashDescription(description);
  const pathname = `${IMAGES_PREFIX}${hash}.png`;

  // Delete existing if force regenerating
  try {
    const existing = await list({ prefix: pathname });
    if (existing.blobs.length > 0) {
      await del(existing.blobs[0].url);
    }
  } catch {
    // Ignore
  }

  const blob = await put(pathname, imageData, {
    access: 'public',
    contentType: 'image/png',
    addRandomSuffix: false, // IMPORTANT: Keep exact pathname for cache lookups
  });

  return blob.url;
}

/**
 * Delete a cached image
 */
export async function deleteImageFromCache(description: string): Promise<boolean> {
  try {
    const hash = hashDescription(description);
    const pathname = `${IMAGES_PREFIX}${hash}.png`;
    const { blobs } = await list({ prefix: pathname });

    if (blobs.length > 0) {
      await del(blobs[0].url);
    }
    return true;
  } catch (error) {
    console.error('Error deleting cached image:', error);
    return false;
  }
}

// ============================================
// THEME OPERATIONS (User-scoped)
// ============================================

/**
 * Save a generated theme (user-scoped)
 */
export async function saveTheme(
  userId: string,
  deckId: string,
  css: string,
  prompt: string
): Promise<string> {
  const pathname = `${userThemesPrefix(userId)}${encodeURIComponent(deckId)}.json`;

  const themeData = JSON.stringify({
    css,
    prompt,
    generatedAt: new Date().toISOString(),
  });

  // Delete existing
  try {
    const existing = await list({ prefix: pathname });
    if (existing.blobs.length > 0) {
      await del(existing.blobs[0].url);
    }
  } catch {
    // Ignore
  }

  const blob = await put(pathname, themeData, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });

  return blob.url;
}

/**
 * Get a saved theme for a deck (user-scoped)
 */
export async function getTheme(
  userId: string,
  deckId: string
): Promise<{ css: string; prompt: string } | null> {
  try {
    const pathname = `${userThemesPrefix(userId)}${encodeURIComponent(deckId)}.json`;
    const { blobs } = await list({ prefix: pathname });

    if (blobs.length === 0) return null;

    const response = await fetch(blobs[0].url);
    const data = await response.json();

    return {
      css: data.css,
      prompt: data.prompt,
    };
  } catch (error) {
    console.error('Error getting theme:', error);
    return null;
  }
}

/**
 * Delete a saved theme for a deck (user-scoped)
 */
export async function deleteTheme(userId: string, deckId: string): Promise<boolean> {
  try {
    const pathname = `${userThemesPrefix(userId)}${encodeURIComponent(deckId)}.json`;
    const { blobs } = await list({ prefix: pathname });

    if (blobs.length > 0) {
      await del(blobs[0].url);
    }
    return true;
  } catch (error) {
    console.error('Error deleting theme:', error);
    return false;
  }
}

// ============================================
// GENERATED SLIDE HTML OPERATIONS (User-scoped)
// ============================================

/**
 * Get cached HTML for a generated slide (user-scoped)
 */
export async function getSlideHtmlFromCache(
  userId: string,
  deckId: string,
  slideIndex: number,
  contentHash: string
): Promise<string | null> {
  try {
    const normalizedDeckId = normalizeDeckId(deckId);
    const pathname = `${userSlidesPrefix(userId)}${normalizedDeckId}/${slideIndex}-${contentHash}.html`;
    const { blobs } = await list({ prefix: pathname });

    if (blobs.length === 0) return null;

    const response = await fetch(blobs[0].url);
    return await response.text();
  } catch (error) {
    console.error('Error getting slide HTML from cache:', error);
    return null;
  }
}

/**
 * Save generated slide HTML to cache (user-scoped)
 */
export async function saveSlideHtmlToCache(
  userId: string,
  deckId: string,
  slideIndex: number,
  contentHash: string,
  html: string
): Promise<string> {
  const normalizedDeckId = normalizeDeckId(deckId);
  const pathname = `${userSlidesPrefix(userId)}${normalizedDeckId}/${slideIndex}-${contentHash}.html`;

  // Delete existing if regenerating
  try {
    const existing = await list({ prefix: pathname });
    if (existing.blobs.length > 0) {
      await del(existing.blobs[0].url);
    }
  } catch {
    // Ignore
  }

  const blob = await put(pathname, html, {
    access: 'public',
    contentType: 'text/html',
    addRandomSuffix: false,
  });

  return blob.url;
}

/**
 * Delete all cached slide HTML for a deck (user-scoped)
 */
export async function deleteSlideCache(userId: string, deckId: string): Promise<boolean> {
  try {
    const normalizedDeckId = normalizeDeckId(deckId);
    const prefix = `${userSlidesPrefix(userId)}${normalizedDeckId}/`;
    const { blobs } = await list({ prefix });

    for (const blob of blobs) {
      await del(blob.url);
    }
    return true;
  } catch (error) {
    console.error('Error deleting slide cache:', error);
    return false;
  }
}
