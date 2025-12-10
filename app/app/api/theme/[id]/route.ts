// ============================================
// API: /api/theme/[id]
// Get and delete saved themes for a deck
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getTheme, deleteTheme } from '@/lib/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deckId = decodeURIComponent(params.id);
    const theme = await getTheme(deckId);

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      css: theme.css,
      prompt: theme.prompt,
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deckId = decodeURIComponent(params.id);
    await deleteTheme(deckId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return NextResponse.json(
      { error: 'Failed to delete theme', details: String(error) },
      { status: 500 }
    );
  }
}
