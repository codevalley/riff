// ============================================
// VIBE SLIDES - Vercel Blob Utilities
// ============================================

import { put, del, list } from '@vercel/blob';
import { Deck } from './types';
import { hashDescription } from './parser';

const DECKS_PREFIX = 'decks/';
const IMAGES_PREFIX = 'images/';
const THEMES_PREFIX = 'themes/';

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
// DECK OPERATIONS
// ============================================

/**
 * List all decks in blob storage
 */
export async function listDecks(): Promise<Deck[]> {
  try {
    const { blobs } = await list({ prefix: DECKS_PREFIX });

    return blobs
      .filter((blob) => blob.pathname.endsWith('.md'))
      .map((blob) => {
        const filename = blob.pathname.replace(DECKS_PREFIX, '').replace('.md', '');
        return {
          id: filename,
          name: filename.replace(/-/g, ' '), // Convert hyphens back to spaces for display
          url: blob.url,
          createdAt: new Date(blob.uploadedAt),
          updatedAt: new Date(blob.uploadedAt),
        };
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error('Error listing decks:', error);
    return [];
  }
}

/**
 * Get a specific deck's content
 */
export async function getDeck(id: string): Promise<{ deck: Deck; content: string } | null> {
  try {
    const normalizedId = normalizeDeckId(id);
    const pathname = `${DECKS_PREFIX}${normalizedId}.md`;

    // List all decks and find the matching one
    const { blobs } = await list({ prefix: DECKS_PREFIX });
    const blob = blobs.find((b) => b.pathname === pathname);

    if (!blob) {
      console.log('Deck not found. Looking for:', pathname);
      console.log('Available blobs:', blobs.map((b) => b.pathname));
      return null;
    }

    const response = await fetch(blob.url);
    const content = await response.text();

    return {
      deck: {
        id: normalizedId,
        name: normalizedId.replace(/-/g, ' '),
        url: blob.url,
        createdAt: new Date(blob.uploadedAt),
        updatedAt: new Date(blob.uploadedAt),
      },
      content,
    };
  } catch (error) {
    console.error('Error getting deck:', error);
    return null;
  }
}

/**
 * Create or update a deck
 */
export async function saveDeck(id: string, content: string): Promise<Deck> {
  const normalizedId = normalizeDeckId(id);
  const pathname = `${DECKS_PREFIX}${normalizedId}.md`;

  // Delete existing if updating
  try {
    const { blobs } = await list({ prefix: DECKS_PREFIX });
    const existing = blobs.find((b) => b.pathname === pathname);
    if (existing) {
      await del(existing.url);
    }
  } catch {
    // Ignore - might not exist
  }

  const blob = await put(pathname, content, {
    access: 'public',
    contentType: 'text/markdown',
  });

  return {
    id: normalizedId,
    name: normalizedId.replace(/-/g, ' '),
    url: blob.url,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Delete a deck
 */
export async function deleteDeck(id: string): Promise<boolean> {
  try {
    const normalizedId = normalizeDeckId(id);
    const pathname = `${DECKS_PREFIX}${normalizedId}.md`;

    const { blobs } = await list({ prefix: DECKS_PREFIX });
    const blob = blobs.find((b) => b.pathname === pathname);

    if (blob) {
      await del(blob.url);
    }
    return true;
  } catch (error) {
    console.error('Error deleting deck:', error);
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
// THEME OPERATIONS
// ============================================

/**
 * Save a generated theme
 */
export async function saveTheme(deckId: string, css: string, prompt: string): Promise<string> {
  const pathname = `${THEMES_PREFIX}${encodeURIComponent(deckId)}.json`;

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
  });

  return blob.url;
}

/**
 * Get a saved theme for a deck
 */
export async function getTheme(deckId: string): Promise<{ css: string; prompt: string } | null> {
  try {
    const pathname = `${THEMES_PREFIX}${encodeURIComponent(deckId)}.json`;
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
