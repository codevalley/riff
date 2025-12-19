// ============================================
// API: /api/add-slide
// Generate a single slide using AI
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import {
  DECKSMITH_ADD_SLIDE_PROMPT,
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
    const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.ADD_SLIDE);
    if (!creditCheck.allowed) {
      return NextResponse.json(creditCheck.error, { status: 402 });
    }

    const {
      deckId,
      insertAfterSlide,
      userDescription,
      deckContext,
      surroundingSlides,
    } = await request.json();

    if (!userDescription || typeof userDescription !== 'string' || !userDescription.trim()) {
      return NextResponse.json(
        { error: 'Slide description is required' },
        { status: 400 }
      );
    }

    // Build the user prompt with context injections
    let userPrompt = `## MARKDOWN_SYNTAX_SPEC
${MARKDOWN_SYNTAX_SPEC}

## DECK_CONTEXT
Title: ${deckContext?.title || 'Untitled Deck'}
Current slide count: ${deckContext?.slideCount || 0}
Inserting after slide: ${insertAfterSlide + 1}`;

    // Add surrounding slides for context
    if (surroundingSlides) {
      userPrompt += `

## SURROUNDING_SLIDES`;
      if (surroundingSlides.before) {
        userPrompt += `

### Previous slide (slide ${insertAfterSlide + 1}):
${surroundingSlides.before}`;
      }
      if (surroundingSlides.after) {
        userPrompt += `

### Next slide (slide ${insertAfterSlide + 2}):
${surroundingSlides.after}`;
      }
    }

    userPrompt += `

## USER_REQUEST
${userDescription.trim()}

Generate a single slide that fits this context.`;

    // Use model from env
    const modelId = process.env.AI_DECK_MODEL || process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    const { text: slideContent } = await generateText({
      model: gateway(modelId),
      system: DECKSMITH_ADD_SLIDE_PROMPT,
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

    // Validate that it looks like slide markdown (has some structure)
    if (!cleanedSlide.includes('[') && !cleanedSlide.includes('#')) {
      return NextResponse.json(
        { error: 'Invalid slide format generated' },
        { status: 500 }
      );
    }

    // Deduct credits after successful generation
    await deductCredits(
      session.user.id,
      CREDIT_COSTS.ADD_SLIDE,
      'Add slide',
      { deckId, insertAfterSlide }
    );

    return NextResponse.json({
      slideContent: cleanedSlide,
      insertAfterSlide,
    });

  } catch (error) {
    console.error('Error adding slide:', error);
    return NextResponse.json(
      { error: 'Failed to generate slide', details: String(error) },
      { status: 500 }
    );
  }
}
