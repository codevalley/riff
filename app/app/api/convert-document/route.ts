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
import { DOCUMENT_TO_SLIDES_PROMPT, DEFAULT_THEME_SYSTEM_PROMPT } from '@/lib/prompts';
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

    // Build optional context section
    const contextSection = context && typeof context === 'string' && context.trim()
      ? `\n## User Instructions\n${context.trim()}\n`
      : '';

    const userPrompt = `Convert the following document into a Riff presentation.

## Conversion Settings
- Slide count: ${slideCountInstruction}
- Style preference: ${style}
- Include speaker notes: ${options?.includeSpeakerNotes !== false ? 'Yes' : 'No'}
${contextSection}
## IMPORTANT: Visual Requirements
- Add [image: description] placeholders generously - at least every 2-3 slides
- Use descriptive, specific image descriptions (e.g., "[image: A confident speaker presenting to an engaged audience in a modern conference room]")
- Use background effects like [bg:glow-bottom-left] or [bg:grid-center] on section headers
- Apply text effects like [anvil], [typewriter], or [glow] on impactful titles
- Use **pause** to create progressive reveals for bullet points

## Document Content
${document}

## Output Format
LINE 1: Output a short deck title (MAX 4-5 words) with a relevant emoji prefix, like: "TITLE: 🚀 Product Launch Strategy" or "TITLE: 📊 Q4 Review". Keep it punchy!
LINE 2: Output a theme description for the visual style, like: "THEME: Modern tech startup with electric blue accents and clean geometric patterns" or "THEME: Warm and approachable with soft gradients and friendly rounded elements". Be specific and creative!
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

    // Extract suggested theme (format: "THEME: Modern tech with blue accents")
    let suggestedTheme: string | null = null;
    const themeMatch = cleanedMarkdown.match(/^THEME:\s*(.+)$/im);
    if (themeMatch) {
      suggestedTheme = themeMatch[1].trim();
      // Remove the THEME line from markdown
      cleanedMarkdown = cleanedMarkdown.replace(/^THEME:\s*.+\n*/im, '').trim();
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
          // Generate theme CSS
          const { text: themeResponse } = await generateText({
            model: gateway(modelId),
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
