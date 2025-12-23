// ============================================
// RIFF - Vercel Blob Utilities
// User-scoped storage for decks, themes, images
// ============================================

import { put, del, list } from '@vercel/blob';
import { hashDescription } from './parser';
import { DeckMetadataV3, ThemeData, ImageManifest } from './types';

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

    const response = await fetch(blobs[0].url, { cache: 'no-store' });
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
 * Maximum number of themes to keep in history
 */
const MAX_THEME_HISTORY = 10;

/**
 * Get full deck metadata (v3 format)
 * Handles both legacy (theme-only) and v3 (unified) formats
 */
export async function getMetadata(
  userId: string,
  deckId: string
): Promise<DeckMetadataV3 | null> {
  try {
    const pathname = `${userThemesPrefix(userId)}${encodeURIComponent(deckId)}.json`;
    const { blobs } = await list({ prefix: pathname });

    if (blobs.length === 0) return null;

    // CRITICAL: Use no-store to bypass CDN cache
    // Without this, rapid sequential writes can read stale data and lose updates
    const response = await fetch(blobs[0].url, { cache: 'no-store' });
    const data = await response.json();

    // Check if this is v3 format
    if (data.v === 3) {
      return data as DeckMetadataV3;
    }

    // Legacy format: wrap theme data in v3 structure
    // Legacy has: { css, prompt, generatedAt }
    if (data.css && data.prompt) {
      return {
        v: 3,
        theme: {
          css: data.css,
          prompt: data.prompt,
          generatedAt: data.generatedAt,
        },
      };
    }

    // Unknown format - return empty v3
    return { v: 3 };
  } catch (error) {
    console.error('Error getting metadata:', error);
    return null;
  }
}

/**
 * Save full deck metadata (v3 format)
 */
export async function saveMetadata(
  userId: string,
  deckId: string,
  metadata: DeckMetadataV3
): Promise<string> {
  const pathname = `${userThemesPrefix(userId)}${encodeURIComponent(deckId)}.json`;

  // Ensure v3 marker
  const dataToSave: DeckMetadataV3 = {
    ...metadata,
    v: 3,
  };

  // Delete existing
  try {
    const existing = await list({ prefix: pathname });
    if (existing.blobs.length > 0) {
      await del(existing.blobs[0].url);
    }
  } catch {
    // Ignore
  }

  const blob = await put(pathname, JSON.stringify(dataToSave, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });

  return blob.url;
}

/**
 * Update theme in metadata with history tracking
 * Pushes current theme to history before updating
 */
export async function updateThemeInMetadata(
  userId: string,
  deckId: string,
  newTheme: ThemeData
): Promise<string> {
  // Get existing metadata
  const existing = await getMetadata(userId, deckId);
  const metadata: DeckMetadataV3 = existing || { v: 3 };

  // Push current theme to history if it exists
  if (metadata.theme) {
    metadata.themeHistory = metadata.themeHistory || [];
    metadata.themeHistory.unshift(metadata.theme);
    // Limit history size
    metadata.themeHistory = metadata.themeHistory.slice(0, MAX_THEME_HISTORY);
  }

  // Set new theme
  metadata.theme = newTheme;

  return saveMetadata(userId, deckId, metadata);
}

/**
 * Apply theme from history (swap with current)
 * No LLM call needed - just CSS swap
 */
export async function applyThemeFromHistory(
  userId: string,
  deckId: string,
  historyIndex: number
): Promise<DeckMetadataV3 | null> {
  const metadata = await getMetadata(userId, deckId);
  if (!metadata) return null;

  const history = metadata.themeHistory || [];
  if (historyIndex < 0 || historyIndex >= history.length) return null;

  // Swap current theme with history entry
  const selectedTheme = history[historyIndex];
  const currentTheme = metadata.theme;

  // Remove selected from history
  history.splice(historyIndex, 1);

  // Push current to front of history (if exists)
  if (currentTheme) {
    history.unshift(currentTheme);
  }

  // Update metadata
  metadata.theme = selectedTheme;
  metadata.themeHistory = history.slice(0, MAX_THEME_HISTORY);

  await saveMetadata(userId, deckId, metadata);
  return metadata;
}

/**
 * Update images in metadata (merge with existing)
 */
export async function updateImagesInMetadata(
  userId: string,
  deckId: string,
  images: ImageManifest
): Promise<string> {
  const existing = await getMetadata(userId, deckId);
  const metadata: DeckMetadataV3 = existing || { v: 3 };

  // Merge images
  metadata.images = {
    ...metadata.images,
    ...images,
  };

  return saveMetadata(userId, deckId, metadata);
}

/**
 * Save a generated theme (user-scoped)
 * @deprecated Use updateThemeInMetadata for v3 with history support
 */
export async function saveTheme(
  userId: string,
  deckId: string,
  css: string,
  prompt: string
): Promise<string> {
  // Use v3 format with history tracking
  return updateThemeInMetadata(userId, deckId, {
    css,
    prompt,
    generatedAt: new Date().toISOString(),
  });
}

/**
 * Get a saved theme for a deck (user-scoped)
 * @deprecated Use getMetadata for v3 with full metadata access
 */
export async function getTheme(
  userId: string,
  deckId: string
): Promise<{ css: string; prompt: string } | null> {
  const metadata = await getMetadata(userId, deckId);
  if (!metadata?.theme) return null;

  return {
    css: metadata.theme.css,
    prompt: metadata.theme.prompt,
  };
}

/**
 * Delete a saved theme for a deck (user-scoped)
 * Note: This now deletes the entire metadata file
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

    const response = await fetch(blobs[0].url, { cache: 'no-store' });
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
