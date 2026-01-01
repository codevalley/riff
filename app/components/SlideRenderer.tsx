'use client';

// ============================================
// VIBE SLIDES - Slide Renderer Component
// ============================================

import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  Slide,
  SlideElement,
  ImageManifest,
  ImageSlot,
  HorizontalAlign,
  VerticalAlign,
  ImagePosition,
  GridItem,
  GridItemRow,
  ListItem,
  ListItemStyle,
} from '@/lib/types';
import { getVisibleElements } from '@/lib/parser';
import { ImagePlaceholder } from './ImagePlaceholder';
import { RetroGrid } from './ui/retro-grid';
import { SlideBackground } from './SlideBackground';

// ============================================
// Alignment Helpers (Layout v2)
// ============================================

const HORIZONTAL_ALIGN_CLASSES: Record<HorizontalAlign, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

const VERTICAL_ALIGN_CLASSES: Record<VerticalAlign, string> = {
  top: 'justify-start',
  center: 'justify-center',
  bottom: 'justify-end',
};

function getAlignmentClasses(slide: Slide): string {
  const h = slide.alignment?.horizontal || 'center';
  const v = slide.alignment?.vertical || 'center';
  return `${HORIZONTAL_ALIGN_CLASSES[h]} ${VERTICAL_ALIGN_CLASSES[v]}`;
}

// Check if slide has a HORIZONTAL split layout (left/right positioned image)
// Top/bottom images use standard stacked layout with reordering instead
function hasSplitLayout(slide: Slide): boolean {
  return slide.imagePosition === 'left' || slide.imagePosition === 'right';
}

// Library image for "From Library" picker in ImagePlaceholder
interface DeckLibraryImage {
  description: string;
  url: string;
  slideIndex?: number;
}

