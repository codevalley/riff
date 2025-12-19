// ============================================
// API: /api/revamp-slide
// Transform a single slide using AI
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import {
  DECKSMITH_REVAMP_SLIDE_PROMPT,
  MARKDOWN_SYNTAX_SPEC,
} from '@/lib/prompts';

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

    // Credit check
    const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.SLIDE_REVAMP);
    if (!creditCheck.allowed) {
      return NextResponse.json(creditCheck.error, { status: 402 });
    }

    const {
      deckId,
      slideIndex,
      currentSlide,
      userInstructions,
      deckContext,
    } = await request.json();

    if (!currentSlide || typeof currentSlide !== 'string') {
      return NextResponse.json(
        { error: 'Current slide content is required' },
        { status: 400 }
      );
    }

    if (!userInstructions || typeof userInstructions !== 'string' || !userInstructions.trim()) {
      return NextResponse.json(
        { error: 'Instructions are required' },
        { status: 400 }
      );
    }

    // Build the user prompt with context injections
    const userPrompt = `## MARKDOWN_SYNTAX_SPEC
${MARKDOWN_SYNTAX_SPEC}

## DECK_CONTEXT
Title: ${deckContext?.title || 'Untitled Deck'}
Theme: ${deckContext?.theme || 'default'}
This is slide ${slideIndex + 1} of ${deckContext?.slideCount || 1}

## CURRENT_SLIDE
${currentSlide}

## USER_INSTRUCTIONS
${userInstructions.trim()}

Transform this slide according to the instructions.`;

    // Use model from env
    const modelId = process.env.AI_DECK_MODEL || process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    const { text: slideContent } = await generateText({
      model: gateway(modelId),
      system: DECKSMITH_REVAMP_SLIDE_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 2048,
    });

    // Clean up the output - remove any code fences or separators
    let cleanedSlide = slideContent
      .replace(/^```(?:text|markdown)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .replace(/^---\s*/gm, '')  // Remove any leading separators
      .replace(/\s*---\s*$/gm, '')  // Remove any trailing separators
      .trim();

    // Validate that it looks like slide markdown
    if (!cleanedSlide.includes('[') && !cleanedSlide.includes('#')) {
      return NextResponse.json(
        { error: 'Invalid slide format generated' },
        { status: 500 }
      );
    }

    // Deduct credits after successful generation
    await deductCredits(
      session.user.id,
      CREDIT_COSTS.SLIDE_REVAMP,
      'Revamp slide',
      { deckId, slideIndex }
    );

    return NextResponse.json({
      slideContent: cleanedSlide,
      slideIndex,
    });

  } catch (error) {
    console.error('Error revamping slide:', error);
    return NextResponse.json(
      { error: 'Failed to revamp slide', details: String(error) },
      { status: 500 }
    );
  }
}
