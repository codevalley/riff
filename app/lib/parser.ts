// ============================================
// VIBE SLIDES - Markdown Parser
// ============================================
// Parses the custom slide format into structured data

import yaml from 'js-yaml';
import { Slide, SlideElement, ParsedDeck, DeckMetadata, TextEffect, BackgroundEffect, BackgroundEffectType, BackgroundPosition, BackgroundColor, ImageManifest, ImageManifestEntry, ImageSlot } from './types';

// ============================================
// Frontmatter Extraction
// ============================================

interface Frontmatter {
  images?: ImageManifest;
}

/**
 * Extract YAML frontmatter from markdown content
 * Handles multiple blocks by merging them, cleans up orphaned blocks
 */
export function extractFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  // Find ALL yaml image blocks in the content and merge them
  const yamlBlockRegex = /\n---\n(images:[\s\S]*?)\n---/g;
  const mergedImages: ImageManifest = {};
  let match;

  // Also check for TOP frontmatter (legacy)
  const topMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (topMatch) {
    try {
      const topFrontmatter = yaml.load(topMatch[1]) as Frontmatter || {};
      if (topFrontmatter.images) {
        Object.assign(mergedImages, topFrontmatter.images);
      }
    } catch {
      // Invalid YAML, skip
    }
  }

  // Find all bottom/inline yaml blocks and merge
  while ((match = yamlBlockRegex.exec(content)) !== null) {
    try {
      const blockFrontmatter = yaml.load(match[1]) as Frontmatter || {};
      if (blockFrontmatter.images) {
        // Merge - later blocks override earlier ones for same key
        Object.assign(mergedImages, blockFrontmatter.images);
      }
    } catch {
      // Invalid YAML block, skip
    }
  }

  // Remove all yaml blocks from content to get clean body
  let body = content;

  // Remove top frontmatter if present
  body = body.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Remove all bottom/inline yaml blocks
  body = body.replace(/\n---\nimages:[\s\S]*?\n---/g, '');

  // Also remove empty slide separators that might be left (--- followed by ---)
  body = body.replace(/\n---\s*\n---/g, '\n---');

  // Trim trailing whitespace/newlines
  body = body.trimEnd();

  const frontmatter: Frontmatter = Object.keys(mergedImages).length > 0
    ? { images: mergedImages }
    : {};

  return { frontmatter, body };
}

/**
 * Serialize frontmatter to YAML string (for appending at bottom of document)
 */
function serializeFrontmatter(frontmatter: Frontmatter): string {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return '';
  }
  // Format: newline + --- + yaml + --- (at end of document)
  return `\n---\n${yaml.dump(frontmatter, { lineWidth: -1 })}---`;
}

/**
 * Update an image URL in the manifest and return new markdown content
 */
export function updateImageInManifest(
  content: string,
  description: string,
  slot: ImageSlot,
  url: string,
  setActive: boolean = true
): string {
  const { frontmatter, body } = extractFrontmatter(content);

  // Initialize images if not present
  frontmatter.images = frontmatter.images || {};

  // Initialize entry for this description if not present
  if (!frontmatter.images[description]) {
    frontmatter.images[description] = { active: slot };
  }

  // Update the slot URL
  frontmatter.images[description][slot] = url;

  // Update active slot if requested
  if (setActive) {
    frontmatter.images[description].active = slot;
  }

  return body + serializeFrontmatter(frontmatter);
}

/**
 * Update only the active slot for an image (when switching variants)
 */
export function setActiveImageSlot(
  content: string,
  description: string,
  slot: ImageSlot
): string {
  const { frontmatter, body } = extractFrontmatter(content);

  if (frontmatter.images?.[description]) {
    frontmatter.images[description].active = slot;
  }

  return body + serializeFrontmatter(frontmatter);
}

/**
 * Normalize frontmatter position to bottom of document
 * Use this to migrate legacy top-frontmatter to bottom
 */
export function normalizeFrontmatter(content: string): string {
  const { frontmatter, body } = extractFrontmatter(content);

  // If no frontmatter, return as-is
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return body;
  }

  // Re-serialize with frontmatter at bottom
  return body + serializeFrontmatter(frontmatter);
}

/**
 * Remove an image from the manifest
 */
export function removeImageFromManifest(
  content: string,
  description: string
): string {
  const { frontmatter, body } = extractFrontmatter(content);

  if (frontmatter.images?.[description]) {
    delete frontmatter.images[description];
  }

  // Clean up empty images object
  if (frontmatter.images && Object.keys(frontmatter.images).length === 0) {
    delete frontmatter.images;
  }

  return body + serializeFrontmatter(frontmatter);
}