interface SlideRendererProps {
  slide: Slide;
  revealStep: number;
  isPresenting?: boolean;
  imageManifest?: ImageManifest;
  onImageChange?: (description: string, slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (description: string, slot: ImageSlot) => void;
  // Scene context for visual consistency across images (location, characters, thematic elements)
  sceneContext?: string;
  // All deck images for "From Library" picker
  deckImages?: DeckLibraryImage[];
}

export function SlideRenderer({
  slide,
  revealStep,
  isPresenting = false,
  imageManifest,
  onImageChange,
  onActiveSlotChange,
  sceneContext,
  deckImages,
}: SlideRendererProps) {
  const visibleElements = getVisibleElements(slide, revealStep);

  // Section header slides get special treatment
  if (slide.isSection) {
    return (
      <div
        className={`
          slide-container
          relative w-full h-full
          flex flex-col items-center justify-center
          p-4 portrait:p-3 md:p-12 lg:p-20
          bg-slide-bg text-slide-text
          overflow-hidden
          ${isPresenting ? 'min-h-screen' : 'min-h-[400px] rounded-lg'}
        `}
      >
        {/* Background effect - use custom if specified, otherwise RetroGrid */}
        {slide.background ? (
          <SlideBackground effect={slide.background} />
        ) : (
          <RetroGrid angle={65} />
        )}

        {/* Section content - centered with larger styling */}
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
          <AnimatePresence mode="popLayout">
            {visibleElements.map((element, index) => (
              <SectionElementRenderer
                key={`${slide.id}-${index}-${element.type}-${element.content.slice(0, 20)}`}
                element={element}
                index={index}
                isPresenting={isPresenting}
                revealStep={revealStep}
                imageManifest={imageManifest}
                onImageChange={onImageChange}
                onActiveSlotChange={onActiveSlotChange}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Footer - follows slide alignment */}
        {slide.footer && (
          <div className="absolute bottom-4 left-4 right-4 text-slide-muted text-sm opacity-70 text-center">
            <FormattedText text={slide.footer} />
          </div>
        )}

        {/* Slide number indicator */}
        <div className="absolute bottom-4 right-4 text-slide-muted text-sm font-mono opacity-50">
          {slide.id}
        </div>
      </div>
    );
  }

  // Get alignment classes
  const alignmentClasses = getAlignmentClasses(slide);

  // Check for split layout (image with position)
  const isSplit = hasSplitLayout(slide);
  const imagePosition = slide.imagePosition;

  // Separate image element from other content for split layouts
  const imageElement = isSplit ? visibleElements.find(e => e.type === 'image') : null;
  const contentElements = isSplit
    ? visibleElements.filter(e => e.type !== 'image')
    : visibleElements;

  // Split layout: image + content side by side (LEFT/RIGHT only)
  // On portrait/mobile: stacks vertically with image on top, content below
  if (isSplit && imageElement) {
    const imageOnLeft = imagePosition === 'left';

    return (
      <div
        className={`
          slide-container
          relative w-full h-full
          bg-slide-bg text-slide-text
          overflow-hidden
          ${isPresenting ? 'min-h-screen' : 'min-h-[400px] rounded-lg'}
        `}
      >
        {slide.background && <SlideBackground effect={slide.background} />}

        <div
          className={`
            slide-split-layout
            relative z-10 w-full
            flex
            portrait:flex-col portrait:items-center portrait:justify-center portrait:h-full
            landscape:flex-row landscape:h-full
            ${!imageOnLeft ? 'landscape:flex-row-reverse' : ''}
          `}
        >
          {/* Image area: 40% on landscape, constrained on portrait */}
          <div
            className={`
              slide-split-image
              flex-shrink-0 flex items-center justify-center
              p-3 md:p-6 lg:p-8
              portrait:w-full portrait:max-h-[35vh]
              landscape:w-[40%] landscape:h-full
            `}
            style={{ aspectRatio: '16/9' }}
          >
            <ImagePlaceholder
              description={imageElement.content}
              imageUrl={imageElement.metadata?.imageUrl}
              status={imageElement.metadata?.imageStatus}
              isPresenting={isPresenting}
              manifestEntry={imageManifest?.[imageElement.content]}
              onImageChange={onImageChange ? (slot, url) => onImageChange(imageElement.content, slot, url) : undefined}
              onActiveSlotChange={onActiveSlotChange ? (slot) => onActiveSlotChange(imageElement.content, slot) : undefined}
              sceneContext={sceneContext}
              deckImages={deckImages}
              constrainHeight={true}
            />
          </div>

          {/* Content area: 60% on landscape, auto-height on portrait (stacks naturally) */}
          <div
            className={`
              slide-split-content
              flex flex-col
              p-3 md:p-8 lg:p-12
              portrait:w-full portrait:items-center portrait:text-center
              landscape:w-[60%] landscape:h-full ${alignmentClasses}
            `}
          >
            <div className="w-full max-w-3xl">
              <AnimatePresence mode="popLayout">
                {contentElements.map((element, index) => (
                  <ElementRenderer
                    key={`${slide.id}-${index}-${element.type}-${element.content.slice(0, 20)}`}
                    element={element}
                    index={index}
                    isPresenting={isPresenting}
                    revealStep={revealStep}
                    imageManifest={imageManifest}
                    onImageChange={onImageChange}
                    onActiveSlotChange={onActiveSlotChange}
                    sceneContext={sceneContext}
                    deckImages={deckImages}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer - follows slide alignment */}
        {slide.footer && (
          <div
            className={`absolute bottom-4 left-4 right-4 text-slide-muted text-sm opacity-70
              ${slide.alignment?.horizontal === 'left' ? 'text-left' : ''}
              ${slide.alignment?.horizontal === 'right' ? 'text-right' : ''}
              ${!slide.alignment?.horizontal || slide.alignment?.horizontal === 'center' ? 'text-center' : ''}
            `}
          >
            <FormattedText text={slide.footer} />
          </div>
        )}

        <div className="absolute bottom-4 right-4 text-slide-muted text-sm font-mono opacity-50">
          {slide.id}
        </div>
      </div>
    );
  }

  // For top/bottom image positioning, reorder elements so image is first/last
  // This keeps everything stacked together and respects [center, center] alignment
  const hasVerticalImagePosition = imagePosition === 'top' || imagePosition === 'bottom';
  const orderedElements = (() => {
    if (!imagePosition || imagePosition === 'left' || imagePosition === 'right') {
      return visibleElements; // No reordering needed
    }

    const imageIdx = visibleElements.findIndex(e => e.type === 'image');
    if (imageIdx === -1) return visibleElements; // No image found

    const image = visibleElements[imageIdx];
    const others = visibleElements.filter((_, i) => i !== imageIdx);

    if (imagePosition === 'top') {
      return [image, ...others]; // Image first
    } else {
      return [...others, image]; // Image last (bottom)
    }
  })();

  // Standard layout: vertical stack with alignment
  return (
    <div
      className={`
        slide-container
        relative w-full h-full
        flex flex-col ${alignmentClasses}
        p-4 portrait:p-3 md:p-12 lg:p-20
        bg-slide-bg text-slide-text
        overflow-hidden
        ${isPresenting ? 'min-h-screen' : 'min-h-[400px] rounded-lg'}
      `}
    >
      {/* Background effect from [bg:...] tag */}
      {slide.background && <SlideBackground effect={slide.background} />}

      {/* Slide content */}
      <div className="relative z-10 w-full max-w-5xl">
        <AnimatePresence mode="popLayout">
          {orderedElements.map((element, index) => (
            <ElementRenderer
              key={`${slide.id}-${index}-${element.type}-${element.content.slice(0, 20)}`}
              element={element}
              index={index}
              isPresenting={isPresenting}
              revealStep={revealStep}
              imageManifest={imageManifest}
              onImageChange={onImageChange}
              onActiveSlotChange={onActiveSlotChange}
              sceneContext={sceneContext}
              deckImages={deckImages}
              constrainImageHeight={hasVerticalImagePosition && element.type === 'image'}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer - follows slide alignment */}
      {slide.footer && (
        <div
          className={`absolute bottom-4 left-4 right-4 text-slide-muted text-sm opacity-70
            ${slide.alignment?.horizontal === 'left' ? 'text-left' : ''}
            ${slide.alignment?.horizontal === 'right' ? 'text-right' : ''}
            ${!slide.alignment?.horizontal || slide.alignment?.horizontal === 'center' ? 'text-center' : ''}
          `}
        >
          <FormattedText text={slide.footer} />
        </div>
      )}

      {/* Slide number indicator */}
      <div className="absolute bottom-4 right-4 text-slide-muted text-sm font-mono opacity-50">
        {slide.id}
      </div>
    </div>
  );
}

// ============================================
// Element Renderer
// ============================================

interface ElementRendererProps {
  element: SlideElement;
  index: number;
  isPresenting: boolean;
  revealStep: number;
  imageManifest?: ImageManifest;
  onImageChange?: (description: string, slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (description: string, slot: ImageSlot) => void;
  sceneContext?: string;
  deckImages?: DeckLibraryImage[];
  // When true, images are constrained to ~35% viewport height (for top/bottom positioned images)
  constrainImageHeight?: boolean;
}

const ElementRenderer = forwardRef<HTMLDivElement, ElementRendererProps>(function ElementRenderer({
  element,
  index,
  isPresenting,
  revealStep,
  imageManifest,
  onImageChange,
  onActiveSlotChange,
  sceneContext,
  deckImages,
  constrainImageHeight = false,
}, ref) {
  // Get effect class from metadata (e.g. "effect-anvil" for [anvil] decorator)
  const effectClass = element.metadata?.effect ? `effect-${element.metadata.effect}` : '';

  const variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.05,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 },
    },
  };

  const renderContent = () => {
    switch (element.type) {
      case 'title':
        // Title (#) - hardcoded clamp for both modes
        return (
          <h1
            className={`
              text-slide-text leading-tight tracking-tight
              ${effectClass}
            `}
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 'var(--weight-title)',
              fontSize: isPresenting ? 'clamp(3rem, 12vmin, 8rem)' : 'clamp(2rem, 6vw, 4rem)',
            }}
          >
            <FormattedText text={element.content} />
          </h1>
        );

      case 'subtitle':
        // H2 (##) - +10% from original
        return (
          <h2
            className={`
              text-slide-text leading-tight
              ${effectClass}
            `}
            style={{
              fontFamily: 'var(--font-h1)',
              fontWeight: 'var(--weight-h1)',
              fontSize: isPresenting ? 'clamp(1.925rem, 6.6vmin, 4.4rem)' : 'clamp(1.65rem, 4.4vw, 2.5rem)',
            }}
          >
            <FormattedText text={element.content} />
          </h2>
        );

      case 'text':
        // H3 (###) - +25% from original
        return (
          <p
            className={`
              text-slide-text leading-normal
              ${effectClass}
            `}
            style={{
              fontFamily: 'var(--font-h2)',
              fontWeight: 'var(--weight-h2)',
              fontSize: isPresenting ? 'clamp(1.25rem, 3vmin, 2.5rem)' : 'clamp(1.4rem, 2.5vw, 1.875rem)',
            }}
          >
            <FormattedText text={element.content} />
          </p>
        );

      case 'body':
        // Body text - +25% from original
        return (
          <p
            className={`
              text-slide-text leading-normal
              ${effectClass}
            `}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-body)',
              fontSize: isPresenting ? 'clamp(1.1rem, 1.875vmin, 1.5rem)' : 'clamp(1.1rem, 1.5vw, 1.25rem)',
            }}
          >
            <FormattedText text={element.content} />
          </p>
        );

      case 'image':
        return (
          <div
            className={`w-full ${isPresenting ? 'max-w-4xl' : 'max-w-2xl'} mx-auto`}
            style={constrainImageHeight ? { maxHeight: '35vh' } : undefined}
          >
            <ImagePlaceholder
              description={element.content}
              imageUrl={element.metadata?.imageUrl}
              status={element.metadata?.imageStatus}
              isPresenting={isPresenting}
              manifestEntry={imageManifest?.[element.content]}
              onImageChange={onImageChange ? (slot, url) => onImageChange(element.content, slot, url) : undefined}
              onActiveSlotChange={onActiveSlotChange ? (slot) => onActiveSlotChange(element.content, slot) : undefined}
              sceneContext={sceneContext}
              deckImages={deckImages}
              constrainHeight={constrainImageHeight}
            />
          </div>
        );

      case 'code':
        return (
          <pre
            className={`
              font-mono bg-slide-surface/50 rounded-xl p-6
              ${isPresenting ? 'text-lg md:text-xl' : 'text-sm'}
              overflow-x-auto w-full border border-slide-accent/20
            `}
          >
            <code className="text-slide-text">{element.content}</code>
          </pre>
        );

      case 'quote':
        return (
          <blockquote
            className={`
              font-body italic text-slide-muted
              ${isPresenting ? 'text-2xl md:text-3xl' : 'text-lg'}
              border-l-4 border-slide-accent pl-6
            `}
          >
            {element.content}
          </blockquote>
        );

      case 'spacer':
        const multiplier = element.metadata?.spaceMultiplier || 1;
        const baseHeight = isPresenting ? 8 : 4; // pixels per unit
        return (
          <div
            style={{ height: `${baseHeight * multiplier}px` }}
            aria-hidden="true"
          />
        );

      case 'list':
        // Grid rendering (horizontal cards)
        if (element.metadata?.isGrid && element.metadata?.gridItems) {
          const gridItems = element.metadata.gridItems;
          const gridCols = gridItems.length <= 2 ? 2 : gridItems.length <= 3 ? 3 : 4;

          // Responsive grid: single col on small portrait, 2 cols on tablet portrait, full on landscape
          return (
            <div
              className={`
                slide-grid
                ${gridCols === 2 ? 'slide-grid-2' : ''}
                ${gridCols === 3 ? 'slide-grid-3' : ''}
                ${gridCols === 4 ? 'slide-grid-4' : ''}
                grid gap-3 portrait:gap-2 md:gap-4 lg:gap-6 w-full my-4 portrait:my-2
                ${gridCols === 2 ? 'grid-cols-1 landscape:grid-cols-2' : ''}
                ${gridCols === 3 ? 'grid-cols-1 landscape:grid-cols-2 lg:grid-cols-3' : ''}
                ${gridCols === 4 ? 'grid-cols-1 landscape:grid-cols-2 lg:grid-cols-4' : ''}
              `}
            >
              {gridItems.map((item, idx) => (
                <GridCard
                  key={idx}
                  item={item}
                  isPresenting={isPresenting}
                  revealStep={revealStep}
                  imageManifest={imageManifest}
                  onImageChange={onImageChange}
                  onActiveSlotChange={onActiveSlotChange}
                  sceneContext={sceneContext}
                  deckImages={deckImages}
                />
              ))}
            </div>
          );
        }

        // Standard list rendering with per-item styling
        const ListTag = element.metadata?.listType === 'ordered' ? 'ol' : 'ul';
        const listItems = element.metadata?.listItems || [];

        // Get style for a list item based on its style property
        const getItemStyle = (itemStyle: ListItemStyle) => {
          switch (itemStyle) {
            case 'title':
              return {
                fontFamily: 'var(--font-title)',
                fontWeight: 'var(--weight-title)',
                fontSize: isPresenting ? 'clamp(3rem, 4vmin, 4rem)' : 'clamp(1.75rem, 3vw, 2.25rem)',
              };
            case 'h1':
              // ## in list - +10%
              return {
                fontFamily: 'var(--font-h1)',
                fontWeight: 'var(--weight-h1)',
                fontSize: isPresenting ? 'clamp(1.925rem, 6.6vmin, 4.4rem)' : 'clamp(1.65rem, 2.5vw, 2.1rem)',
              };
            case 'h2':
              // ### in list - +25%
              return {
                fontFamily: 'var(--font-h2)',
                fontWeight: 'var(--weight-h2)',
                fontSize: isPresenting ? 'clamp(1.25rem, 3vmin, 2.5rem)' : 'clamp(1.4rem, 2.2vw, 1.875rem)',
              };
            case 'body':
            default:
              // body in list - +25%
              return {
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-body)',
                fontSize: isPresenting ? 'clamp(1.1rem, 1.875vmin, 1.5rem)' : 'clamp(1.1rem, 1.5vw, 1.25rem)',
              };
          }
        };

        return (
          <ListTag
            className={`
              text-slide-text leading-normal
              ${element.metadata?.listType === 'ordered' ? 'list-decimal' : 'list-disc'}
              list-inside space-y-3
            `}
          >
            {listItems.map((item, idx) => {
              // Handle both old format (string) and new format (ListItem object)
              const content = typeof item === 'string' ? item : item.content;
              const itemStyle = typeof item === 'string' ? 'body' : item.style;
              return (
                <li key={idx} className="pl-2" style={getItemStyle(itemStyle)}>
                  <FormattedText text={content} />
                </li>
              );
            })}
          </ListTag>
        );

      default:
        return <span>{element.content}</span>;
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      {renderContent()}
    </motion.div>
  );
});

