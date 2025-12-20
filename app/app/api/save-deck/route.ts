// ============================================
// API: /api/save-deck
// Final stage: Save deck and theme to database
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveDeckBlob, saveTheme, getMetadata, saveMetadata } from '@/lib/blob';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { markdown, title, themeCss, themePrompt, imageContext } = await request.json();

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Deck markdown is required' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Deck title is required' },
        { status: 400 }
      );
    }

    // Generate unique deck ID
    const deckId = nanoid(10);

    // Save to blob storage (user-scoped)
    const { blobPath, blobUrl } = await saveDeckBlob(
      session.user.id,
      deckId,
      markdown
    );

    // Create deck record in database
    const deck = await prisma.deck.create({
      data: {
        id: deckId,
        name: title,
        blobPath,
        blobUrl,
        ownerId: session.user.id,
      },
    });

    // Save theme if provided
    if (themeCss && themePrompt) {
      await saveTheme(session.user.id, deckId, themeCss, themePrompt);
    }

    // Save imageContext to metadata if provided
    if (imageContext && typeof imageContext === 'string') {
      const existingMetadata = await getMetadata(session.user.id, deckId);
      const metadata = existingMetadata || { v: 3 };
      metadata.imageContext = imageContext;
      await saveMetadata(session.user.id, deckId, metadata);
    }

    // Count slides
    const slideCount = (markdown.match(/^---$/gm) || []).length + 1;

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        url: deck.blobUrl,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
      slideCount,
    });

  } catch (error) {
    console.error('Error saving deck:', error);
    return NextResponse.json(
      { error: 'Failed to save deck', details: String(error) },
      { status: 500 }
    );
  }
}
