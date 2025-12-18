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
import { saveDeckBlob, saveTheme } from '@/lib/blob';
import {
  DECKSMITH_SYSTEM_PROMPT,
  MARKDOWN_SYNTAX_SPEC,
  REFERENCE_DECK_TEMPLATE,
  DECK_METADATA_PROMPT,
  DEFAULT_THEME_SYSTEM_PROMPT
} from '@/lib/prompts';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { extractFrontmatter } from '@/lib/parser';
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

    // Credit check
    const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.DOCUMENT_CONVERSION);
    if (!creditCheck.allowed) {
      return NextResponse.json(creditCheck.error, { status: 402 });
    }

    const { document, documentName, options, context } = await request.json();

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

    // Use separate model for deck generation (most complex operation)
    // AI_DECK_MODEL allows using a premium model specifically for deck generation
    const deckModelId = process.env.AI_DECK_MODEL || process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';
    // Standard model for lighter tasks (metadata extraction, theme generation)
    const standardModelId = process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    // Use higher token limit for "full" mode
    const maxTokens = slideCount === 'full' ? 16384 : 8192;

    // Stage 1: Generate deck content with DeckSmith (using premium model)
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

    // Stage 2: Extract title and theme via separate LLM call
    let suggestedTitle: string | null = null;
    let suggestedTheme: string | null = null;

    try {
      const { text: metadataOutput } = await generateText({
        model: gateway(standardModelId),
        system: DECK_METADATA_PROMPT,
        prompt: `Extract title and theme from this deck:\n\n${cleanedMarkdown.slice(0, 3000)}`,
        maxOutputTokens: 256,
      });

      // Parse JSON response
      const jsonMatch = metadataOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const metadata = JSON.parse(jsonMatch[0]);
        suggestedTitle = metadata.title || null;
        suggestedTheme = metadata.themePrompt || null;
      }
    } catch (metadataError) {
      // Metadata extraction failed - continue without it
      console.error('Metadata extraction failed:', metadataError);
      // Fallback: extract first heading as title
      const headingMatch = cleanedMarkdown.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        suggestedTitle = headingMatch[1].replace(/\[.*?\]/g, '').trim();
      }
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
          for (const [key, val] of Object.entries(data)) {
            yamlContent += `    ${key}: ${val}\n`;
          }
        }
      }
      cleanedMarkdown = body + `\n\n---\n${yamlContent}---`;
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

    // Deduct credits for document conversion
    await deductCredits(
      session.user.id,
      CREDIT_COSTS.DOCUMENT_CONVERSION,
      'Document to slides conversion',
      { deckId: deck.id, documentName, slideCount: slideCountResult }
    );

    // Generate theme if we have a suggestion
    let themeData: { css: string; prompt: string; fonts: string[] } | null = null;
    if (suggestedTheme) {
      try {
        // Check credits for theme generation
        const themeCredits = await requireCredits(session.user.id, CREDIT_COSTS.THEME_GENERATION);
        if (themeCredits.allowed) {
          // Generate theme CSS (using standard model)
          const { text: themeResponse } = await generateText({
            model: gateway(standardModelId),
            prompt: `${DEFAULT_THEME_SYSTEM_PROMPT}\n\nUser's theme request: "${suggestedTheme}"\n\nGenerate the CSS theme:`,
            maxOutputTokens: 2048,
          });

          // Extract CSS from response
          let css = themeResponse;
          const codeBlockMatch = css.match(/```css?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            css = codeBlockMatch[1];
          }
          css = css.trim();

          // Validate CSS
          if (css.includes(':root') || css.includes('--')) {
            // Extract Google Font names
            const fontMatches = Array.from(css.matchAll(/--font-\w+:\s*'([^']+)'/g));
            const fonts: string[] = [];
            for (const match of fontMatches) {
              const fontName = match[1];
              if (!['system-ui', 'sans-serif', 'serif', 'monospace'].includes(fontName.toLowerCase())) {
                fonts.push(fontName);
              }
            }

            // Generate Google Fonts import
            const uniqueFonts = Array.from(new Set(fonts));
            const fontImport = uniqueFonts.length > 0
              ? `@import url('https://fonts.googleapis.com/css2?${uniqueFonts
                  .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
                  .join('&')}&display=swap');\n\n`
              : '';

            const fullCss = fontImport + css;

            // Save theme
            await saveTheme(session.user.id, deckId, fullCss, suggestedTheme);

            // Deduct theme credits
            await deductCredits(
              session.user.id,
              CREDIT_COSTS.THEME_GENERATION,
              'Auto theme generation',
              { prompt: suggestedTheme, deckId }
            );

            themeData = { css: fullCss, prompt: suggestedTheme, fonts: uniqueFonts };
          }
        }
      } catch (themeError) {
        // Theme generation failed - continue without theme
        console.error('Auto theme generation failed:', themeError);
      }
    }

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
      theme: themeData,
    });

  } catch (error) {
    console.error('Error converting document:', error);
    return NextResponse.json(
      { error: 'Failed to convert document', details: String(error) },
      { status: 500 }
    );
  }
}