// ============================================
// Section Element Renderer (bolder/larger for section headers)
// ============================================

const SectionElementRenderer = forwardRef<HTMLDivElement, ElementRendererProps>(function SectionElementRenderer({
  element,
  index,
  isPresenting,
  revealStep,
  imageManifest,
  onImageChange,
  onActiveSlotChange,
}, ref) {
  // Get effect class from metadata (e.g. "effect-anvil" for [anvil] decorator)
  const effectClass = element.metadata?.effect ? `effect-${element.metadata.effect}` : '';

  const variants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.4 },
    },
  };

  const renderContent = () => {
    switch (element.type) {
      case 'title':
        return (
          <h1
            className={`
              font-display font-black text-slide-text
              ${isPresenting ? 'text-6xl md:text-8xl lg:text-9xl' : 'text-4xl md:text-5xl'}
              leading-none tracking-tighter
              drop-shadow-2xl
              ${effectClass}
            `}
          >
            <HighlightedText text={element.content} />
          </h1>
        );

      case 'subtitle':
        return (
          <h2
            className={`
              font-display font-bold text-slide-text/90
              ${isPresenting ? 'text-4xl md:text-6xl lg:text-7xl' : 'text-2xl md:text-3xl'}
              leading-tight tracking-tight mt-6
              ${effectClass}
            `}
          >
            <HighlightedText text={element.content} />
          </h2>
        );

      case 'text':
        return (
          <p
            className={`
              font-body text-slide-muted
              ${isPresenting ? 'text-2xl md:text-4xl lg:text-5xl' : 'text-xl md:text-2xl'}
              leading-relaxed mt-8
              ${effectClass}
            `}
          >
            <HighlightedText text={element.content} />
          </p>
        );

      case 'list':
        const SectionListTag = element.metadata?.listType === 'ordered' ? 'ol' : 'ul';
        const sectionListItems = element.metadata?.listItems || [];

        // Get style for a list item based on its style property
        const getListItemStyle = (style: ListItemStyle) => {
          switch (style) {
            case 'title':
              return {
                fontFamily: 'var(--font-title)',
                fontWeight: 'var(--weight-title)',
                fontSize: isPresenting ? 'clamp(3rem, 4vmin, 4rem)' : 'clamp(1.75rem, 3vw, 2.25rem)',
              };
            case 'h1':
              // ## in list - +10%
              return {
                fontFamily: 'var(--font-h1)',
                fontWeight: 'var(--weight-h1)',
                fontSize: isPresenting ? 'clamp(1.925rem, 6.6vmin, 4.4rem)' : 'clamp(1.65rem, 2.5vw, 2.1rem)',
              };
            case 'h2':
              // ### in list - +25%
              return {
                fontFamily: 'var(--font-h2)',
                fontWeight: 'var(--weight-h2)',
                fontSize: isPresenting ? 'clamp(1.25rem, 3vmin, 2.5rem)' : 'clamp(1.4rem, 2.2vw, 1.875rem)',
              };
            case 'body':
            default:
              // body in list - +25%
              return {
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-body)',
                fontSize: isPresenting ? 'clamp(1.1rem, 1.875vmin, 1.5rem)' : 'clamp(1.1rem, 1.5vw, 1.25rem)',
              };
          }
        };

        return (
          <SectionListTag
            className={`
              text-slide-text leading-relaxed space-y-4 mt-4 text-left
              ${element.metadata?.listType === 'ordered' ? 'list-decimal' : 'list-disc'}
              list-inside
            `}
          >
            {sectionListItems.map((item, idx) => {
              // Handle both old format (string) and new format (ListItem object)
              const content = typeof item === 'string' ? item : item.content;
              const style = typeof item === 'string' ? 'body' : item.style;
              return (
                <li key={idx} className="pl-2" style={getListItemStyle(style)}>
                  <HighlightedText text={content} />
                </li>
              );
            })}
          </SectionListTag>
        );

      default:
        // For other elements, fall back to regular rendering
        return <span className="text-slide-text">{element.content}</span>;
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      {renderContent()}
    </motion.div>
  );
});

