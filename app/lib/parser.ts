// ============================================
// VIBE SLIDES - Markdown Parser
// ============================================
// Parses the custom slide format into structured data

import { Slide, SlideElement, ParsedDeck, DeckMetadata } from './types';

/**
 * Parse a slide markdown document into structured slides
 *
 * Format:
 * ---                          # Slide separator
 * # Title                      # Main headline (h1)
 * ## Heading                   # Secondary heading (h2)
 * ### Subtitle                 # Tertiary text (h3)
 * [image: description]         # Image placeholder
 * **pause**                    # Animation/transition beat
 * > Speaker note               # Speaker notes (not shown)
 * `keyword`                    # Highlighted word (inline)
 * ```lang\ncode\n```          # Code block
 * <!-- comment -->             # Section markers (metadata)
 */

export function parseSlideMarkdown(markdown: string): ParsedDeck {
  const lines = markdown.split('\n');
  const slides: Slide[] = [];
  const sections: string[] = [];

  let currentSlide: Slide | null = null;
  let currentSection: string | undefined;
  let revealOrder = 0;
  let slideId = 0;
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLang = '';

  const finalizeSlide = () => {
    if (currentSlide && currentSlide.elements.length > 0) {
      slides.push(currentSlide);
    }
  };

  const createNewSlide = (isSection = false) => {
    finalizeSlide();
    slideId++;
    revealOrder = 0;
    currentSlide = {
      id: slideId,
      elements: [],
      speakerNotes: '',
      section: currentSection,
      imageDescriptions: [],
      isSection,
    };
  };

  const addElement = (type: SlideElement['type'], content: string, metadata?: SlideElement['metadata']) => {
    if (!currentSlide) createNewSlide();
    currentSlide!.elements.push({
      type,
      content: content.trim(),
      revealOrder,
      metadata,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockContent = '';
      } else {
        inCodeBlock = false;
        addElement('code', codeBlockContent.trim(), { language: codeBlockLang });
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }

    // Skip empty lines
    if (!trimmed) continue;

    // HTML comments (section markers)
    const commentMatch = trimmed.match(/<!--\s*(.+?)\s*-->/);
    if (commentMatch) {
      const comment = commentMatch[1];
      if (!comment.startsWith('=')) {
        currentSection = comment;
        if (!sections.includes(comment)) {
          sections.push(comment);
        }
      }
      continue;
    }

    // Slide separator
    if (trimmed === '---') {
      createNewSlide();
      continue;
    }

    // Section header marker [section]
    if (trimmed === '[section]') {
      if (!currentSlide) {
        createNewSlide(true);
      } else {
        (currentSlide as Slide).isSection = true;
      }
      continue;
    }

    // Pause marker
    if (trimmed === '**pause**') {
      revealOrder++;
      continue;
    }

    // Speaker notes (blockquote)
    if (trimmed.startsWith('>')) {
      if (!currentSlide) createNewSlide();
      const note = trimmed.slice(1).trim();
      currentSlide!.speakerNotes += (currentSlide!.speakerNotes ? '\n' : '') + note;
      continue;
    }

    // Image placeholder
    const imageMatch = trimmed.match(/^\[image:\s*(.+?)\]$/);
    if (imageMatch) {
      const description = imageMatch[1];
      if (!currentSlide) createNewSlide();
      currentSlide!.imageDescriptions.push(description);
      addElement('image', description, { imageStatus: 'pending' });
      continue;
    }

    // Title (h1)
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      const content = trimmed.slice(2);
      addElement('title', processInlineFormatting(content));
      continue;
    }

    // Heading (h2)
    if (trimmed.startsWith('## ')) {
      const content = trimmed.slice(3);
      addElement('subtitle', processInlineFormatting(content));
      continue;
    }

    // Subtitle (h3)
    if (trimmed.startsWith('### ')) {
      const content = trimmed.slice(4);
      addElement('text', processInlineFormatting(content));
      continue;
    }

    // Regular text (anything else)
    if (trimmed) {
      addElement('text', processInlineFormatting(trimmed));
    }
  }

  // Finalize last slide
  finalizeSlide();

  // Build metadata
  const metadata: DeckMetadata = {
    title: slides[0]?.elements.find((e) => e.type === 'title')?.content,
    totalSlides: slides.length,
    sections,
    imageCount: slides.reduce((acc, s) => acc + s.imageDescriptions.length, 0),
  };

  return { slides, metadata };
}

/**
 * Process inline formatting like `highlight` markers
 */
function processInlineFormatting(text: string): string {
  // Keep backtick markers for highlighting - we'll process them in the renderer
  return text;
}

/**
 * Generate a hash for an image description (for caching)
 */
export function hashDescription(description: string): string {
  let hash = 0;
  for (let i = 0; i < description.length; i++) {
    const char = description.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Count total reveals in a slide (for navigation)
 */
export function countReveals(slide: Slide): number {
  if (slide.elements.length === 0) return 0;
  return Math.max(...slide.elements.map((e) => e.revealOrder)) + 1;
}

/**
 * Get elements visible at a given reveal step
 */
export function getVisibleElements(slide: Slide, revealStep: number): SlideElement[] {
  return slide.elements.filter((e) => e.revealOrder <= revealStep);
}

/**
 * Convert parsed deck back to markdown (for editing)
 */
export function deckToMarkdown(deck: ParsedDeck): string {
  // This is a simplified version - we primarily work with raw markdown
  return deck.slides
    .map((slide) => {
      const lines: string[] = [];

      if (slide.section) {
        lines.push(`<!-- ${slide.section} -->`);
        lines.push('');
      }

      let lastReveal = 0;
      for (const element of slide.elements) {
        // Add pause markers
        while (element.revealOrder > lastReveal) {
          lines.push('');
          lines.push('**pause**');
          lines.push('');
          lastReveal++;
        }

        switch (element.type) {
          case 'title':
            lines.push(`# ${element.content}`);
            break;
          case 'subtitle':
            lines.push(`## ${element.content}`);
            break;
          case 'text':
            lines.push(`### ${element.content}`);
            break;
          case 'image':
            lines.push(`[image: ${element.content}]`);
            break;
          case 'code':
            lines.push(`\`\`\`${element.metadata?.language || ''}`);
            lines.push(element.content);
            lines.push('```');
            break;
        }
        lines.push('');
      }

      if (slide.speakerNotes) {
        lines.push(`> ${slide.speakerNotes.replace(/\n/g, '\n> ')}`);
        lines.push('');
      }

      return lines.join('\n');
    })
    .join('\n---\n\n');
}