// Valid text effects that can be applied via [effect] syntax
const VALID_EFFECTS: TextEffect[] = ['anvil', 'typewriter', 'glow', 'shake'];

// Valid background effect types
const VALID_BG_TYPES: BackgroundEffectType[] = ['glow', 'grid', 'hatch', 'dashed'];
const VALID_BG_POSITIONS: BackgroundPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
const VALID_BG_COLORS: BackgroundColor[] = ['amber', 'blue', 'purple', 'rose', 'emerald', 'cyan', 'orange', 'pink', 'accent'];

/**
 * Parse background effect from [bg:effect-position] or [bg:effect-position-color]
 * Examples: [bg:glow-bottom-left], [bg:grid-center], [bg:hatch-top-right-amber]
 * Position can be: top-left, top-right, bottom-left, bottom-right, center
 */
function parseBackgroundEffect(value: string): BackgroundEffect | null {
  const lower = value.toLowerCase();

  // Extract the effect type (first part before first -)
  const firstDash = lower.indexOf('-');
  if (firstDash === -1) return null;

  const type = lower.substring(0, firstDash);
  if (!VALID_BG_TYPES.includes(type as BackgroundEffectType)) return null;

  const rest = lower.substring(firstDash + 1);

  // Try to match position (could be 'center' or 'top-left' etc)
  let position: BackgroundPosition | null = null;
  let color: BackgroundColor | undefined = undefined;

  for (const pos of VALID_BG_POSITIONS) {
    if (rest === pos) {
      // Just position, no color: grid-center, grid-top-left
      position = pos;
      break;
    } else if (rest.startsWith(pos + '-')) {
      // Position + color: grid-top-left-amber
      position = pos;
      const colorPart = rest.substring(pos.length + 1);
      if (VALID_BG_COLORS.includes(colorPart as BackgroundColor)) {
        color = colorPart as BackgroundColor;
      } else {
        return null; // Invalid color
      }
      break;
    }
  }

  if (!position) return null;

  return {
    type: type as BackgroundEffectType,
    position: position,
    color: color || 'accent',
  };
}

/**
 * Extract effect decorator from content, e.g. "Title [anvil]" -> { content: "Title", effect: "anvil" }
 */
function extractEffect(content: string): { content: string; effect?: TextEffect } {
  const effectMatch = content.match(/\s*\[(\w+)\]\s*$/);
  if (effectMatch) {
    const effectName = effectMatch[1].toLowerCase() as TextEffect;
    if (VALID_EFFECTS.includes(effectName)) {
      return {
        content: content.replace(effectMatch[0], '').trim(),
        effect: effectName,
      };
    }
  }
  return { content };
}

/**
 * Parse a slide markdown document into structured slides
 *
 * Format:
 * ---                          # Slide separator
 * # Title                      # Main headline (h1)
 * ## Heading                   # Secondary heading (h2)
 * ### Subtitle                 # Tertiary text (h3)
 * Regular text                 # Body text (no prefix)
 * - Item or * Item             # Unordered list
 * 1. Item, 2. Item             # Ordered list
 * [image: description]         # Image placeholder
 * **pause**                    # Animation/transition beat
 * > Speaker note               # Speaker notes (not shown)
 * `keyword`                    # Highlighted word (inline)
 * ```lang\ncode\n```          # Code block
 * <!-- comment -->             # Section markers (metadata)
 * [section]                    # Section header slide (special styling)
 */

