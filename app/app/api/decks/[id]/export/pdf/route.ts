// ============================================
// API: /api/decks/[id]/export/pdf
// Export deck as PDF (slides as pages)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeckContent, getMetadata } from '@/lib/blob';
import { stripFrontmatter, parseSlideMarkdown } from '@/lib/parser';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  parseThemeCSS,
  fetchAllImages,
  createPdfDocument,
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

    // Strip frontmatter and parse slides
    const content = stripFrontmatter(rawContent);
    const parsed = parseSlideMarkdown(rawContent);

    // Get metadata for theme and images
    const metadata = await getMetadata(session.user.id, deckId);

    // Debug: Log theme CSS
    console.log('[PDF Export] Theme CSS available:', !!metadata?.theme?.css);
    if (metadata?.theme?.css) {
      console.log('[PDF Export] Theme CSS (first 500 chars):', metadata.theme.css.slice(0, 500));
    }

    const theme = parseThemeCSS(metadata?.theme?.css);
    console.log('[PDF Export] Parsed theme:', JSON.stringify(theme, null, 2));

    // Fetch all images in parallel
    const imageCache = await fetchAllImages(parsed.slides, metadata?.images);

    // Create PDF document (async - registers fonts)
    const pdfDocument = await createPdfDocument(parsed.slides, theme, imageCache);

    // Render to buffer
    const pdfBuffer = await renderToBuffer(pdfDocument);

    // Create filename
    const safeFilename = deck.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || 'presentation';

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
