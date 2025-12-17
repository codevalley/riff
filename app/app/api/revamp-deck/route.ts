// ============================================
// API: /api/revamp-deck
// AI-powered deck refinement based on user instructions
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { DECK_REVAMP_PROMPT } from '@/lib/prompts';
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

    // Build the user prompt
    const userPrompt = `## Current Deck Content

${currentContent}

---

## User Instructions

${instructions.trim()}

---

Now revamp the deck according to the instructions above. Output only the revised markdown.`;

    const modelId = process.env.AI_GATEWAY_MODEL || 'moonshotai/kimi-k2-0905';

    const { text: markdown } = await generateText({
      model: gateway(modelId),
      system: DECK_REVAMP_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 16384,
    });

    // Clean up - remove any markdown code fences if present
    let cleanedMarkdown = markdown
      .replace(/^```markdown?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

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
