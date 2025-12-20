// ============================================
// Slide to PPTX - PowerPoint generation using pptxgenjs
// Maps slide elements to native PowerPoint format
// ============================================

import PptxGenJS from 'pptxgenjs';
import { Slide, SlideElement, ListItem } from '../types';
import { ParsedTheme, DEFAULT_THEME } from './theme-parser';
import { ImageCache, getImageFromCache, toDataUrl, createPlaceholderImage } from './image-utils';

// Slide dimensions (inches, 16:9)
const SLIDE_WIDTH = 10;
const SLIDE_HEIGHT = 5.625;

// Margin constants
const MARGIN = 0.5;
const CONTENT_WIDTH = SLIDE_WIDTH - 2 * MARGIN;
const CONTENT_HEIGHT = SLIDE_HEIGHT - 2 * MARGIN;

/**
 * Convert hex color to pptxgenjs format (no #)
 */
function toColor(hex: string): string {
  return hex.replace('#', '').toUpperCase();
}

/**
 * Strip markdown formatting for plain text
 * Removes **bold**, *italic*, `code` markers
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

/**
 * Parse markdown text and return text runs with formatting
 */
function parseTextRuns(
  text: string,
  theme: ParsedTheme,
  baseFontSize: number
): PptxGenJS.TextProps[] {
  const runs: PptxGenJS.TextProps[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(pattern);

  parts.forEach((part) => {
    if (!part) return;

    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push({
        text: part.slice(2, -2),
        options: {
          bold: true,
          fontSize: baseFontSize,
          color: toColor(theme.textPrimary),
        },
      });
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push({
        text: part.slice(1, -1),
        options: {
          italic: true,
          fontSize: baseFontSize,
          color: toColor(theme.textPrimary),
        },
      });
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push({
        text: part.slice(1, -1),
        options: {
          fontFace: 'Courier New',
          fontSize: baseFontSize - 2,
          color: toColor(theme.accent),
        },
      });
    } else {
      runs.push({
        text: part,
        options: {
          fontSize: baseFontSize,
          color: toColor(theme.textPrimary),
        },
      });
    }
  });

  return runs;
}

/**
 * Add element to slide
 */
