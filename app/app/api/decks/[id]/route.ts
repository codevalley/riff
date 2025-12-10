// ============================================
// API: /api/decks/[id]
// Get, Update, Delete specific deck
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getDeck, saveDeck, deleteDeck } from '@/lib/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // The ID is already decoded by Next.js, pass it directly
    // The blob utilities will normalize it
    const id = params.id;
    console.log('GET deck request for ID:', id);

    const result = await getDeck(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
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
    const id = params.id;
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const deck = await saveDeck(id, content);

    return NextResponse.json({ deck });
  } catch (error) {
    console.error('Error updating deck:', error);
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const success = await deleteDeck(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete deck' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 }
    );
  }
}
