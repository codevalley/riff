// ============================================
// API: /api/convert-document
// Convert long-form documents to Riff slide format
// Uses AI Gateway + Kimi K2 (same as generate-slide)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveDeckBlob } from '@/lib/blob';
import { DOCUMENT_TO_SLIDES_PROMPT } from '@/lib/prompts';
import { nanoid } from 'nanoid';

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

    // Build slide count instruction
    let slideCountInstruction: string;
    if (slideCount === 'full') {
      slideCountInstruction = 'Create as many slides as needed to cover ALL content comprehensively. Do NOT summarize or reduce - preserve all information from the document. Each major point, paragraph, or concept should have its own slide.';
    } else if (slideCount === 'auto') {
      slideCountInstruction = 'Determine automatically based on content (typically 1 slide per major point)';
    } else {
      slideCountInstruction = `Target approximately ${slideCount} slides`;
    }

    const userPrompt = `Convert the following document into a Riff presentation.

## Conversion Settings
- Slide count: ${slideCountInstruction}
- Style preference: ${style}
- Include speaker notes: ${options?.includeSpeakerNotes !== false ? 'Yes' : 'No'}

## IMPORTANT: Visual Requirements
- Add [image: description] placeholders generously - at least every 2-3 slides
- Use descriptive, specific image descriptions (e.g., "[image: A confident speaker presenting to an engaged audience in a modern conference room]")
- Use background effects like [bg:glow-bottom-left] or [bg:grid-center] on section headers
- Apply text effects like [anvil], [typewriter], or [glow] on impactful titles
- Use **pause** to create progressive reveals for bullet points

## Document Content
${document}

## Output Format
FIRST LINE: Output a suggested deck title with a relevant emoji prefix, like: "TITLE: 🚀 Product Launch Strategy" or "TITLE: 📊 Q4 Financial Review"
THEN: Generate the complete markdown for the presentation.

Begin:`;

    const modelId = process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    // Use higher token limit for "full" mode
    const maxTokens = slideCount === 'full' ? 16384 : 8192;

    const { text: markdown } = await generateText({
      model: gateway(modelId),
      system: DOCUMENT_TO_SLIDES_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: maxTokens,
    });

    // Clean up - remove any markdown code fences if present
    let cleanedMarkdown = markdown
      .replace(/^```markdown?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Extract suggested title with emoji (format: "TITLE: 🚀 Product Launch")
    let suggestedTitle: string | null = null;
    const titleMatch = cleanedMarkdown.match(/^TITLE:\s*(.+)$/im);
    if (titleMatch) {
      suggestedTitle = titleMatch[1].trim();
      // Remove the TITLE line from markdown
      cleanedMarkdown = cleanedMarkdown.replace(/^TITLE:\s*.+\n*/im, '').trim();
    }

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

    // Generate deck name: use suggested title, then document name, then first heading
    const deckName = suggestedTitle ||
      documentName?.trim() ||
      cleanedMarkdown.match(/^#\s+(.+)$/m)?.[1] ||
      '📄 Imported Presentation';

    // Generate unique deck ID
    const deckId = nanoid(10);

    // Save to blob storage (user-scoped)
    const { blobPath, blobUrl } = await saveDeckBlob(
      session.user.id,
      deckId,
      cleanedMarkdown
    );

    // Create deck record in database
    const deck = await prisma.deck.create({
      data: {
        id: deckId,
        name: deckName,
        blobPath,
        blobUrl,
        ownerId: session.user.id,
      },
    });

    // Count slides (number of --- separators + 1)
    const slideCountResult = (cleanedMarkdown.match(/^---$/gm) || []).length + 1;

    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        url: deck.blobUrl,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
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
