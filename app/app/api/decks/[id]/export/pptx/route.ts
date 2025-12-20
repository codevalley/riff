// ============================================
// API: /api/decks/[id]/export/pptx
// Export deck as PowerPoint (native .pptx)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeckContent, getMetadata } from '@/lib/blob';
import { parseSlideMarkdown } from '@/lib/parser';
import {
  parseThemeCSS,
  fetchAllImages,
  generatePptxBuffer,
} from '@/lib/export';

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

    // Parse slides
    const parsed = parseSlideMarkdown(rawContent);

    // Get metadata for theme and images
    const metadata = await getMetadata(session.user.id, deckId);
    const theme = parseThemeCSS(metadata?.theme?.css);

    // Fetch all images in parallel
    const imageCache = await fetchAllImages(parsed.slides, metadata?.images);

    // Generate PPTX buffer
    const pptxBuffer = await generatePptxBuffer(
      parsed.slides,
      deck.name,
      theme,
      imageCache
    );

    // Create filename
    const safeFilename = deck.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || 'presentation';

    // Return PPTX
    return new NextResponse(pptxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${safeFilename}.pptx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting PPTX:', error);
    return NextResponse.json(
      { error: 'Failed to export PowerPoint' },
      { status: 500 }
    );
  }
}
