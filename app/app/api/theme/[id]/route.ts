// ============================================
// API: /api/theme/[id]
// Get, apply from history, and delete saved themes for a deck (user-scoped)
// Now returns full v3 metadata including theme history
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMetadata, deleteTheme, applyThemeFromHistory, saveMetadata } from '@/lib/blob';

// GET: Fetch theme and history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = decodeURIComponent(params.id);
    const metadata = await getMetadata(session.user.id, deckId);

    if (!metadata?.theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Return current theme + history for quantization UI
    return NextResponse.json({
      css: metadata.theme.css,
      prompt: metadata.theme.prompt,
      generatedAt: metadata.theme.generatedAt,
      // Theme history for "apply previous theme" feature
      history: metadata.themeHistory?.map((t, index) => ({
        index,
        prompt: t.prompt,
        generatedAt: t.generatedAt,
        // Include a preview snippet of CSS (accent color)
        preview: extractAccentColor(t.css),
      })) || [],
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Apply theme from history OR update imageContext
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = decodeURIComponent(params.id);
    const body = await request.json();

    // Handle imageContext update
    if (body.imageContext !== undefined) {
      const metadata = await getMetadata(session.user.id, deckId) || { v: 3 as const };
      metadata.imageContext = body.imageContext;
      await saveMetadata(session.user.id, deckId, metadata);
      return NextResponse.json({ success: true, imageContext: body.imageContext });
    }

    // Handle theme history application
    const { historyIndex } = body;
    if (typeof historyIndex !== 'number' || historyIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid request - provide historyIndex or imageContext' },
        { status: 400 }
      );
    }

    const updatedMetadata = await applyThemeFromHistory(
      session.user.id,
      deckId,
      historyIndex
    );

    if (!updatedMetadata?.theme) {
      return NextResponse.json(
        { error: 'Failed to apply theme from history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      css: updatedMetadata.theme.css,
      prompt: updatedMetadata.theme.prompt,
      generatedAt: updatedMetadata.theme.generatedAt,
    });
  } catch (error) {
    console.error('Error in theme PATCH:', error);
    return NextResponse.json(
      { error: 'Failed to update', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Extract accent color from CSS for preview
 */
function extractAccentColor(css: string): string | null {
  const match = css.match(/--color-accent:\s*([^;]+)/);
  return match ? match[1].trim() : null;
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

    const deckId = decodeURIComponent(params.id);
    await deleteTheme(session.user.id, deckId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return NextResponse.json(
      { error: 'Failed to delete theme', details: String(error) },
      { status: 500 }
    );
  }
}
