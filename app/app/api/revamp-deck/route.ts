// ============================================
// API: /api/revamp-deck
// AI-powered deck refinement based on user instructions
// Uses DeckSmith architecture with preservation rules
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import {
  DECKSMITH_REVAMP_PROMPT,
  MARKDOWN_SYNTAX_SPEC,
  REFERENCE_DECK_TEMPLATE,
} from '@/lib/prompts';
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

    // Credit check
    const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.DECK_REVAMP);
    if (!creditCheck.allowed) {
      return NextResponse.json(creditCheck.error, { status: 402 });
    }

    const { deckId, currentContent, instructions } = await request.json();

    if (!currentContent || typeof currentContent !== 'string') {
      return NextResponse.json(
        { error: 'Current deck content is required' },
        { status: 400 }
      );
    }

    if (!instructions || typeof instructions !== 'string' || !instructions.trim()) {
      return NextResponse.json(
        { error: 'Instructions are required' },
        { status: 400 }
      );
    }

    // Count slides before revamp
    const originalSlideCount = (currentContent.match(/^---$/gm) || []).length + 1;

    // Build the DeckSmith user prompt with four injected inputs
    const userPrompt = `## MARKDOWN_SYNTAX_SPEC
${MARKDOWN_SYNTAX_SPEC}

## REFERENCE_DECK_TEMPLATE
${REFERENCE_DECK_TEMPLATE}

## CURRENT_DECK
${currentContent}

## USER_INSTRUCTIONS
${instructions.trim()}`;

    // Use premium model for revamp (same as deck generation)
    const modelId = process.env.AI_DECK_MODEL || process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    const { text: revampOutput } = await generateText({
      model: gateway(modelId),
      system: DECKSMITH_REVAMP_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 16384,
    });

    // DeckSmith outputs in ```text``` code block - extract the content
    let cleanedMarkdown = revampOutput;
    const textBlockMatch = revampOutput.match(/```text\s*([\s\S]*?)```/);
    if (textBlockMatch) {
      cleanedMarkdown = textBlockMatch[1].trim();
    } else {
      // Fallback: try markdown fence or just clean up
      cleanedMarkdown = revampOutput
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
        { error: 'Invalid slide format generated', raw: revampOutput },
        { status: 500 }
      );
    }

    // Count slides after revamp
    const newSlideCount = (cleanedMarkdown.match(/^---$/gm) || []).length + 1;

    // Add v: 2 marker using proper frontmatter extraction
    // This ensures we don't create duplicate blocks
    const { frontmatter, body } = extractFrontmatter(cleanedMarkdown);
    frontmatter.v = 2;

    // Rebuild markdown with frontmatter at end
    // Only add frontmatter block if there's content
    if (frontmatter.v || (frontmatter.images && Object.keys(frontmatter.images).length > 0)) {
      let yamlContent = '';
      if (frontmatter.v) {
        yamlContent += `v: ${frontmatter.v}\n`;
      }
      if (frontmatter.images && Object.keys(frontmatter.images).length > 0) {
        // Use simple YAML serialization for images
        yamlContent += 'images:\n';
        for (const [desc, data] of Object.entries(frontmatter.images)) {
          yamlContent += `  ${JSON.stringify(desc)}:\n`;
          for (const [key, val] of Object.entries(data)) {
            yamlContent += `    ${key}: ${val}\n`;
          }
        }
      }
      cleanedMarkdown = body + `\n\n---\n${yamlContent}---`;
    } else {
      cleanedMarkdown = body;
    }

    // Deduct credits after successful revamp
    await deductCredits(
      session.user.id,
      CREDIT_COSTS.DECK_REVAMP,
      'Deck revamp',
      { deckId, originalSlideCount, newSlideCount }
    );

    return NextResponse.json({
      content: cleanedMarkdown,
      slideCount: newSlideCount,
      originalSlideCount,
    });

  } catch (error) {
    console.error('Error revamping deck:', error);
    return NextResponse.json(
      { error: 'Failed to revamp deck', details: String(error) },
      { status: 500 }
    );
  }
}