function addElement(
  pptSlide: PptxGenJS.Slide,
  element: SlideElement,
  yPosition: number,
  theme: ParsedTheme,
  imageCache: ImageCache,
  isSplit: boolean = false
): number {
  const xPos = isSplit ? SLIDE_WIDTH * 0.42 : MARGIN;
  const contentW = isSplit ? SLIDE_WIDTH * 0.55 : CONTENT_WIDTH;

  switch (element.type) {
    case 'title': {
      const runs = parseTextRuns(element.content, theme, 36);
      pptSlide.addText(runs, {
        x: xPos,
        y: yPosition,
        w: contentW,
        h: 0.8,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
        bold: true,
      });
      return yPosition + 0.9;
    }

    case 'subtitle': {
      const runs = parseTextRuns(element.content, theme, 28);
      pptSlide.addText(runs, {
        x: xPos,
        y: yPosition,
        w: contentW,
        h: 0.6,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
        bold: true,
      });
      return yPosition + 0.7;
    }

    case 'text': {
      const runs = parseTextRuns(element.content, theme, 20);
      pptSlide.addText(runs, {
        x: xPos,
        y: yPosition,
        w: contentW,
        h: 0.5,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
      });
      return yPosition + 0.55;
    }

    case 'body': {
      const runs = parseTextRuns(element.content, theme, 16);
      pptSlide.addText(runs, {
        x: xPos,
        y: yPosition,
        w: contentW,
        h: 0.4,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial',
        color: toColor(theme.textSecondary),
      });
      return yPosition + 0.45;
    }

    case 'quote': {
      const quoteText = stripMarkdown(element.content);
      pptSlide.addText(quoteText, {
        x: xPos + 0.3,
        y: yPosition,
        w: contentW - 0.3,
        h: 0.5,
        align: 'left',
        valign: 'middle',
        fontFace: 'Arial',
        italic: true,
        fontSize: 18,
        color: toColor(theme.textSecondary),
      });
      // Add quote bar
      pptSlide.addShape('rect', {
        x: xPos,
        y: yPosition,
        w: 0.05,
        h: 0.5,
        fill: { color: toColor(theme.accent) },
        line: { color: toColor(theme.accent) },
      });
      return yPosition + 0.6;
    }

    case 'code': {
      // Estimate height based on line count
      const lines = element.content.split('\n').length;
      const codeHeight = Math.max(0.5, lines * 0.2);

      pptSlide.addText(element.content, {
        x: xPos,
        y: yPosition,
        w: contentW,
        h: codeHeight,
        align: 'left',
        fontFace: 'Courier New',
        fontSize: 12,
        color: toColor(theme.textPrimary),
        fill: { color: toColor(theme.bgSecondary) },
        margin: 10,
      });
      return yPosition + codeHeight + 0.1;
    }

    case 'image': {
      const cachedImage = getImageFromCache(imageCache, element.content);

      if (cachedImage) {
        // Use actual image
        const dataUrl = toDataUrl(cachedImage);
        const imgWidth = isSplit ? 3.5 : Math.min(contentW, 6);
        const imgHeight = imgWidth * 0.5625; // 16:9 ratio

        if (isSplit) {
          // For split layout, image is positioned separately
          pptSlide.addImage({
            data: dataUrl,
            x: MARGIN,
            y: (SLIDE_HEIGHT - imgHeight) / 2,
            w: SLIDE_WIDTH * 0.38,
            h: (SLIDE_WIDTH * 0.38) * 0.5625,
          });
        } else {
          pptSlide.addImage({
            data: dataUrl,
            x: (SLIDE_WIDTH - imgWidth) / 2,
            y: yPosition,
            w: imgWidth,
            h: imgHeight,
          });
        }
        return yPosition + (isSplit ? 0 : imgHeight + 0.2);
      } else {
        // Placeholder for missing image
        const placeholder = createPlaceholderImage(element.content, theme.bgSecondary, theme.textSecondary);
        const dataUrl = toDataUrl(placeholder);
        const imgWidth = isSplit ? 3.5 : 5;
        const imgHeight = imgWidth * 0.5625;

        pptSlide.addImage({
          data: dataUrl,
          x: isSplit ? MARGIN : (SLIDE_WIDTH - imgWidth) / 2,
          y: isSplit ? (SLIDE_HEIGHT - imgHeight) / 2 : yPosition,
          w: imgWidth,
          h: imgHeight,
        });
        return yPosition + (isSplit ? 0 : imgHeight + 0.2);
      }
    }

    case 'list': {
      const items = element.metadata?.listItems || [];
      const isOrdered = element.metadata?.listType === 'ordered';

      // Grid layout
      if (element.metadata?.isGrid && element.metadata?.gridItems) {
        const gridItems = element.metadata.gridItems;
        const cols = Math.min(gridItems.length, 4);
        const itemWidth = contentW / cols - 0.2;
        let maxHeight = 0;

        gridItems.forEach((gridItem, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const itemX = xPos + col * (itemWidth + 0.2);
          const itemY = yPosition + row * 1.2;

          // Card background
          pptSlide.addShape('rect', {
            x: itemX,
            y: itemY,
            w: itemWidth,
            h: 1,
            fill: { color: toColor(theme.bgSecondary) },
            line: { color: toColor(theme.border), width: 0.5 },
          });

          // Grid item content
          let textY = itemY + 0.15;
          gridItem.rows.forEach((gridRow) => {
            if (gridRow.type === 'text') {
              const fontSize = gridRow.level === 'h1' ? 16 : gridRow.level === 'h2' ? 14 : 12;
              pptSlide.addText(gridRow.content, {
                x: itemX + 0.1,
                y: textY,
                w: itemWidth - 0.2,
                h: 0.3,
                align: 'center',
                fontSize,
                color: toColor(theme.textPrimary),
              });
              textY += 0.3;
            } else if (gridRow.type === 'icon') {
              pptSlide.addText('●', {
                x: itemX,
                y: textY,
                w: itemWidth,
                h: 0.3,
                align: 'center',
                fontSize: 24,
                color: toColor(theme.accent),
              });
              textY += 0.35;
            }
          });

          maxHeight = Math.max(maxHeight, (Math.floor(idx / cols) + 1) * 1.2);
        });

        return yPosition + maxHeight + 0.2;
      }

      // Regular list
      let listY = yPosition;
      items.forEach((item: ListItem, idx: number) => {
        const fontSize = item.style === 'title' || item.style === 'h1' ? 20 : item.style === 'h2' ? 18 : 16;
        const bullet = isOrdered ? `${idx + 1}. ` : '• ';

        pptSlide.addText(bullet + stripMarkdown(item.content), {
          x: xPos + 0.2,
          y: listY,
          w: contentW - 0.2,
          h: 0.35,
          align: 'left',
          fontSize,
          color: toColor(theme.textPrimary),
          bullet: false, // We're adding our own bullets
        });
        listY += 0.4;
      });
      return listY + 0.1;
    }

    case 'spacer':
      return yPosition + (element.metadata?.spaceMultiplier || 1) * 0.3;

    case 'highlight': {
      pptSlide.addText(stripMarkdown(element.content), {
        x: xPos,
        y: yPosition,
        w: contentW,
        h: 0.5,
        align: 'center',
        fontSize: 18,
        color: toColor(theme.textPrimary),
        fill: { color: toColor(theme.accent), transparency: 70 },
        margin: 10,
      });
      return yPosition + 0.6;
    }

    default:
      return yPosition;
  }
}

