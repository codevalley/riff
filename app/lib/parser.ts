// ============================================
// VIBE SLIDES - Markdown Parser
// ============================================
// Parses the custom slide format into structured data

import yaml from 'js-yaml';
import {
  Slide,
  SlideElement,
  ParsedDeck,
  DeckMetadata,
  TextEffect,
  BackgroundEffect,
  BackgroundEffectType,
  BackgroundPosition,
  BackgroundColor,
  ImageManifest,
  ImageSlot,
  // Layout v2 types
  HorizontalAlign,
  VerticalAlign,
  SlideAlignment,
  ImagePosition,
  GridItem,
  GridItemRow,
  ListItem,
  ListItemStyle,
} from './types';

// ============================================
// Frontmatter Extraction
// ============================================

interface Frontmatter {
  v?: number;  // Version marker (2 = v2 format)
  images?: ImageManifest;
}

/**
 * Extract YAML frontmatter from markdown content
 * Handles multiple blocks by merging them, cleans up orphaned blocks
 * Preserves both v (version) and images metadata
 */
export function extractFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const mergedImages: ImageManifest = {};
  let version: number | undefined;

  // Helper to extract frontmatter fields from a YAML block
  const extractFields = (yamlContent: string) => {
    try {
      const parsed = yaml.load(yamlContent) as Frontmatter || {};
      if (parsed.v) {
        version = parsed.v;
      }
      if (parsed.images) {
        Object.assign(mergedImages, parsed.images);
      }
    } catch {
      // Invalid YAML, skip
    }
  };

  // Check for TOP frontmatter (legacy position)
  const topMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (topMatch) {
    extractFields(topMatch[1]);
  }

  // Find all END frontmatter blocks (modern position)
  // Match any yaml block at the end that contains v: or images:
  const endBlockRegex = /\n---\n((?:v:\s*\d+\n?|images:[\s\S]*?)+)\n?---/g;
  let match;
  while ((match = endBlockRegex.exec(content)) !== null) {
    extractFields(match[1]);
  }

  // Also check for standalone v: 2 block without closing ---
  const standaloneV2Match = content.match(/\n---\n(v:\s*2)\s*$/);
  if (standaloneV2Match) {
    extractFields(standaloneV2Match[1]);
  }

  // Remove all yaml blocks from content to get clean body
  let body = content;

  // Remove top frontmatter if present
  body = body.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Remove all end frontmatter blocks (with v: and/or images:)
  body = body.replace(/\n---\n(?:v:\s*\d+\n?|images:[\s\S]*?)+\n?---/g, '');

  // Remove standalone v: 2 block at end (no closing ---)
  body = body.replace(/\n---\nv:\s*2\s*$/, '');

  // Also remove empty slide separators that might be left (--- followed by ---)
  body = body.replace(/\n---\s*\n---/g, '\n---');

  // Trim trailing whitespace/newlines
  body = body.trimEnd();

  // Build frontmatter object
  const frontmatter: Frontmatter = {};
  if (version) {
    frontmatter.v = version;
  }
  if (Object.keys(mergedImages).length > 0) {
    frontmatter.images = mergedImages;
  }

  return { frontmatter, body };
}

/**
 * Serialize frontmatter to YAML string (for appending at bottom of document)
 * Always outputs v: 2 first (if present), then images
 */
function serializeFrontmatter(frontmatter: Frontmatter): string {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return '';
  }

  // Build YAML manually to control order: v first, then images
  let yamlContent = '';

  if (frontmatter.v) {
    yamlContent += `v: ${frontmatter.v}\n`;
  }

  if (frontmatter.images && Object.keys(frontmatter.images).length > 0) {
    yamlContent += yaml.dump({ images: frontmatter.images }, { lineWidth: -1 });
  }

  if (!yamlContent) {
    return '';
  }

  // Format: newline + --- + yaml + --- (at end of document)
  return `\n---\n${yamlContent}---`;
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

  // Always set v: 2 when adding images (marks as v2 format)
  frontmatter.v = 2;

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

  // Preserve v: 2 if present, or set it
  if (!frontmatter.v) {
    frontmatter.v = 2;
  }

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

