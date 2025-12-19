// ============================================
// API: /api/decks/[id]/export
// Export deck as .riff bundle (JSON with all metadata)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeckContent, getMetadata } from '@/lib/blob';
import { stripFrontmatter } from '@/lib/parser';
import { RiffExport } from '@/lib/types';

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

    // Get content from blob storage
    const rawContent = await getDeckContent(deck.blobUrl);
    if (!rawContent) {
      return NextResponse.json({ error: 'Deck content not found' }, { status: 404 });
    }

    // Strip any embedded frontmatter (clean markdown only)
    const content = stripFrontmatter(rawContent);

    // Get v3 metadata (theme, images, settings)
    const metadata = await getMetadata(session.user.id, deckId);

    // Build riff export bundle
    const riffExport: RiffExport = {
      format: 'riff-v1',
      name: deck.name,
      content,
      metadata: metadata || { v: 3 },
      exportedAt: new Date().toISOString(),
    };

    // Create filename from deck name
    const safeFilename = deck.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || 'deck';

    // Return as downloadable .riff file
    return new NextResponse(JSON.stringify(riffExport, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${safeFilename}.riff"`,
      },
    });
  } catch (error) {
    console.error('Error exporting deck:', error);
    return NextResponse.json(
      { error: 'Failed to export deck' },
      { status: 500 }
    );
  }
}
