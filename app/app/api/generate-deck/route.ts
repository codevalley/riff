// ============================================
// API: /api/generate-deck
// Stage 1: Generate deck markdown using DeckSmith
// Uses premium AI model for best quality
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  DECKSMITH_SYSTEM_PROMPT,
  MARKDOWN_SYNTAX_SPEC,
  REFERENCE_DECK_TEMPLATE,
} from '@/lib/prompts';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { extractFrontmatter } from '@/lib/parser';

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

    // Credit check for deck generation
    const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.DOCUMENT_CONVERSION);
    if (!creditCheck.allowed) {
      return NextResponse.json(creditCheck.error, { status: 402 });
    }

    const { document, options, context } = await request.json();

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

    // Build the DeckSmith prompt with three injected inputs
    const slideCount = options?.slideCount || 'auto';

    // Build slide count instruction for context
    let slideCountHint = '';
    if (slideCount === 'full') {
      slideCountHint = '\n[Slide count: Cover ALL content comprehensively - use as many slides as needed]';
    } else if (slideCount !== 'auto' && typeof slideCount === 'number') {
      slideCountHint = `\n[Target: approximately ${slideCount} slides]`;
    }

    // Build optional user context section
    const contextSection = context && typeof context === 'string' && context.trim()
      ? `\n\n[User Instructions: ${context.trim()}]`
      : '';

    // DeckSmith user prompt with three plain text block injections
    const userPrompt = `## MARKDOWN_SYNTAX_SPEC
${MARKDOWN_SYNTAX_SPEC}

## REFERENCE_DECK_TEMPLATE
${REFERENCE_DECK_TEMPLATE}

## SOURCE_CONTENT${slideCountHint}${contextSection}
${document}`;

    // Use premium model for deck generation
    const deckModelId = process.env.AI_DECK_MODEL || process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    // Use higher token limit for "full" mode
    const maxTokens = slideCount === 'full' ? 16384 : 8192;

    // Generate deck content with DeckSmith
    const { text: deckOutput } = await generateText({
      model: gateway(deckModelId),
      system: DECKSMITH_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: maxTokens,
    });

    // DeckSmith outputs in ```text``` code block - extract the content
    let cleanedMarkdown = deckOutput;
    const textBlockMatch = deckOutput.match(/```text\s*([\s\S]*?)```/);
    if (textBlockMatch) {
      cleanedMarkdown = textBlockMatch[1].trim();
    } else {
      // Fallback: try markdown fence or just clean up
      cleanedMarkdown = deckOutput
        .replace(/^```(?:markdown|text)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    // Ensure slides start properly (remove leading ---)
    if (cleanedMarkdown.startsWith('---')) {
      cleanedMarkdown = cleanedMarkdown.slice(3).trim();
    }

    // Validate that it looks like slide markdown
    if (!cleanedMarkdown.includes('# ')) {
      return NextResponse.json(
        { error: 'Invalid slide format generated', raw: deckOutput },
        { status: 500 }
      );
    }

    // Add v: 2 marker to mark as v2 format deck
    const { frontmatter, body } = extractFrontmatter(cleanedMarkdown);
    frontmatter.v = 2;

    // Rebuild markdown with frontmatter
    if (frontmatter.v || (frontmatter.images && Object.keys(frontmatter.images).length > 0)) {
      let yamlContent = '';
      if (frontmatter.v) {
        yamlContent += `v: ${frontmatter.v}\n`;
      }
      if (frontmatter.images && Object.keys(frontmatter.images).length > 0) {
        yamlContent += 'images:\n';
        for (const [desc, data] of Object.entries(frontmatter.images)) {
          yamlContent += `  ${JSON.stringify(desc)}:\n`;
          for (const [key, val] of Object.entries(data as unknown as Record<string, unknown>)) {
            yamlContent += `    ${key}: ${val}\n`;
          }
        }
      }
      cleanedMarkdown = body + `\n\n---\n${yamlContent}---`;
    }

    // Count slides (number of --- separators + 1)
    const slideCountResult = (cleanedMarkdown.match(/^---$/gm) || []).length + 1;

    // Deduct credits for deck generation
    await deductCredits(
      session.user.id,
      CREDIT_COSTS.DOCUMENT_CONVERSION,
      'Deck generation (DeckSmith)',
      { slideCount: slideCountResult }
    );

    return NextResponse.json({
      markdown: cleanedMarkdown,
      slideCount: slideCountResult,
    });

  } catch (error) {
    console.error('Error generating deck:', error);
    return NextResponse.json(
      { error: 'Failed to generate deck', details: String(error) },
      { status: 500 }
    );
  }
}