// Layout v2: Alignment values
const VALID_H_ALIGN: HorizontalAlign[] = ['left', 'center', 'right'];
const VALID_V_ALIGN: VerticalAlign[] = ['top', 'center', 'bottom'];
const VALID_IMAGE_POSITIONS: ImagePosition[] = ['left', 'right', 'top', 'bottom'];

/**
 * Parse alignment marker from [horizontal, vertical]
 * Examples: [center, center], [left, top], [right, bottom]
 */
function parseAlignment(value: string): SlideAlignment | null {
  const parts = value.split(',').map(s => s.trim().toLowerCase());
  if (parts.length !== 2) return null;

  const [h, v] = parts;
  if (!VALID_H_ALIGN.includes(h as HorizontalAlign)) return null;
  if (!VALID_V_ALIGN.includes(v as VerticalAlign)) return null;

  return {
    horizontal: h as HorizontalAlign,
    vertical: v as VerticalAlign,
  };
}

/**
 * Parse image with optional position from [image: description, position]
 * Examples: [image: mountain landscape], [image: product screenshot, right]
 */
function parseImageWithPosition(value: string): { description: string; position?: ImagePosition } {
  const lastComma = value.lastIndexOf(',');
  if (lastComma === -1) {
    return { description: value.trim() };
  }

  const afterComma = value.slice(lastComma + 1).trim().toLowerCase();
  if (VALID_IMAGE_POSITIONS.includes(afterComma as ImagePosition)) {
    return {
      description: value.slice(0, lastComma).trim(),
      position: afterComma as ImagePosition,
    };
  }

  // Not a position, treat whole thing as description
  return { description: value.trim() };
}

/**
 * Parse a single line in a grid item
 * Can be: [icon: name], [image: desc], # h1, ## h2, ### h3, or body text
 */
function parseGridLine(line: string): GridItemRow {
  const trimmed = line.trim();

  // Check for icon
  const iconMatch = trimmed.match(/^\[icon:\s*(.+?)\]$/i);
  if (iconMatch) {
    return { type: 'icon', value: iconMatch[1].trim() };
  }

  // Check for image
  const imageMatch = trimmed.match(/^\[image:\s*(.+?)\]$/i);
  if (imageMatch) {
    return { type: 'image', value: imageMatch[1].trim() };
  }

  // Check for headings
  if (trimmed.startsWith('### ')) {
    return { type: 'text', level: 'h3', content: processInlineFormatting(trimmed.slice(4)) };
  }
  if (trimmed.startsWith('## ')) {
    return { type: 'text', level: 'h2', content: processInlineFormatting(trimmed.slice(3)) };
  }
  if (trimmed.startsWith('# ')) {
    return { type: 'text', level: 'h1', content: processInlineFormatting(trimmed.slice(2)) };
  }

  // Default to body text
  return { type: 'text', level: 'body', content: processInlineFormatting(trimmed) };
}

/**
 * Parse a raw grid item (first line + continuation lines) into structured GridItem
 * All rows stack vertically - icons/images can appear anywhere
 */
