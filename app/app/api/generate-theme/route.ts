// ============================================
// API: /api/generate-theme
// Generate CSS theme from natural language prompt
// Uses AI Gateway for unified AI operations
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { saveTheme } from '@/lib/blob';
import { DEFAULT_THEME_SYSTEM_PROMPT } from '@/lib/prompts';

// Create Vercel AI Gateway client
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
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

    // Remove markdown code blocks if present
    const codeBlockMatch = css.match(/```css?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      css = codeBlockMatch[1];
    }

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

    // Generate Google Fonts import URL
    const uniqueFonts = Array.from(new Set(fonts));
    const fontImport = uniqueFonts.length > 0
      ? `@import url('https://fonts.googleapis.com/css2?${uniqueFonts
          .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
          .join('&')}&display=swap');\n\n`
      : '';

    const fullCss = fontImport + css;

    // Save theme if deckId provided
    if (deckId) {
      await saveTheme(deckId, fullCss, prompt);
    }

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
