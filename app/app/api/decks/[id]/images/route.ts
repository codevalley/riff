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

// Batch update multiple images at once (avoids race conditions in sweep generation)
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
    const body = await request.json();

    // Validate request body - array of images
    const { images } = body as {
      images: Array<{
        description: string;
        slot: ImageSlot;
        url: string;
      }>;
    };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: images (array)' },
        { status: 400 }
      );
    }

    // Validate each image entry
    for (const img of images) {
      if (!img.description || !img.slot || !img.url) {
        return NextResponse.json(
          { error: 'Each image must have description, slot, and url' },
          { status: 400 }
        );
      }
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

    // Get existing metadata ONCE
    const existingMetadata = await getMetadata(session.user.id, deckId);
    const metadata: DeckMetadataV3 = existingMetadata || { v: 3 };

    // Initialize images if not present
    metadata.images = metadata.images || {};

    // Process all images in one pass
    const updatedImages: Record<string, ImageManifestEntry> = {};
    for (const img of images) {
      // Initialize entry for this description if not present
      if (!metadata.images[img.description]) {
        metadata.images[img.description] = { active: img.slot };
      }

      // Update the slot URL
      metadata.images[img.description][img.slot] = img.url;
      // Set as active
      metadata.images[img.description].active = img.slot;

      updatedImages[img.description] = metadata.images[img.description];
    }

    // Save metadata ONCE after all updates
    await saveMetadata(session.user.id, deckId, metadata);

    // Update deck timestamp
    await prisma.deck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      images: updatedImages,
      count: images.length,
    });
  } catch (error) {
    console.error('Error batch updating images:', error);
    return NextResponse.json(
      { error: 'Failed to batch update images' },
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
