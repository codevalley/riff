// ============================================
// API: /api/generate-theme
// Generate CSS theme from natural language prompt
// Uses AI Gateway for unified AI operations
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveTheme } from '@/lib/blob';
import { DEFAULT_THEME_SYSTEM_PROMPT } from '@/lib/prompts';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';

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
    const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.THEME_GENERATION);
    if (!creditCheck.allowed) {
      return NextResponse.json(creditCheck.error, { status: 402 });
    }

    const { prompt, deckId, customSystemPrompt } = await request.json();

    // Use custom system prompt if provided, otherwise use default
    const systemPrompt = customSystemPrompt || DEFAULT_THEME_SYSTEM_PROMPT;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Theme prompt is required' },
        { status: 400 }
      );
    }

    const modelId = process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    const { text: responseText } = await generateText({
      model: gateway(modelId),
      prompt: `${systemPrompt}\n\nUser's theme request: "${prompt}"\n\nGenerate the CSS theme:`,
      maxOutputTokens: 2048,
    });

    // Try to extract CSS from the response (it might be wrapped in code blocks)
    let css = responseText;

    // Remove markdown code blocks if present (try multiple patterns)
    // Pattern 1: ```css ... ``` or ``` ... ```
    const codeBlockMatch = css.match(/```(?:css)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      css = codeBlockMatch[1];
    }

    // Pattern 2: If still has backticks, strip them all
    css = css.replace(/```(?:css)?/g, '').replace(/```/g, '');

    // Remove any @import statements from AI output (we'll add our own with correct weights)
    css = css.replace(/@import\s+url\([^)]+\);?\s*/g, '');

    // Clean up the CSS
    css = css.trim();

    // Validate that it looks like CSS
    if (!css.includes(':root') && !css.includes('--')) {
      return NextResponse.json(
        { error: 'Invalid theme generated', raw: responseText },
        { status: 500 }
      );
    }

    // Extract Google Font names for loading
    const fontMatches = Array.from(css.matchAll(/--font-\w+:\s*'([^']+)'/g));
    const fonts: string[] = [];
    for (const match of fontMatches) {
      const fontName = match[1];
      // Filter out system fonts
      if (!['system-ui', 'sans-serif', 'serif', 'monospace'].includes(fontName.toLowerCase())) {
        fonts.push(fontName);
      }
    }

    // Extract font weights used in the theme
    const weightMatches = Array.from(css.matchAll(/--weight-\w+:\s*(\d+)/g));
    const usedWeights = new Set<string>();
    for (const match of weightMatches) {
      usedWeights.add(match[1]);
    }
    // Ensure common weights are included (300=light, 400=regular, 500=medium, 600=semibold, 700=bold)
    const weights = usedWeights.size > 0
      ? Array.from(usedWeights).sort().join(';')
      : '300;400;500;600;700';

    // Generate Google Fonts import URL
    const uniqueFonts = Array.from(new Set(fonts));
    const fontImport = uniqueFonts.length > 0
      ? `@import url('https://fonts.googleapis.com/css2?${uniqueFonts
          .map((f) => `family=${encodeURIComponent(f)}:wght@${weights}`)
          .join('&')}&display=swap');\n\n`
      : '';

    const fullCss = fontImport + css;

    // Save theme if deckId provided (user-scoped)
    if (deckId) {
      await saveTheme(session.user.id, deckId, fullCss, prompt);
    }

    // Deduct credits after successful theme generation
    await deductCredits(
      session.user.id,
      CREDIT_COSTS.THEME_GENERATION,
      'AI theme generation',
      { prompt, deckId }
    );

    return NextResponse.json({
      css: fullCss,
      prompt,
      fonts: uniqueFonts,
    });
  } catch (error) {
    console.error('Error generating theme:', error);
    return NextResponse.json(
      { error: 'Failed to generate theme', details: String(error) },
      { status: 500 }
    );
  }
}
