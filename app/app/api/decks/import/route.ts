// ============================================
// API: /api/decks/import
// Import deck from .riff bundle (JSON with all metadata)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveDeckBlob, saveMetadata } from '@/lib/blob';
import { nanoid } from 'nanoid';
import { RiffExport, DeckMetadataV3 } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the .riff file content
    const riffData: RiffExport = await request.json();

    // Validate format
    if (riffData.format !== 'riff-v1') {
      return NextResponse.json(
        { error: 'Invalid or unsupported .riff format' },
        { status: 400 }
      );
    }

    if (!riffData.content || typeof riffData.content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid .riff file: missing content' },
        { status: 400 }
      );
    }

    // Generate unique deck ID
    const deckId = nanoid(10);

    // Use provided name or default
    const deckName = riffData.name || 'Imported Deck';

    // Save content to blob storage (user-scoped)
    const { blobPath, blobUrl } = await saveDeckBlob(
      session.user.id,
      deckId,
      riffData.content
    );

    // Save metadata (theme, images, settings) if present
    if (riffData.metadata) {
      const metadata: DeckMetadataV3 = {
        ...riffData.metadata,
        v: 3, // Ensure v3 marker
      };
      await saveMetadata(session.user.id, deckId, metadata);
    }

    // Create deck record in database
    const deck = await prisma.deck.create({
      data: {
        id: deckId,
        name: deckName,
        blobPath,
        blobUrl,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      deck: {
        id: deck.id,
        name: deck.name,
        url: deck.blobUrl,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error importing deck:', error);

    // Check for JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid .riff file: not valid JSON' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to import deck' },
      { status: 500 }
    );
  }
}
