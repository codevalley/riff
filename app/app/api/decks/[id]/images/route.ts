// ============================================
// API: /api/decks/[id]/images
// Update image manifest in deck metadata (v3)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMetadata, saveMetadata } from '@/lib/blob';
import { DeckMetadataV3, ImageSlot, ImageManifestEntry } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = params.id;
    const body = await request.json();

    // Validate request body
    const { description, slot, url, setActive } = body as {
      description: string;
      slot: ImageSlot;
      url: string;
      setActive?: boolean;
    };

    if (!description || !slot || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: description, slot, url' },
        { status: 400 }
      );
    }

    // Verify deck ownership
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        ownerId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Get existing metadata
    const existingMetadata = await getMetadata(session.user.id, deckId);
    const metadata: DeckMetadataV3 = existingMetadata || { v: 3 };

    // Initialize images if not present
    metadata.images = metadata.images || {};

    // Initialize entry for this description if not present
    if (!metadata.images[description]) {
      metadata.images[description] = { active: slot };
    }

    // Update the slot URL
    metadata.images[description][slot] = url;

    // Update active slot if requested (default: true)
    if (setActive !== false) {
      metadata.images[description].active = slot;
    }

    // Save updated metadata
    await saveMetadata(session.user.id, deckId, metadata);

    // Update deck timestamp
    await prisma.deck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      image: metadata.images[description],
    });
  } catch (error) {
    console.error('Error updating image in metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

// Update only the active slot for an image
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = params.id;
    const body = await request.json();

    const { description, activeSlot } = body as {
      description: string;
      activeSlot: ImageSlot;
    };

    if (!description || !activeSlot) {
      return NextResponse.json(
        { error: 'Missing required fields: description, activeSlot' },
        { status: 400 }
      );
    }

    // Verify deck ownership
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        ownerId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Get existing metadata
    const existingMetadata = await getMetadata(session.user.id, deckId);
    const metadata: DeckMetadataV3 = existingMetadata || { v: 3 };

    // Check if image exists
    if (!metadata.images?.[description]) {
      return NextResponse.json(
        { error: 'Image not found in manifest' },
        { status: 404 }
      );
    }

    // Update active slot
    metadata.images[description].active = activeSlot;

    // Save updated metadata
    await saveMetadata(session.user.id, deckId, metadata);

    return NextResponse.json({
      success: true,
      image: metadata.images[description],
    });
  } catch (error) {
    console.error('Error updating active slot:', error);
    return NextResponse.json(
      { error: 'Failed to update active slot' },
      { status: 500 }
    );
  }
}