function parseGridItem(rawLines: string[]): GridItem {
  const item: GridItem = { rows: [] };

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    item.rows.push(parseGridLine(trimmed));
  }

  return item;
}

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
  let listItems: ListItem[] = [];
  let listRevealOrder = 0;

  // Helper: parse heading style from list item content
  // - # Title text → { content: 'Title text', style: 'title' }
  // - ## H1 text → { content: 'H1 text', style: 'h1' }
  // - ### H2 text → { content: 'H2 text', style: 'h2' }
  // - Regular text → { content: 'Regular text', style: 'body' }
  const parseListItemStyle = (content: string): ListItem => {
    const trimmed = content.trim();
    if (trimmed.startsWith('### ')) {
      return { content: processInlineFormatting(trimmed.slice(4)), style: 'h2' };
    }
    if (trimmed.startsWith('## ')) {
      return { content: processInlineFormatting(trimmed.slice(3)), style: 'h1' };
    }
    if (trimmed.startsWith('# ')) {
      return { content: processInlineFormatting(trimmed.slice(2)), style: 'title' };
    }
    return { content: processInlineFormatting(trimmed), style: 'body' };
  };

  // Grid tracking - NEW FORMAT:
  // [grid] + bullets = grid items, **pause** separates reveal order
  let inGridMode = false;           // Currently collecting grid boxes
  let currentGridBox: string[] = []; // Current box's rows
  let currentGridBoxRevealOrder = 0; // Reveal order for current box
  let allGridBoxes: { lines: string[], revealOrder: number }[] = []; // All boxes with their reveal orders

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

  // Helper to check if we should add a spacer (for empty lines)
  const shouldAddSpacer = (): boolean => {
    if (!currentSlide || currentSlide.elements.length === 0) return false;
    if (inList || inCodeBlock || inGridMode) return false;
    const lastEl = currentSlide.elements[currentSlide.elements.length - 1];
    return lastEl?.type !== 'spacer';
  };

  // Finalize current grid box (called on empty line, new bullet, or pause)
  const finalizeCurrentGridBox = () => {
    if (currentGridBox.length > 0) {
      allGridBoxes.push({ lines: [...currentGridBox], revealOrder: currentGridBoxRevealOrder });
      currentGridBox = [];
    }
  };

  // Finalize all grid boxes and add as element
  const finalizeGrid = () => {
    finalizeCurrentGridBox();
    if (allGridBoxes.length > 0) {
      if (!currentSlide) createNewSlide();
      // Map each box to a GridItem, preserving its individual revealOrder
      const gridItems = allGridBoxes.map(box => {
        const item = parseGridItem(box.lines);
        item.revealOrder = box.revealOrder;
        return item;
      });
      currentSlide!.elements.push({
        type: 'list',
        content: '',
        revealOrder: 0, // Grid container always visible, items control their own reveal
        metadata: {
          listType: 'unordered',
          listItems: [],
          isGrid: true,
          gridItems: gridItems,
        },
      });
      allGridBoxes = [];
    }
    inGridMode = false;
  };

  const finalizeList = () => {
    // Finalize grid if in grid mode
    if (inGridMode) {
      finalizeGrid();
    }

    if (inList && listItems.length > 0) {
      if (!currentSlide) createNewSlide();
      currentSlide!.elements.push({
        type: 'list',
        content: listItems.join('\n'),
        revealOrder: listRevealOrder,
        metadata: {
          listType: listType!,
          listItems: [...listItems],
          isGrid: false,
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

    // Empty lines
    if (!trimmed) {
      // In grid mode: empty line finalizes current box but stays in grid mode
      if (inGridMode) {
        finalizeCurrentGridBox();
      } else if (shouldAddSpacer()) {
        addElement('spacer', '');
      }
      continue;
    }

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

    // Alignment marker [horizontal, vertical] e.g. [center, top]
    const alignMatch = trimmed.match(/^\[(\w+)\s*,\s*(\w+)\]$/);
    if (alignMatch) {
      const alignment = parseAlignment(`${alignMatch[1]}, ${alignMatch[2]}`);
      if (alignment) {
        if (!currentSlide) createNewSlide();
        currentSlide!.alignment = alignment;
        continue;
      }
      // If not a valid alignment, fall through to check other patterns
    }

    // Grid marker [grid] - starts a new grid box
    if (trimmed.toLowerCase() === '[grid]') {
      // Finalize any regular list first
      if (inList) {
        finalizeList();
      }
      // Finalize current grid box (if any) and start a new one
      finalizeCurrentGridBox();
      inGridMode = true;
      continue;
    }

    // Grid item: bullet while in grid mode
    // Note: Empty lines are handled earlier (line ~555) and finalize current card
    if (inGridMode) {
      // Bullet = add row to current card (don't finalize!)
      const gridBulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (gridBulletMatch) {
        // If this is the first row of a new card, capture revealOrder
        if (currentGridBox.length === 0) {
          currentGridBoxRevealOrder = revealOrder;
        }
        currentGridBox.push(gridBulletMatch[1]);
        continue;
      }

      // Pause = finalize current card, increment reveal for next card
      if (trimmed === '**pause**') {
        finalizeCurrentGridBox();
        revealOrder++;
        continue;
      }

      // Any other content ends grid mode and gets processed normally
      finalizeGrid();
      // Don't continue - let the line be processed by subsequent handlers
    }

    // Pause marker (outside grid mode)
    if (trimmed === '**pause**') {
      // Finalize any pending list before incrementing reveal order
      // This ensures items before and after pause are in separate list elements
      finalizeList();
      revealOrder++;
      continue;
    }

    // Explicit spacer marker [space] or [space:n]
    const spaceMatch = trimmed.match(/^\[space(?::(\d+))?\]$/i);
    if (spaceMatch) {
      const multiplier = spaceMatch[1] ? parseInt(spaceMatch[1], 10) : 1;
      addElement('spacer', '', { spaceMultiplier: multiplier });
      continue;
    }

    // Speaker notes (blockquote)
    if (trimmed.startsWith('>')) {
      if (!currentSlide) createNewSlide();
      const note = trimmed.slice(1).trim();
      currentSlide!.speakerNotes += (currentSlide!.speakerNotes ? '\n' : '') + note;
      continue;
    }

    // Footer: $<footer content>
    const footerMatch = trimmed.match(/^\$<(.+)>$/);
    if (footerMatch) {
      if (!currentSlide) createNewSlide();
      currentSlide!.footer = processInlineFormatting(footerMatch[1]);
      continue;
    }

    // Image placeholder with optional position: [image: description, position]
    const imageMatch = trimmed.match(/^\[image:\s*(.+?)\]$/);
    if (imageMatch) {
      finalizeList(); // End any pending list
      const { description, position } = parseImageWithPosition(imageMatch[1]);
      if (!currentSlide) createNewSlide();
      currentSlide!.imageDescriptions.push(description);
      // Set image position on slide if specified
      if (position) {
        currentSlide!.imagePosition = position;
      }
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
      listItems.push(parseListItemStyle(itemContent));
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

      listItems.push(parseListItemStyle(itemContent));
      continue;
    }

    // If we get here and we're in a list, finalize it
    if (inList) {
      finalizeList();
    }

    // Regular text (anything else) - body text, smaller than ### headings
    if (trimmed) {
      addElement('body', processInlineFormatting(trimmed));
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

  // Collect all revealOrders, including those from grid items
  const allRevealOrders: number[] = [];

  for (const element of slide.elements) {
    allRevealOrders.push(element.revealOrder);

    // If this is a grid, also check grid items' revealOrders
    if (element.metadata?.isGrid && element.metadata?.gridItems) {
      for (const gridItem of element.metadata.gridItems) {
        if (gridItem.revealOrder !== undefined) {
          allRevealOrders.push(gridItem.revealOrder);
        }
      }
    }
  }

  return Math.max(...allRevealOrders) + 1;
}

/**
 * Get elements visible at a given reveal step
 */
export function getVisibleElements(slide: Slide, revealStep: number): SlideElement[] {
  return slide.elements.filter((e) => e.revealOrder <= revealStep);
}

/**
 * Detect if a deck uses v1 (legacy) format
 * V2 decks have `v: 2` in their frontmatter (at the end of the document)
 * Returns true if deck lacks the v2 marker
 */
export function isLegacyDeck(content: string): boolean {
  // Empty or very short content is not considered legacy (nothing to upgrade)
  if (!content || content.trim().length < 20) {
    return false;
  }

  // Use extractFrontmatter to check for v: 2
  const { frontmatter } = extractFrontmatter(content);

  // If frontmatter has v: 2, it's not legacy
  if (frontmatter.v === 2) {
    return false;
  }

  // No v2 marker found = legacy deck
  return true;
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
            const serializeListItems = element.metadata?.listItems || [];
            const isOrderedList = element.metadata?.listType === 'ordered';
            serializeListItems.forEach((item, idx) => {
              // Handle both old format (string) and new format (ListItem object)
              const content = typeof item === 'string' ? item : item.content;
              const style = typeof item === 'string' ? 'body' : item.style;

              // Prepend heading marker based on style
              let itemText = content;
              if (style === 'title') itemText = `# ${content}`;
              else if (style === 'h1') itemText = `## ${content}`;
              else if (style === 'h2') itemText = `### ${content}`;

              if (isOrderedList) {
                lines.push(`${idx + 1}. ${itemText}`);
              } else {
                lines.push(`- ${itemText}`);
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

      if (slide.footer) {
        lines.push(`$<${slide.footer}>`);
        lines.push('');
      }

      return lines.join('\n');
    })
    .join('\n---\n\n');
}
