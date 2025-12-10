// ============================================
// API: /api/generate-slide
// Generate custom HTML for a slide using LLM
// Uses Vercel AI Gateway for fast, unified access
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { DEFAULT_SLIDE_SYSTEM_PROMPT } from '@/lib/prompts';

// Create Vercel AI Gateway client
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { slideContent, themePrompt, slideIndex, deckId, customSystemPrompt } = await request.json();

    if (!slideContent || typeof slideContent !== 'string') {
      return NextResponse.json(
        { error: 'Slide content is required' },
        { status: 400 }
      );
    }

    // Use custom system prompt if provided, otherwise use default
    const systemPrompt = customSystemPrompt || DEFAULT_SLIDE_SYSTEM_PROMPT;

    // Build the user prompt
    let userPrompt = `Create a stunning HTML slide for the following content:\n\n${slideContent}`;

    if (themePrompt) {
      userPrompt += `\n\n## Theme Direction\n${themePrompt}`;
    }

    userPrompt += `\n\nGenerate the complete HTML now:`;

    // Use model from env - format: provider/model-name
    const modelId = process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    const { text: html } = await generateText({
      model: gateway(modelId),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 4096,
    });

    // Clean up - remove any markdown code fences if present
    let cleanedHtml = html
      .replace(/^```html?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Ensure it starts with a style or div tag
    if (!cleanedHtml.startsWith('<')) {
      // Try to extract HTML from the response
      const htmlMatch = cleanedHtml.match(/<style[\s\S]*<\/div>/i);
      if (htmlMatch) {
        cleanedHtml = htmlMatch[0];
      }
    }

    return NextResponse.json({
      html: cleanedHtml,
      slideIndex,
      deckId,
    });
  } catch (error) {
    console.error('Error generating slide:', error);
    return NextResponse.json(
      { error: 'Failed to generate slide', details: String(error) },
      { status: 500 }
    );
  }
}
