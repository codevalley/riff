// ============================================
// API: /api/shared/[token]/view
// Increment view count for published deck
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Increment view count atomically using raw query to avoid updating updatedAt
    // Supports both slug and legacy token
    const result = await prisma.$executeRaw`
      UPDATE "Deck"
      SET views = views + 1
      WHERE ("shareSlug" = ${token} OR "shareToken" = ${token})
      AND "publishedContent" IS NOT NULL
    `;

    if (result === 0) {
      return NextResponse.json(
        { error: 'Deck not found or not published' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
