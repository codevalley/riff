// ============================================
// API: /api/convert-document
// Convert long-form documents to Riff slide format
// Uses AI Gateway + Kimi K2 (same as generate-slide)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { saveDeck } from '@/lib/blob';
import { DOCUMENT_TO_SLIDES_PROMPT } from '@/lib/prompts';

// Create Vercel AI Gateway client
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { document, documentName, options } = await request.json();

    if (!document || typeof document !== 'string') {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    if (document.length > 100000) {
      return NextResponse.json(
        { error: 'Document too large. Maximum 100,000 characters.' },
        { status: 400 }
      );
    }

    // Build the conversion prompt
    const slideCount = options?.slideCount || 'auto';
    const style = options?.style || 'professional';

    const userPrompt = `Convert the following document into a Riff presentation.

## Conversion Settings
- Target slide count: ${slideCount === 'auto' ? 'Determine automatically based on content' : slideCount + ' slides'}
- Style preference: ${style}
- Include speaker notes: ${options?.includeSpeakerNotes !== false ? 'Yes' : 'No'}

## Document Content
${document}

## Output
Generate the complete markdown for the presentation now:`;

    const modelId = process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    const { text: markdown } = await generateText({
      model: gateway(modelId),
      system: DOCUMENT_TO_SLIDES_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 8192,
    });

    // Clean up - remove any markdown code fences if present
    let cleanedMarkdown = markdown
      .replace(/^```markdown?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Ensure slides start properly (remove leading ---)
    if (cleanedMarkdown.startsWith('---')) {
      cleanedMarkdown = cleanedMarkdown.slice(3).trim();
    }

    // Validate that it looks like slide markdown
    if (!cleanedMarkdown.includes('# ')) {
      return NextResponse.json(
        { error: 'Invalid slide format generated', raw: markdown },
        { status: 500 }
      );
    }

    // Generate deck name from document name or first title
    const deckName = documentName?.trim() ||
      cleanedMarkdown.match(/^#\s+(.+)$/m)?.[1] ||
      'Imported Presentation';

    // Save the deck
    const deck = await saveDeck(deckName, cleanedMarkdown);

    // Count slides (number of --- separators + 1)
    const slideCountResult = (cleanedMarkdown.match(/^---$/gm) || []).length + 1;

    return NextResponse.json({
      deck,
      markdown: cleanedMarkdown,
      slideCount: slideCountResult,
    });

  } catch (error) {
    console.error('Error converting document:', error);
    return NextResponse.json(
      { error: 'Failed to convert document', details: String(error) },
      { status: 500 }
    );
  }
}
