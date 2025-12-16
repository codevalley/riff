// ============================================
// API: /api/revamp-deck
// AI-powered deck refinement based on user instructions
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';

// Create Vercel AI Gateway client
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
});

const REVAMP_SYSTEM_PROMPT = `You are a presentation expert. Your job is to REVAMP and IMPROVE an existing Riff presentation based on user instructions.

## RIFF MARKDOWN FORMAT

Each slide is separated by \`---\` on its own line.

### Element Types:
- \`# Title\` - Main headline (large, bold)
- \`## Heading\` - Secondary heading
- \`### Text\` - Body text
- Regular text - Also treated as body text
- \`- Item\` or \`* Item\` - Bullet list
- \`1. Item\` - Numbered list
- \`[image: description]\` - AI-generated image (describe what to show)
- \`**pause**\` - Progressive reveal (content after appears on click)
- \`> Speaker note\` - Hidden notes for presenter only
- \`\`\`language\\ncode\\n\`\`\` - Code blocks

### Section separators:
- \`[section]\` - Marks a section header slide

### Text Effects (append to titles):
- \`# Title [anvil]\` - Drop animation
- \`# Title [typewriter]\` - Character-by-character reveal
- \`# Title [glow]\` - Pulsing glow effect
- \`# Title [shake]\` - Attention shake

### Background Effects (before content):
- \`[bg:glow-bottom-left]\` - Gradient glow
- \`[bg:grid-center]\` - Grid pattern
- \`[bg:hatch-top-right-amber]\` - Hatched pattern with color

### Inline Formatting:
- \`\`keyword\`\` - Highlighted/accent text

## REVAMP GUIDELINES

1. **Preserve Core Content**: Keep the essential information and message intact. This is a refinement, not a rewrite.

2. **PRESERVE FRONTMATTER**: If the deck has frontmatter (YAML between --- markers at the end starting with "images:"), keep it EXACTLY as-is at the end of the output.

3. **Apply User Instructions**: Follow the user's specific requests for improvement.

4. **Enhance Visually**:
   - Add more [image: description] placeholders if lacking visuals
   - Add **pause** for progressive reveals on dense slides
   - Apply text effects on impactful titles
   - Use background effects on section headers

5. **Improve Flow**:
   - Ensure logical progression between slides
   - Balance content density across slides
   - Add speaker notes where helpful

6. **Keep it Punchy**:
   - Titles should be concise and impactful
   - Limit bullet points (3-5 max per slide)
   - Remove redundancy

## OUTPUT FORMAT
Output ONLY the complete revised markdown. No explanations, no code fences. Just the deck markdown content.`;

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
      system: REVAMP_SYSTEM_PROMPT,
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
