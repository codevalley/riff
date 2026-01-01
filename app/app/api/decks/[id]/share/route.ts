// ============================================
// API: /api/decks/[id]/share
// Create and manage share links for a deck
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// POST: Create or get share token
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

    // If already has a share token, return it (prefer slug URL if available)
    if (deck.shareToken) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';
      const shareIdentifier = deck.shareSlug || deck.shareToken;
      return NextResponse.json({
        shareToken: deck.shareToken,
        shareSlug: deck.shareSlug,
        shareUrl: `${baseUrl}/p/${shareIdentifier}`,
        isPublished: !!deck.publishedAt,
        publishedAt: deck.publishedAt?.toISOString() || null,
        views: deck.views,
      });
    }

    // Generate new share token
    const shareToken = nanoid(12);

    // Update deck with share token
    const updatedDeck = await prisma.deck.update({
      where: { id: deckId },
      data: { shareToken },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';
    return NextResponse.json({
      shareToken: updatedDeck.shareToken,
      shareUrl: `${baseUrl}/p/${updatedDeck.shareToken}`,
      isPublished: false,
      publishedAt: null,
      views: 0,
    });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

// GET: Get current share status
export async function GET(
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

    if (!deck.shareToken) {
      return NextResponse.json({
        isShared: false,
        shareToken: null,
        shareSlug: null,
        shareUrl: null,
        isPublished: false,
        publishedAt: null,
        views: 0,
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';
    const shareIdentifier = deck.shareSlug || deck.shareToken;
    return NextResponse.json({
      isShared: true,
      shareToken: deck.shareToken,
      shareSlug: deck.shareSlug,
      shareUrl: `${baseUrl}/p/${shareIdentifier}`,
      isPublished: !!deck.publishedAt,
      publishedAt: deck.publishedAt?.toISOString() || null,
      views: deck.views,
    });
  } catch (error) {
    console.error('Error getting share status:', error);
    return NextResponse.json(
      { error: 'Failed to get share status' },
      { status: 500 }
    );
  }
}

// DELETE: Revoke share (clears token and published content)
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

    // Clear share token, slug, and published content
    await prisma.deck.update({
      where: { id: deckId },
      data: {
        shareToken: null,
        shareSlug: null,
        publishedContent: null,
        publishedTheme: null,
        publishedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking share:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share' },
      { status: 500 }
    );
  }
}
