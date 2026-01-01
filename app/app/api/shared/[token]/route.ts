// ============================================
// API: /api/shared/[token]
// Public endpoint - returns published deck content (no auth required)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch published deck content
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Share token required' },
        { status: 400 }
      );
    }

    // Find deck by slug or token (slug takes priority)
    const deck = await prisma.deck.findFirst({
      where: {
        OR: [
          { shareSlug: token },
          { shareToken: token },
        ],
      },
      select: {
        id: true,
        name: true,
        publishedContent: true,
        publishedTheme: true,
        publishedAt: true,
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: 'Shared presentation not found' },
        { status: 404 }
      );
    }

    // Check if deck has been published
    if (!deck.publishedContent || !deck.publishedAt) {
      return NextResponse.json(
        { error: 'This presentation has not been published yet' },
        { status: 404 }
      );
    }

    // Parse theme if exists
    let theme = null;
    if (deck.publishedTheme) {
      try {
        theme = JSON.parse(deck.publishedTheme);
      } catch {
        // Invalid theme JSON, ignore
      }
    }

    return NextResponse.json({
      title: deck.name,
      content: deck.publishedContent,
      theme,
      publishedAt: deck.publishedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching shared deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared presentation' },
      { status: 500 }
    );
  }
}
