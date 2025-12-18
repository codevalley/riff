// ============================================
// API: /api/generate-deck-metadata
// Stage 2: Extract title and theme prompt from deck
// Uses standard model (fast, cheap)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DECK_METADATA_PROMPT } from '@/lib/prompts';

// Create Vercel AI Gateway client
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { markdown } = await request.json();

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Deck markdown is required' },
        { status: 400 }
      );
    }

    // Use standard model for metadata extraction (fast)
    const modelId = process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    // Extract title and theme via LLM
    const { text: metadataOutput } = await generateText({
      model: gateway(modelId),
      system: DECK_METADATA_PROMPT,
      prompt: `Extract title and theme from this deck:\n\n${markdown.slice(0, 3000)}`,
      maxOutputTokens: 256,
    });

    // Parse JSON response
    let title: string | null = null;
    let themePrompt: string | null = null;

    const jsonMatch = metadataOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const metadata = JSON.parse(jsonMatch[0]);
        title = metadata.title || null;
        themePrompt = metadata.themePrompt || null;
      } catch {
        // JSON parse failed, try to extract manually
      }
    }

    // Fallback: extract first heading as title
    if (!title) {
      const headingMatch = markdown.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        title = headingMatch[1].replace(/\[.*?\]/g, '').trim();
      }
    }

    // Default theme if none extracted
    if (!themePrompt) {
      themePrompt = 'Modern dark theme with subtle accents';
    }

    return NextResponse.json({
      title: title || 'Untitled Presentation',
      themePrompt,
    });

  } catch (error) {
    console.error('Error extracting metadata:', error);
    return NextResponse.json(
      { error: 'Failed to extract metadata', details: String(error) },
      { status: 500 }
    );
  }
}