/**
 * Render a complete slide
 */
function renderSlide(
  pres: PptxGenJS,
  slide: Slide,
  index: number,
  theme: ParsedTheme,
  imageCache: ImageCache
): void {
  const pptSlide = pres.addSlide();

  // Set background
  pptSlide.background = { color: toColor(theme.bgPrimary) };

  // Filter out pause elements
  const elements = slide.elements.filter((e) => e.type !== 'pause');

  // Section slide styling
  if (slide.isSection) {
    pptSlide.background = { color: toColor(theme.bgSecondary) };

    // Render elements centered vertically
    let yPos = (SLIDE_HEIGHT - elements.length * 0.8) / 2;
    elements.forEach((el) => {
      yPos = addElement(pptSlide, el, yPos, theme, imageCache);
    });

    // Slide number
    pptSlide.addText(String(index + 1), {
      x: SLIDE_WIDTH - 0.5,
      y: SLIDE_HEIGHT - 0.4,
      w: 0.3,
      h: 0.25,
      align: 'right',
      fontSize: 10,
      color: toColor(theme.textSecondary),
      fontFace: 'Courier New',
    });

    return;
  }

  // Split layout
  if (slide.imagePosition) {
    const imageElement = elements.find((e) => e.type === 'image');
    const contentElements = elements.filter((e) => e.type !== 'image');

    // Add image first (positioned on left side for 'left', right for 'right')
    if (imageElement) {
      const cachedImage = getImageFromCache(imageCache, imageElement.content);
      const imgWidth = SLIDE_WIDTH * 0.38;
      const imgHeight = imgWidth * 0.5625;
      const imgX = slide.imagePosition === 'left' ? MARGIN : SLIDE_WIDTH - imgWidth - MARGIN;

      if (cachedImage) {
        pptSlide.addImage({
          data: toDataUrl(cachedImage),
          x: imgX,
          y: (SLIDE_HEIGHT - imgHeight) / 2,
          w: imgWidth,
          h: imgHeight,
        });
      } else {
        const placeholder = createPlaceholderImage(imageElement.content, theme.bgSecondary, theme.textSecondary);
        pptSlide.addImage({
          data: toDataUrl(placeholder),
          x: imgX,
          y: (SLIDE_HEIGHT - imgHeight) / 2,
          w: imgWidth,
          h: imgHeight,
        });
      }
    }

    // Content on the opposite side
    const contentX = slide.imagePosition === 'left' ? SLIDE_WIDTH * 0.42 : MARGIN;
    let yPos = MARGIN + 0.5;
    contentElements.forEach((el) => {
      yPos = addElement(pptSlide, el, yPos, theme, imageCache, true);
    });

    // Footer and slide number
    if (slide.footer) {
      pptSlide.addText(slide.footer, {
        x: MARGIN,
        y: SLIDE_HEIGHT - 0.4,
        w: SLIDE_WIDTH - MARGIN * 2 - 0.5,
        h: 0.25,
        align: 'center',
        fontSize: 10,
        color: toColor(theme.textSecondary),
      });
    }

    pptSlide.addText(String(index + 1), {
      x: SLIDE_WIDTH - 0.5,
      y: SLIDE_HEIGHT - 0.4,
      w: 0.3,
      h: 0.25,
      align: 'right',
      fontSize: 10,
      color: toColor(theme.textSecondary),
      fontFace: 'Courier New',
    });

    return;
  }

  // Standard layout - calculate starting Y based on vertical alignment
  let yPos: number;
  if (slide.alignment?.vertical === 'top') {
    yPos = MARGIN;
  } else if (slide.alignment?.vertical === 'bottom') {
    // Estimate content height and position from bottom
    const estHeight = elements.length * 0.6;
    yPos = SLIDE_HEIGHT - MARGIN - estHeight;
  } else {
    // Center
    const estHeight = elements.length * 0.6;
    yPos = (SLIDE_HEIGHT - estHeight) / 2;
  }

  // Render elements
  elements.forEach((el) => {
    yPos = addElement(pptSlide, el, yPos, theme, imageCache);
  });

  // Footer
  if (slide.footer) {
    pptSlide.addText(slide.footer, {
      x: MARGIN,
      y: SLIDE_HEIGHT - 0.4,
      w: SLIDE_WIDTH - MARGIN * 2 - 0.5,
      h: 0.25,
      align: 'center',
      fontSize: 10,
      color: toColor(theme.textSecondary),
    });
  }

  // Slide number
  pptSlide.addText(String(index + 1), {
    x: SLIDE_WIDTH - 0.5,
    y: SLIDE_HEIGHT - 0.4,
    w: 0.3,
    h: 0.25,
    align: 'right',
    fontSize: 10,
    color: toColor(theme.textSecondary),
    fontFace: 'Courier New',
  });
}

