// ============================================
// Slide to PDF - React-PDF components for export
// Maps slide elements to PDF-compatible primitives
// ============================================

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { Slide, SlideElement, ListItem } from '../types';
import { ParsedTheme, DEFAULT_THEME } from './theme-parser';
import { ImageCache, getImageFromCache, toDataUrl } from './image-utils';
import { registerThemeFontsAsync } from './font-registry';

// Fallback fonts (built-in PDF fonts)
const FALLBACK_SANS = 'Helvetica';
const FALLBACK_MONO = 'Courier';

// Slide dimensions (16:9 ratio at 72 DPI)
const SLIDE_WIDTH = 720; // 10 inches
const SLIDE_HEIGHT = 405; // 5.625 inches

// Maximum content height (accounting for padding and footer)
const MAX_CONTENT_HEIGHT = 305; // SLIDE_HEIGHT - 2*padding - footer space
const MAX_IMAGE_HEIGHT = 180; // Reduced to prevent overflow

/**
 * Resolved fonts after registration
 */
interface ResolvedFonts {
  display: string;
  body: string;
  mono: string;
}

/**
 * Create dynamic styles based on theme and fonts
 */
function createStyles(theme: ParsedTheme, fonts: ResolvedFonts) {
  return StyleSheet.create({
    page: {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      backgroundColor: theme.bgPrimary,
      padding: 40,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pageSplit: {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      backgroundColor: theme.bgPrimary,
      flexDirection: 'row',
    },
    pageSection: {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      backgroundColor: theme.bgSecondary,
      padding: 60,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      width: '100%',
      maxWidth: 600,
      maxHeight: MAX_CONTENT_HEIGHT,
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
    },
    contentLeft: {
      alignItems: 'flex-start',
    },
    contentRight: {
      alignItems: 'flex-end',
    },
    // Typography - using theme fonts
    title: {
      fontFamily: fonts.display,
      fontSize: 48,
      fontWeight: 700,
      color: theme.textPrimary,
      marginBottom: 16,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: fonts.display,
      fontSize: 32,
      fontWeight: 600,
      color: theme.textPrimary,
      marginBottom: 12,
      textAlign: 'center',
    },
    text: {
      fontFamily: fonts.body,
      fontSize: 24,
      color: theme.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 18,
      color: theme.textSecondary,
      marginBottom: 6,
      textAlign: 'center',
      lineHeight: 1.5,
    },
    // Quote
    quote: {
      fontFamily: fonts.body,
      fontSize: 22,
      fontStyle: 'italic',
      color: theme.textSecondary,
      paddingLeft: 20,
      borderLeft: `3px solid ${theme.accent}`,
      marginVertical: 12,
    },
    // Code
    code: {
      fontFamily: fonts.mono,
      fontSize: 14,
      backgroundColor: theme.bgSecondary,
      color: theme.textPrimary,
      padding: 16,
      borderRadius: 8,
      width: '100%',
      marginVertical: 12,
    },
    // Lists
    listContainer: {
      width: '100%',
      paddingLeft: 24,
      marginVertical: 8,
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    listBullet: {
      fontFamily: fonts.body,
      fontSize: 18,
      color: theme.accent,
      marginRight: 8,
      width: 20,
    },
    listText: {
      fontFamily: fonts.body,
      fontSize: 18,
      color: theme.textPrimary,
      flex: 1,
    },
    listTextH1: {
      fontFamily: fonts.display,
      fontSize: 28,
      fontWeight: 700,
      color: theme.textPrimary,
      flex: 1,
    },
    listTextH2: {
      fontFamily: fonts.display,
      fontSize: 22,
      fontWeight: 600,
      color: theme.textPrimary,
      flex: 1,
    },
    // Images - constrained to prevent page overflow
    imageContainer: {
      width: '100%',
      height: MAX_IMAGE_HEIGHT,
      marginVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      maxWidth: '100%',
      maxHeight: MAX_IMAGE_HEIGHT,
      objectFit: 'contain',
    },
    imageSplit: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    // Split layout
    splitImage: {
      width: '40%',
      height: '100%',
      padding: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    splitContent: {
      width: '60%',
      height: '100%',
      padding: 40,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    // Grid
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 16,
      width: '100%',
      marginVertical: 12,
    },
    gridItem: {
      width: 200,
      padding: 16,
      backgroundColor: theme.bgSecondary,
      borderRadius: 8,
      alignItems: 'center',
    },
    gridItemText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: theme.textPrimary,
      textAlign: 'center',
      marginTop: 8,
    },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 16,
      left: 40,
      right: 40,
      fontFamily: fonts.body,
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    slideNumber: {
      position: 'absolute',
      bottom: 16,
      right: 24,
      fontFamily: fonts.mono,
      fontSize: 10,
      color: theme.textSecondary,
    },
  });
}

/**
 * Parse markdown-style formatting (bold, italic, code)
 * Returns array of Text elements with appropriate styling
 */
function parseFormattedText(text: string, theme: ParsedTheme, fonts: ResolvedFonts): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  // Simple pattern matching for **bold**, *italic*, `code`
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(pattern);

  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      elements.push(
        <Text key={i} style={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </Text>
      );
    } else if (part.startsWith('*') && part.endsWith('*')) {
      elements.push(
        <Text key={i} style={{ fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </Text>
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      elements.push(
        <Text
          key={i}
          style={{
            fontFamily: fonts.mono,
            backgroundColor: theme.bgSecondary,
            paddingHorizontal: 4,
          }}
        >
          {part.slice(1, -1)}
        </Text>
      );
    } else if (part) {
      elements.push(<Text key={i}>{part}</Text>);
    }
  });

  return elements;
}

/**
 * Render a single slide element
 */
function renderElement(
  element: SlideElement,
  styles: ReturnType<typeof createStyles>,
  theme: ParsedTheme,
  fonts: ResolvedFonts,
  imageCache: ImageCache
): React.ReactNode {
  const formattedContent = parseFormattedText(element.content, theme, fonts);

  switch (element.type) {
    case 'title':
      return (
        <Text style={styles.title}>{formattedContent}</Text>
      );

    case 'subtitle':
      return (
        <Text style={styles.subtitle}>{formattedContent}</Text>
      );

    case 'text':
      return (
        <Text style={styles.text}>{formattedContent}</Text>
      );

    case 'body':
      return (
        <Text style={styles.body}>{formattedContent}</Text>
      );

    case 'quote':
      return (
        <View style={styles.quote}>
          <Text>{formattedContent}</Text>
        </View>
      );

    case 'code':
      return (
        <View style={styles.code} wrap={false}>
          <Text style={{ fontFamily: fonts.mono }}>
            {element.content}
          </Text>
        </View>
      );

    case 'image': {
      const cachedImage = getImageFromCache(imageCache, element.content);

      // Only render image if we have valid data
      if (cachedImage) {
        const imageSource = toDataUrl(cachedImage);
        return (
          <View style={styles.imageContainer} wrap={false}>
            <Image src={imageSource} style={styles.image} />
          </View>
        );
      }

      // Fallback: show text placeholder instead of potentially broken image
      const truncatedDesc = element.content.length > 50
        ? element.content.slice(0, 47) + '...'
        : element.content;
      return (
        <View style={{
          ...styles.imageContainer,
          backgroundColor: theme.bgSecondary,
          borderRadius: 8,
          padding: 16,
          height: MAX_IMAGE_HEIGHT,
        }} wrap={false}>
          <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center' }}>
            [Image: {truncatedDesc}]
          </Text>
        </View>
      );
    }

    case 'list': {
      const items = element.metadata?.listItems || [];
      const isOrdered = element.metadata?.listType === 'ordered';

      // Grid layout
      if (element.metadata?.isGrid && element.metadata?.gridItems) {
        return (
          <View style={styles.gridContainer} wrap={false}>
            {element.metadata.gridItems.map((gridItem, idx) => (
              <View key={idx} style={styles.gridItem}>
                {gridItem.rows.map((row, rowIdx) => {
                  if (row.type === 'text') {
                    return (
                      <Text key={rowIdx} style={styles.gridItemText}>
                        {row.content}
                      </Text>
                    );
                  }
                  if (row.type === 'icon') {
                    return (
                      <Text key={rowIdx} style={{ fontSize: 32, color: theme.accent }}>
                        ●
                      </Text>
                    );
                  }
                  return null;
                })}
              </View>
            ))}
          </View>
        );
      }

      // Regular list
      return (
        <View style={styles.listContainer} wrap={false}>
          {items.map((item: ListItem, idx: number) => {
            const textStyle =
              item.style === 'title' || item.style === 'h1'
                ? styles.listTextH1
                : item.style === 'h2'
                ? styles.listTextH2
                : styles.listText;

            return (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>
                  {isOrdered ? `${idx + 1}.` : '•'}
                </Text>
                <Text style={textStyle}>
                  {parseFormattedText(item.content, theme, fonts)}
                </Text>
              </View>
            );
          })}
        </View>
      );
    }

    case 'spacer':
      return <View style={{ height: (element.metadata?.spaceMultiplier || 1) * 16 }} />;

    case 'highlight':
      return (
        <View
          style={{
            backgroundColor: `${theme.accent}33`,
            padding: 16,
            borderRadius: 8,
            marginVertical: 8,
          }}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 18 }}>
            {formattedContent}
          </Text>
        </View>
      );

    default:
      return null;
  }
}

