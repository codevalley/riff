// ============================================
// API: /api/decks/[id]/publish
// Publish current deck state to the shared view
// With silent repair: recovers image URLs from localStorage
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeckContent, getTheme, updateDeckBlob } from '@/lib/blob';
import { nanoid } from 'nanoid';
import { extractFrontmatter, updateImageInManifest, normalizeFrontmatter } from '@/lib/parser';
import { ImageSlot } from '@/lib/types';

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

    // Parse request body for image URLs
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

    // === SILENT REPAIR ===
    // Merge localStorage image URLs into frontmatter if they're missing
    // This recovers images for decks created before frontmatter was added
    if (Object.keys(imageUrls).length > 0) {
      const { frontmatter } = extractFrontmatter(content);
      const existingManifest = frontmatter.images || {};

      // Parse localStorage keys: 'vibe-image-{slot}:{description}'
      for (const [key, url] of Object.entries(imageUrls)) {
        if (key === '__imageStyle__') continue; // Skip the style setting

        // Extract slot and description from key
        const match = key.match(/^vibe-image-(generated|uploaded|restyled):(.+)$/);
        if (!match) continue;

        const slot = match[1] as ImageSlot;
        const description = match[2];

        // Check if this image is already in frontmatter
        const existingEntry = existingManifest[description];
        if (existingEntry?.[slot]) continue; // Already have this URL

        // Add to frontmatter
        content = updateImageInManifest(content, description, slot, url, !existingEntry);
      }

      // Save repaired content back to blob and update deck record
      const originalContent = await getDeckContent(deck.blobUrl);
      if (content !== originalContent) {
        const newBlobUrl = await updateDeckBlob(deck.blobPath, content);
        await prisma.deck.update({
          where: { id: deckId },
          data: { blobUrl: newBlobUrl, updatedAt: new Date() },
        });
      }
    }

    // === NORMALIZE FRONTMATTER ===
    // Ensure frontmatter is at bottom of document (migrates legacy top-frontmatter)
    const originalContent = content;
    content = normalizeFrontmatter(content);

    // Save normalized content back to blob if it changed
    if (content !== originalContent) {
      const newBlobUrl = await updateDeckBlob(deck.blobPath, content);
      await prisma.deck.update({
        where: { id: deckId },
        data: { blobUrl: newBlobUrl },
      });
    }

    // Get current theme (may be null)
    const theme = await getTheme(session.user.id, deckId);

    // Add image URLs to theme data for persistence (for backward compat with ImageUrlHydrator)
    const themeWithImages = theme
      ? { ...theme, imageUrls }
      : { imageUrls };

    // If no share token exists, create one
    let shareToken = deck.shareToken;
    if (!shareToken) {
      shareToken = nanoid(12);
    }

    // Update deck with published content
    // IMPORTANT: Set both publishedAt AND updatedAt to the same timestamp
    // This ensures hasUnpublishedChanges (updatedAt > publishedAt) is false after publish
    const now = new Date();
    const updatedDeck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        shareToken,
        publishedContent: content,
        publishedTheme: JSON.stringify(themeWithImages),
        publishedAt: now,
        updatedAt: now,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';
    return NextResponse.json({
      success: true,
      shareToken: updatedDeck.shareToken,
      shareUrl: `${baseUrl}/p/${updatedDeck.shareToken}`,
      publishedAt: updatedDeck.publishedAt?.toISOString(),
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

    // Clear published data
    await prisma.deck.update({
      where: { id: deckId },
      data: {
        shareToken: null,
        publishedContent: null,
        publishedTheme: null,
        publishedAt: null,
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
