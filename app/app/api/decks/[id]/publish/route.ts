// ============================================
// API: /api/decks/[id]/publish
// Publish current deck state to the shared view
// Now uses v3 metadata JSON for theme and images
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeckContent, getMetadata, saveMetadata, updateDeckBlob } from '@/lib/blob';
import { nanoid } from 'nanoid';
import { stripFrontmatter, extractFrontmatterForMigration } from '@/lib/parser';
import { ImageSlot, DeckMetadataV3 } from '@/lib/types';
import { generateShareSlug } from '@/lib/utils';

// POST: Publish current deck state
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = params.id;

    // Parse request body for image URLs (from localStorage, for backward compat)
    let imageUrls: Record<string, string> = {};
    try {
      const body = await request.json();
      imageUrls = body.imageUrls || {};
    } catch {
      // No body or invalid JSON - that's fine
    }

    // Get deck with ownership check
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        ownerId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Get current content from blob
    let content = await getDeckContent(deck.blobUrl);
    if (!content) {
      return NextResponse.json(
        { error: 'Deck content not found' },
        { status: 404 }
      );
    }

    // Get v3 metadata (theme, images, settings)
    let metadata = await getMetadata(session.user.id, deckId);
    if (!metadata) {
      metadata = { v: 3 };
    }

    // === V3 MIGRATION: Extract embedded frontmatter if present ===
    const embeddedData = extractFrontmatterForMigration(content);
    if (embeddedData.images && Object.keys(embeddedData.images).length > 0) {
      // Merge embedded images into metadata (embedded takes precedence for migration)
      metadata.images = {
        ...metadata.images,
        ...embeddedData.images,
      };
    }

    // === SILENT REPAIR ===
    // Merge localStorage image URLs into metadata if they're missing
    // This recovers images for decks created before metadata was added
    if (Object.keys(imageUrls).length > 0) {
      const existingImages = metadata.images || {};

      // Parse localStorage keys: 'vibe-image-{slot}:{description}'
      for (const [key, url] of Object.entries(imageUrls)) {
        if (key === '__imageStyle__') continue; // Skip the style setting

        // Extract slot and description from key
        const match = key.match(/^vibe-image-(generated|uploaded|restyled):(.+)$/);
        if (!match) continue;

        const slot = match[1] as ImageSlot;
        const description = match[2];

        // Check if this image is already in metadata
        const existingEntry = existingImages[description];
        if (existingEntry?.[slot]) continue; // Already have this URL

        // Add to metadata
        if (!metadata.images) metadata.images = {};
        if (!metadata.images[description]) {
          metadata.images[description] = { active: slot };
        }
        metadata.images[description][slot] = url;
      }

      // Save updated metadata
      await saveMetadata(session.user.id, deckId, metadata);
    }

    // === NORMALIZE & STRIP FRONTMATTER ===
    // Strip embedded frontmatter (now in metadata JSON) and normalize
    const cleanContent = stripFrontmatter(content);
    const normalizedContent = cleanContent
      .split(/\n---\n/)
      .filter(s => s.trim())
      .map(s => s.trim().replace(/\n{3,}/g, '\n\n'))
      .join('\n\n---\n\n');

    // Save normalized content back to blob if it changed
    if (normalizedContent !== content) {
      const newBlobUrl = await updateDeckBlob(deck.blobPath, normalizedContent);
      await prisma.deck.update({
        where: { id: deckId },
        data: { blobUrl: newBlobUrl },
      });
    }

    // If no share token exists, create one (legacy, kept for backward compat)
    let shareToken = deck.shareToken;
    if (!shareToken) {
      shareToken = nanoid(12);
    }

    // Generate SEO-friendly slug if not exists
    let shareSlug = deck.shareSlug;
    if (!shareSlug) {
      shareSlug = generateShareSlug(deck.name);
      // Handle unlikely collision
      const existing = await prisma.deck.findUnique({ where: { shareSlug } });
      if (existing) {
        shareSlug = generateShareSlug(deck.name); // Regenerate with new ID
      }
    }

    // Update deck with published content
    // Store full metadata as publishedTheme (includes theme + images)
    // IMPORTANT: Set both publishedAt AND updatedAt to the same timestamp
    // This ensures hasUnpublishedChanges (updatedAt > publishedAt) is false after publish
    const now = new Date();
    const updatedDeck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        shareToken,
        shareSlug,
        publishedContent: normalizedContent,
        publishedTheme: JSON.stringify(metadata), // v3: full metadata
        publishedAt: now,
        updatedAt: now,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';
    // Use slug for URL (SEO-friendly), fallback to token for legacy
    const shareIdentifier = updatedDeck.shareSlug || updatedDeck.shareToken;
    return NextResponse.json({
      success: true,
      shareToken: updatedDeck.shareToken,
      shareSlug: updatedDeck.shareSlug,
      shareUrl: `${baseUrl}/p/${shareIdentifier}`,
      publishedAt: updatedDeck.publishedAt?.toISOString(),
      views: updatedDeck.views,
    });
  } catch (error) {
    console.error('Error publishing deck:', error);
    return NextResponse.json(
      { error: 'Failed to publish deck' },
      { status: 500 }
    );
  }
}

// DELETE: Unpublish deck (remove from public access)
// By default preserves shareToken/shareSlug for URL continuity
// Pass { clearSlug: true } to generate a new URL on republish
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = params.id;

    // Parse request body for clearSlug option
    let clearSlug = false;
    try {
      const body = await request.json();
      clearSlug = body.clearSlug === true;
    } catch {
      // No body or invalid JSON - default to preserving slug
    }

    // Get deck with ownership check
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        ownerId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Clear published content
    // Optionally clear slug/token if user wants a fresh start
    await prisma.deck.update({
      where: { id: deckId },
      data: {
        publishedContent: null,
        publishedTheme: null,
        publishedAt: null,
        // Only clear these if user explicitly requested fresh URL
        ...(clearSlug && {
          shareToken: null,
          shareSlug: null,
          views: 0,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unpublishing deck:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish deck' },
      { status: 500 }
    );
  }
}