// ============================================
// Formatted Text (supports markdown formatting)
// ============================================

/**
 * Parse and render inline markdown formatting:
 * - `code` - highlighted/accent text
 * - **bold** - bold text
 * - *italic* or _italic_ - italic text
 * - ~~strikethrough~~ - strikethrough text
 * - __underline__ - underlined text
 */
function FormattedText({ text }: { text: string }) {
  // Combined regex to match all formatting patterns
  // Order in alternation matters for correct matching
  const combinedPattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\~\~[^~]+\~\~)|(\*[^*]+\*)|(_[^_]+_)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyCounter = 0;

  // Use matchAll to find all matches
  const matches = Array.from(text.matchAll(combinedPattern));

  for (const match of matches) {
    const fullMatch = match[0];
    const startIndex = match.index!;

    // Add plain text before this match
    if (startIndex > lastIndex) {
      elements.push(<span key={keyCounter++}>{text.slice(lastIndex, startIndex)}</span>);
    }

    // Determine which pattern matched and render accordingly
    if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
      // `code` - highlighted
      const content = fullMatch.slice(1, -1);
      elements.push(
        <span key={keyCounter++} className="text-slide-accent font-semibold px-2 py-0.5 bg-slide-accent/10 rounded">
          {content}
        </span>
      );
    } else if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
      // **bold**
      const content = fullMatch.slice(2, -2);
      elements.push(<strong key={keyCounter++} className="font-bold">{content}</strong>);
    } else if (fullMatch.startsWith('__') && fullMatch.endsWith('__')) {
      // __underline__
      const content = fullMatch.slice(2, -2);
      elements.push(<span key={keyCounter++} className="underline">{content}</span>);
    } else if (fullMatch.startsWith('~~') && fullMatch.endsWith('~~')) {
      // ~~strikethrough~~
      const content = fullMatch.slice(2, -2);
      elements.push(<span key={keyCounter++} className="line-through">{content}</span>);
    } else if ((fullMatch.startsWith('*') && fullMatch.endsWith('*')) ||
               (fullMatch.startsWith('_') && fullMatch.endsWith('_'))) {
      // *italic* or _italic_
      const content = fullMatch.slice(1, -1);
      elements.push(<em key={keyCounter++} className="italic">{content}</em>);
    }

    lastIndex = startIndex + fullMatch.length;
  }

  // Add remaining plain text
  if (lastIndex < text.length) {
    elements.push(<span key={keyCounter++}>{text.slice(lastIndex)}</span>);
  }

  // If no formatting found, return plain text
  if (elements.length === 0) {
    return <>{text}</>;
  }

  return <>{elements}</>;
}