/**
 * Create a complete PPTX presentation
 * Returns the pptxgenjs instance for further manipulation or export
 */
export function createPptxPresentation(
  slides: Slide[],
  title: string,
  theme: ParsedTheme = DEFAULT_THEME,
  imageCache: ImageCache = new Map()
): PptxGenJS {
  const pres = new PptxGenJS();

  // Set presentation properties
  pres.title = title;
  pres.layout = 'LAYOUT_16x9';

  // Set default font
  pres.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: toColor(theme.bgPrimary) },
    slideNumber: { x: 0.3, y: '95%', color: toColor(theme.textSecondary), fontSize: 10 },
  });

  // Render each slide
  slides.forEach((slide, index) => {
    renderSlide(pres, slide, index, theme, imageCache);
  });

  return pres;
}

/**
 * Generate PPTX as ArrayBuffer
 */
export async function generatePptxBuffer(
  slides: Slide[],
  title: string,
  theme: ParsedTheme = DEFAULT_THEME,
  imageCache: ImageCache = new Map()
): Promise<ArrayBuffer> {
  const pres = createPptxPresentation(slides, title, theme, imageCache);
  // Use write method with arraybuffer output type
  const buffer = await pres.write({ outputType: 'arraybuffer' });
  return buffer as ArrayBuffer;
}