export function parseSlideMarkdown(markdown: string): ParsedDeck {
  // Extract frontmatter first
  const { frontmatter, body } = extractFrontmatter(markdown);
  const imageManifest: ImageManifest = frontmatter.images || {};

  const lines = body.split('\n');
  const slides: Slide[] = [];
  const sections: string[] = [];

  let currentSlide: Slide | null = null;
  let currentSection: string | undefined;
  let revealOrder = 0;
  let slideId = 0;
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLang = '';

  // List tracking
  let inList = false;
  let listType: 'ordered' | 'unordered' | null = null;
  let listItems: string[] = [];
  let listRevealOrder = 0;

  const finalizeSlide = () => {
    finalizeList(); // Finalize any pending list before slide ends
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

  const finalizeList = () => {
    if (inList && listItems.length > 0) {
      if (!currentSlide) createNewSlide();
      currentSlide!.elements.push({
        type: 'list',
        content: listItems.join('\n'),
        revealOrder: listRevealOrder,
        metadata: {
          listType: listType!,
          listItems: [...listItems],
        },
      });
      inList = false;
      listType = null;
      listItems = [];
    }
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

    // Background effect [bg:effect-position] or [bg:effect-position-color]
    const bgMatch = trimmed.match(/^\[bg:(.+)\]$/i);
    if (bgMatch) {
      const bg = parseBackgroundEffect(bgMatch[1]);
      if (bg) {
        if (!currentSlide) createNewSlide();
        currentSlide!.background = bg;
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
      finalizeList(); // End any pending list
      const description = imageMatch[1];
      if (!currentSlide) createNewSlide();
      currentSlide!.imageDescriptions.push(description);
      addElement('image', description, { imageStatus: 'pending' });
      continue;
    }

    // Title (h1) - supports [effect] decorator e.g. "# Title [anvil]"
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      finalizeList(); // End any pending list
      const rawContent = trimmed.slice(2);
      const { content, effect } = extractEffect(rawContent);
      addElement('title', processInlineFormatting(content), effect ? { effect } : undefined);
      continue;
    }

    // Heading (h2) - supports [effect] decorator
    if (trimmed.startsWith('## ')) {
      finalizeList(); // End any pending list
      const rawContent = trimmed.slice(3);
      const { content, effect } = extractEffect(rawContent);
      addElement('subtitle', processInlineFormatting(content), effect ? { effect } : undefined);
      continue;
    }

    // Subtitle (h3) - supports [effect] decorator
    if (trimmed.startsWith('### ')) {
      finalizeList(); // End any pending list
      const rawContent = trimmed.slice(4);
      const { content, effect } = extractEffect(rawContent);
      addElement('text', processInlineFormatting(content), effect ? { effect } : undefined);
      continue;
    }

    // Ordered list item (1. item, 2. item, etc.)
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      const itemContent = orderedMatch[1];
      if (!inList) {
        inList = true;
        listType = 'ordered';
        listRevealOrder = revealOrder;
        listItems = [];
      } else if (listType !== 'ordered') {
        // Different list type, finalize previous list
        finalizeList();
        inList = true;
        listType = 'ordered';
        listRevealOrder = revealOrder;
        listItems = [];
      }
      listItems.push(processInlineFormatting(itemContent));
      continue;
    }

    // Unordered list item (- item or * item)
    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      const itemContent = unorderedMatch[1];
      if (!inList) {
        inList = true;
        listType = 'unordered';
        listRevealOrder = revealOrder;
        listItems = [];
      } else if (listType !== 'unordered') {
        // Different list type, finalize previous list
        finalizeList();
        inList = true;
        listType = 'unordered';
        listRevealOrder = revealOrder;
        listItems = [];
      }
      listItems.push(processInlineFormatting(itemContent));
      continue;
    }

    // If we get here and we're in a list, finalize it
    if (inList) {
      finalizeList();
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

  return { slides, metadata, imageManifest };
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

      // Add [section] marker if this is a section slide
      if (slide.isSection) {
        lines.push('[section]');
        lines.push('');
      }

      // Add background effect marker
      if (slide.background) {
        const { type, position, color } = slide.background;
        const bgValue = color && color !== 'accent' ? `${type}-${position}-${color}` : `${type}-${position}`;
        lines.push(`[bg:${bgValue}]`);
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

        // Helper to append effect decorator if present
        const withEffect = (text: string, effect?: string) =>
          effect ? `${text} [${effect}]` : text;

        switch (element.type) {
          case 'title':
            lines.push(withEffect(`# ${element.content}`, element.metadata?.effect));
            break;
          case 'subtitle':
            lines.push(withEffect(`## ${element.content}`, element.metadata?.effect));
            break;
          case 'text':
            lines.push(withEffect(`### ${element.content}`, element.metadata?.effect));
            break;
          case 'image':
            lines.push(`[image: ${element.content}]`);
            break;
          case 'code':
            lines.push(`\`\`\`${element.metadata?.language || ''}`);
            lines.push(element.content);
            lines.push('```');
            break;
          case 'list':
            const listItems = element.metadata?.listItems || [];
            const isOrdered = element.metadata?.listType === 'ordered';
            listItems.forEach((item, idx) => {
              if (isOrdered) {
                lines.push(`${idx + 1}. ${item}`);
              } else {
                lines.push(`- ${item}`);
              }
            });
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