// Legacy alias for components that haven't been updated
function HighlightedText({ text }: { text: string }) {
  return <FormattedText text={text} />;
}

// ============================================
// Grid Card Component (Layout v2)
// ============================================

interface GridCardProps {
  item: GridItem;
  isPresenting: boolean;
  revealStep: number;
  imageManifest?: ImageManifest;
  onImageChange?: (description: string, slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (description: string, slot: ImageSlot) => void;
  sceneContext?: string;
  deckImages?: DeckLibraryImage[];
}

function GridCard({
  item,
  isPresenting,
  revealStep,
  imageManifest,
  onImageChange,
  onActiveSlotChange,
  sceneContext,
  deckImages,
}: GridCardProps) {
  // Check if this grid item should be visible based on its revealOrder
  const itemRevealOrder = item.revealOrder ?? 0;
  const isVisible = itemRevealOrder <= revealStep;

  // Hidden items: render empty placeholder to maintain grid layout
  if (!isVisible) {
    return (
      <div
        className="flex flex-col items-center text-center p-4 md:p-6 rounded-xl bg-transparent"
        aria-hidden="true"
      />
    );
  }

  // Visible items: render with entrance animation
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center p-4 md:p-6 rounded-xl bg-slide-surface/20"
    >
      {/* All rows stack vertically - can be icon, image, or text */}
      {item.rows?.map((row, idx) => (
        <GridRowRenderer
          key={idx}
          row={row}
          isPresenting={isPresenting}
          imageManifest={imageManifest}
          onImageChange={onImageChange}
          onActiveSlotChange={onActiveSlotChange}
          sceneContext={sceneContext}
          deckImages={deckImages}
        />
      ))}
    </motion.div>
  );
}

