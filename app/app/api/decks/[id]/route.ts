// ============================================
// API: /api/decks/[id]
// Get, Update, Delete specific deck (with ownership check)
// Now with v3 metadata migration: extracts frontmatter to JSON
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeckContent, updateDeckBlob, deleteDeckBlob, getMetadata, saveMetadata } from '@/lib/blob';
import { normalizeDeckContent, stripFrontmatter, extractFrontmatterForMigration } from '@/lib/parser';
import { DeckMetadataV3 } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    // Get deck from database with ownership check
    const deck = await prisma.deck.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Get content from blob storage
    const content = await getDeckContent(deck.blobUrl);
    if (!content) {
      return NextResponse.json({ error: 'Deck content not found' }, { status: 404 });
    }

    // Get metadata (v3 format - includes theme, images, settings)
    const metadata = await getMetadata(session.user.id, id);

    // Determine publish status
    const isPublished = !!deck.publishedAt;
    const hasUnpublishedChanges = isPublished && deck.updatedAt > deck.publishedAt!;

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        url: deck.blobUrl,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
      content,
      metadata, // v3 metadata (theme, images, themeHistory, settings)
      publishStatus: {
        isPublished,
        publishedAt: deck.publishedAt?.toISOString() || null,
        hasUnpublishedChanges,
        shareToken: deck.shareToken || null,
        views: deck.views,
      },
    });
  } catch (error) {
    console.error('Error getting deck:', error);
    return NextResponse.json(
      { error: 'Failed to get deck' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get deck with ownership check
    const deck = await prisma.deck.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // === V3 MIGRATION: Extract frontmatter and save to metadata ===
    // 1. Extract any embedded frontmatter (images, version)
    const embeddedData = extractFrontmatterForMigration(content);

    // 2. If we found embedded frontmatter, merge it into metadata JSON
    if (embeddedData.images && Object.keys(embeddedData.images).length > 0) {
      // Get existing metadata
      const existingMetadata = await getMetadata(session.user.id, id);
      const metadata: DeckMetadataV3 = existingMetadata || { v: 3 };

      // Merge images (existing metadata takes precedence for conflicts)
      metadata.images = {
        ...embeddedData.images,
        ...metadata.images,
      };

      // Save updated metadata
      await saveMetadata(session.user.id, id, metadata);
    }

    // 3. Strip frontmatter from content and normalize
    // Now markdown is clean - no YAML at top or bottom
    const cleanContent = stripFrontmatter(content);
    const normalizedContent = cleanContent
      .split(/\n---\n/)
      .filter(s => s.trim())
      .map(s => s.trim().replace(/\n{3,}/g, '\n\n'))
      .join('\n\n---\n\n');

    // Update blob content (now frontmatter-free)
    const newBlobUrl = await updateDeckBlob(deck.blobPath, normalizedContent);

    // Update deck record
    const updatedDeck = await prisma.deck.update({
      where: { id },
      data: {
        blobUrl: newBlobUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      deck: {
        id: updatedDeck.id,
        name: updatedDeck.name,
        url: updatedDeck.blobUrl,
        createdAt: updatedDeck.createdAt,
        updatedAt: updatedDeck.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get deck with ownership check
    const deck = await prisma.deck.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Update deck name
    const updatedDeck = await prisma.deck.update({
      where: { id },
      data: {
        name: name.trim(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      deck: {
        id: updatedDeck.id,
        name: updatedDeck.name,
        url: updatedDeck.blobUrl,
        createdAt: updatedDeck.createdAt,
        updatedAt: updatedDeck.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error renaming deck:', error);
    return NextResponse.json(
      { error: 'Failed to rename deck' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    // Get deck with ownership check
    const deck = await prisma.deck.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Delete blob
    await deleteDeckBlob(deck.blobUrl);

    // Delete database record
    await prisma.deck.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 }
    );
  }
}