/**
 * Render a complete slide page
 */
function renderSlide(
  slide: Slide,
  index: number,
  styles: ReturnType<typeof createStyles>,
  theme: ParsedTheme,
  fonts: ResolvedFonts,
  imageCache: ImageCache
): React.ReactNode {
  // Filter out pause elements (not needed in PDF)
  const elements = slide.elements.filter((e) => e.type !== 'pause');

  // Section slide (special styling)
  if (slide.isSection) {
    return (
      <Page key={index} size={[SLIDE_WIDTH, SLIDE_HEIGHT]} style={styles.pageSection} wrap={false}>
        <View style={styles.content} wrap={false}>
          {elements.map((el, i) => (
            <React.Fragment key={i}>
              {renderElement(el, styles, theme, fonts, imageCache)}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.slideNumber}>{index + 1}</Text>
      </Page>
    );
  }

  // Split layout (image position specified)
  if (slide.imagePosition) {
    const imageElement = elements.find((e) => e.type === 'image');
    const contentElements = elements.filter((e) => e.type !== 'image');
    const isLeft = slide.imagePosition === 'left';

    const imageView = (
      <View style={styles.splitImage}>
        {imageElement && (() => {
          const cachedImage = getImageFromCache(imageCache, imageElement.content);
          if (cachedImage) {
            return <Image src={toDataUrl(cachedImage)} style={styles.imageSplit} />;
          }
          // Fallback for missing image
          const truncatedDesc = imageElement.content.length > 30
            ? imageElement.content.slice(0, 27) + '...'
            : imageElement.content;
          return (
            <View style={{
              width: '100%',
              height: '100%',
              backgroundColor: theme.bgSecondary,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: theme.textSecondary, fontSize: 10, textAlign: 'center' }}>
                [Image: {truncatedDesc}]
              </Text>
            </View>
          );
        })()}
      </View>
    );

    const contentView = (
      <View style={styles.splitContent}>
        {contentElements.map((el, i) => (
          <React.Fragment key={i}>
            {renderElement(el, styles, theme, fonts, imageCache)}
          </React.Fragment>
        ))}
      </View>
    );

    return (
      <Page key={index} size={[SLIDE_WIDTH, SLIDE_HEIGHT]} style={styles.pageSplit} wrap={false}>
        {/* Render in order based on image position */}
        {isLeft ? imageView : contentView}
        {isLeft ? contentView : imageView}

        {/* Footer and slide number */}
        {slide.footer && <Text style={styles.footer}>{slide.footer}</Text>}
        <Text style={styles.slideNumber}>{index + 1}</Text>
      </Page>
    );
  }

  // Standard layout
  const alignmentStyle =
    slide.alignment?.horizontal === 'left'
      ? styles.contentLeft
      : slide.alignment?.horizontal === 'right'
      ? styles.contentRight
      : {};

  return (
    <Page key={index} size={[SLIDE_WIDTH, SLIDE_HEIGHT]} style={styles.page} wrap={false}>
      <View style={[styles.content, alignmentStyle]} wrap={false}>
        {elements.map((el, i) => (
          <React.Fragment key={i}>
            {renderElement(el, styles, theme, fonts, imageCache)}
          </React.Fragment>
        ))}
      </View>

      {/* Footer */}
      {slide.footer && <Text style={styles.footer}>{slide.footer}</Text>}

      {/* Slide number */}
      <Text style={styles.slideNumber}>{index + 1}</Text>
    </Page>
  );
}

/**
 * Create a complete PDF document from slides
 * This is async because font registration requires network fetches
 */
export async function createPdfDocument(
  slides: Slide[],
  theme: ParsedTheme = DEFAULT_THEME,
  imageCache: ImageCache = new Map()
): Promise<React.ReactElement> {
  // Register fonts from theme (async - downloads and caches fonts)
  const registeredFonts = await registerThemeFontsAsync({
    fontDisplay: theme.fontDisplay,
    fontBody: theme.fontBody,
    fontMono: theme.fontMono,
  });

  // Build resolved fonts object
  const fonts: ResolvedFonts = {
    display: registeredFonts.fontDisplay,
    body: registeredFonts.fontBody,
    mono: registeredFonts.fontMono,
  };

  console.log('[PDF Export] Using fonts:', fonts);

  const styles = createStyles(theme, fonts);

  return (
    <Document>
      {slides.map((slide, index) => renderSlide(slide, index, styles, theme, fonts, imageCache))}
    </Document>
  );
}

// Export for type checking
export type { ParsedTheme };
