// ============================================
// API: /api/decks/[id]
// Get, Update, Delete specific deck (with ownership check)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeckContent, updateDeckBlob, deleteDeckBlob } from '@/lib/blob';

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

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        url: deck.blobUrl,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
      content,
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

    // Update blob content
    const newBlobUrl = await updateDeckBlob(deck.blobPath, content);

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