// ============================================
// Grid Row Renderer (flexible: icon/image/h1/h2/h3/body)
// ============================================

interface GridRowProps {
  row: GridItemRow;
  isPresenting: boolean;
  imageManifest?: ImageManifest;
  onImageChange?: (description: string, slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (description: string, slot: ImageSlot) => void;
  sceneContext?: string;
  deckImages?: DeckLibraryImage[];
}

function GridRowRenderer({
  row,
  isPresenting,
  imageManifest,
  onImageChange,
  onActiveSlotChange,
  sceneContext,
  deckImages,
}: GridRowProps) {
  // Handle icon rows
  if (row.type === 'icon') {
    return (
      <div className="mb-2">
        <IconAtom name={row.value} isPresenting={isPresenting} />
      </div>
    );
  }

  // Handle image rows
  if (row.type === 'image') {
    return (
      <div className={`${isPresenting ? 'w-24 h-24' : 'w-16 h-16'} rounded-lg overflow-hidden mb-2`}>
        <ImagePlaceholder
          description={row.value}
          isPresenting={isPresenting}
          manifestEntry={imageManifest?.[row.value]}
          onImageChange={onImageChange ? (slot, url) => onImageChange(row.value, slot, url) : undefined}
          onActiveSlotChange={onActiveSlotChange ? (slot) => onActiveSlotChange(row.value, slot) : undefined}
          sceneContext={sceneContext}
          deckImages={deckImages}
        />
      </div>
    );
  }

  // Handle text rows - SAME sizes as main content (# in grid = # in main)
  switch (row.level) {
    case 'h1':
      // # in grid = same as # Title in main
      return (
        <h3
          className="text-slide-text leading-normal"
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 'var(--weight-title)',
            fontSize: isPresenting ? 'clamp(6rem, 16vmin, 12rem)' : 'clamp(3rem, 8vw, 5rem)',
          }}
        >
          <FormattedText text={row.content} />
        </h3>
      );
    case 'h2':
      // ## in grid - +10%
      return (
        <h4
          className="text-slide-text leading-normal"
          style={{
            fontFamily: 'var(--font-h1)',
            fontWeight: 'var(--weight-h1)',
            fontSize: isPresenting ? 'clamp(1.925rem, 6.6vmin, 4.4rem)' : 'clamp(1.65rem, 4.4vw, 2.5rem)',
          }}
        >
          <FormattedText text={row.content} />
        </h4>
      );
    case 'h3':
      // ### in grid - +25%
      return (
        <h5
          className="text-slide-text leading-normal"
          style={{
            fontFamily: 'var(--font-h2)',
            fontWeight: 'var(--weight-h2)',
            fontSize: isPresenting ? 'clamp(1.25rem, 3vmin, 2.5rem)' : 'clamp(1.4rem, 2.5vw, 1.875rem)',
          }}
        >
          <FormattedText text={row.content} />
        </h5>
      );
    case 'body':
    default:
      // body in grid - +25%
      return (
        <p
          className="text-slide-text leading-normal"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--weight-body)',
            fontSize: isPresenting ? 'clamp(1.1rem, 1.875vmin, 1.5rem)' : 'clamp(1.1rem, 1.5vw, 1.25rem)',
          }}
        >
          <FormattedText text={row.content} />
        </p>
      );
  }
}

// ============================================
// Icon Atom Component (Lucide icons)
// ============================================

interface IconAtomProps {
  name: string;
  isPresenting?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function IconAtom({ name, isPresenting = false, size = 'lg', className = '' }: IconAtomProps) {
  // Convert kebab-case to PascalCase for Lucide icon lookup
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // Get the icon component from Lucide (cast through unknown to handle type mismatch)
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon | undefined>)[pascalName];

  if (!IconComponent) {
    // Fallback: show placeholder if icon not found
    return (
      <div
        className={`
          flex items-center justify-center
          bg-slide-surface/30 rounded-lg
          ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'}
          ${className}
        `}
      >
        <span className="text-slide-muted text-xs">?</span>
      </div>
    );
  }

  const sizeMap = {
    sm: isPresenting ? 20 : 16,
    md: isPresenting ? 28 : 20,
    lg: isPresenting ? 48 : 32,
  };

  return (
    <IconComponent
      size={sizeMap[size]}
      className={`text-slide-accent ${className}`}
    />
  );
}
