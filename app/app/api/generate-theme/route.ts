// ============================================
// API: /api/generate-theme
// Generate CSS theme from natural language prompt
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { saveTheme } from '@/lib/blob';

const THEME_GENERATION_PROMPT = `You are a CSS theme generator for a presentation app. Given a natural language description of a desired visual style, generate CSS custom properties (variables) that define the theme.

The theme should include:
1. Colors (background, text, accent, muted, surface)
2. Fonts (display, body, mono) - use Google Fonts or system fonts
3. Spacing and sizing hints
4. Any special effects or properties

Output ONLY valid CSS with custom properties. Use this exact structure:

:root {
  /* Colors */
  --slide-bg: <background color>;
  --slide-text: <text color>;
  --slide-accent: <accent color>;
  --slide-muted: <muted text color>;
  --slide-surface: <surface/card color>;

  /* Fonts - use Google Fonts names or system fonts */
  --font-display: '<display font>', system-ui, sans-serif;
  --font-body: '<body font>', system-ui, sans-serif;
  --font-mono: '<mono font>', monospace;

  /* Sizing */
  --title-size: <size>;
  --subtitle-size: <size>;
  --text-size: <size>;

  /* Effects */
  --glow-color: <glow color if applicable>;
  --border-radius: <radius>;
  --transition-speed: <speed>;
}

/* Optional: Add any additional styles needed for the theme */

Be creative but ensure readability. For dark themes, use light text on dark backgrounds. For light themes, use dark text on light backgrounds. Choose fonts that match the mood - bold/modern fonts for tech themes, elegant serif for sophisticated themes, etc.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, deckId } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Theme prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `${THEME_GENERATION_PROMPT}\n\nUser's theme request: "${prompt}"\n\nGenerate the CSS theme:`,
        },
      ],
    });

    // Extract CSS from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

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
    const fontMatches = css.matchAll(/--font-\w+:\s*'([^']+)'/g);
    const fonts: string[] = [];
    for (const match of fontMatches) {
      const fontName = match[1];
      // Filter out system fonts
      if (!['system-ui', 'sans-serif', 'serif', 'monospace'].includes(fontName.toLowerCase())) {
        fonts.push(fontName);
      }
    }

    // Generate Google Fonts import URL
    const uniqueFonts = [...new Set(fonts)];
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
