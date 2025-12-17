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

// Check if slide has a positioned image (triggers split layout)
function hasSplitLayout(slide: Slide): boolean {
  return !!slide.imagePosition;
}

interface SlideRendererProps {
  slide: Slide;
  revealStep: number;
  isPresenting?: boolean;
  imageManifest?: ImageManifest;
  onImageChange?: (description: string, slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (description: string, slot: ImageSlot) => void;
}

export function SlideRenderer({
  slide,
  revealStep,
  isPresenting = false,
  imageManifest,
  onImageChange,
  onActiveSlotChange,
}: SlideRendererProps) {
  const visibleElements = getVisibleElements(slide, revealStep);

  // Section header slides get special treatment
  if (slide.isSection) {
    return (
      <div
        className={`
          relative w-full h-full
          flex flex-col items-center justify-center
          p-8 md:p-16 lg:p-24
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

  // Split layout: image + content side by side
  if (isSplit && imageElement) {
    const isHorizontalSplit = imagePosition === 'left' || imagePosition === 'right';
    const imageFirst = imagePosition === 'left' || imagePosition === 'top';

    return (
      <div
        className={`
          relative w-full h-full
          bg-slide-bg text-slide-text
          overflow-hidden
          ${isPresenting ? 'min-h-screen' : 'min-h-[400px] rounded-lg'}
        `}
      >
        {slide.background && <SlideBackground effect={slide.background} />}

        <div
          className={`
            relative z-10 w-full h-full
            flex ${isHorizontalSplit ? 'flex-row' : 'flex-col'}
            ${!imageFirst ? (isHorizontalSplit ? 'flex-row-reverse' : 'flex-col-reverse') : ''}
          `}
        >
          {/* Image area: 40% for left/right, 60% for top/bottom */}
          <div
            className={`
              ${isHorizontalSplit ? 'w-[40%] h-full' : 'w-full h-[60%]'}
              flex-shrink-0 flex items-center justify-center
              p-4 md:p-6 lg:p-8
            `}
          >
            <ImagePlaceholder
              description={imageElement.content}
              imageUrl={imageElement.metadata?.imageUrl}
              status={imageElement.metadata?.imageStatus}
              isPresenting={isPresenting}
              manifestEntry={imageManifest?.[imageElement.content]}
              onImageChange={onImageChange ? (slot, url) => onImageChange(imageElement.content, slot, url) : undefined}
              onActiveSlotChange={onActiveSlotChange ? (slot) => onActiveSlotChange(imageElement.content, slot) : undefined}
            />
          </div>

          {/* Content area: 60% for left/right, 40% for top/bottom */}
          <div
            className={`
              ${isHorizontalSplit ? 'w-[60%] h-full' : 'w-full h-[40%]'}
              flex flex-col ${alignmentClasses}
              p-8 md:p-12 lg:p-16
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

  // Standard layout: vertical stack with alignment
  return (
    <div
      className={`
        relative w-full h-full
        flex flex-col ${alignmentClasses}
        p-8 md:p-16 lg:p-24
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
          {visibleElements.map((element, index) => (
            <ElementRenderer
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
}

const ElementRenderer = forwardRef<HTMLDivElement, ElementRendererProps>(function ElementRenderer({
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
        // Title (#) = 16x base
        return (
          <h1
            className={`
              text-slide-text leading-tight tracking-tight
              ${effectClass}
            `}
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 'var(--weight-title)',
              fontSize: isPresenting ? 'clamp(6rem, 16vmin, 12rem)' : 'clamp(3rem, 8vw, 5rem)',
            }}
          >
            <FormattedText text={element.content} />
          </h1>
        );

      case 'subtitle':
        // H1 (##) = 8x base
        return (
          <h2
            className={`
              text-slide-text leading-tight
              ${effectClass}
            `}
            style={{
              fontFamily: 'var(--font-h1)',
              fontWeight: 'var(--weight-h1)',
              fontSize: isPresenting ? 'clamp(3rem, 8vmin, 6rem)' : 'clamp(1.75rem, 4vw, 2.5rem)',
            }}
          >
            <FormattedText text={element.content} />
          </h2>
        );

      case 'text':
        // H2 (###) = 3x base
        return (
          <p
            className={`
              text-slide-text leading-normal
              ${effectClass}
            `}
            style={{
              fontFamily: 'var(--font-h2)',
              fontWeight: 'var(--weight-h2)',
              fontSize: isPresenting ? 'clamp(2.25rem, 3vmin, 3rem)' : 'clamp(1.5rem, 2.25vw, 1.875rem)',
            }}
          >
            <FormattedText text={element.content} />
          </p>
        );

      case 'body':
        // Plain text (body) = 1.5x base
        return (
          <p
            className={`
              text-slide-text leading-normal
              ${effectClass}
            `}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-body)',
              fontSize: isPresenting ? 'clamp(1.5rem, 1.5vmin, 1.875rem)' : 'clamp(1rem, 1.25vw, 1.125rem)',
            }}
          >
            <FormattedText text={element.content} />
          </p>
        );

      case 'image':
        return (
          <div className={`w-full ${isPresenting ? 'max-w-4xl' : 'max-w-2xl'} mx-auto`}>
            <ImagePlaceholder
              description={element.content}
              imageUrl={element.metadata?.imageUrl}
              status={element.metadata?.imageStatus}
              isPresenting={isPresenting}
              manifestEntry={imageManifest?.[element.content]}
              onImageChange={onImageChange ? (slot, url) => onImageChange(element.content, slot, url) : undefined}
              onActiveSlotChange={onActiveSlotChange ? (slot) => onActiveSlotChange(element.content, slot) : undefined}
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

          return (
            <div
              className={`
                grid gap-4 md:gap-6 w-full my-6
                ${gridCols === 2 ? 'grid-cols-1 sm:grid-cols-2' : ''}
                ${gridCols === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : ''}
                ${gridCols === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : ''}
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
              return {
                fontFamily: 'var(--font-h1)',
                fontWeight: 'var(--weight-h1)',
                fontSize: isPresenting ? 'clamp(2.25rem, 3vmin, 3rem)' : 'clamp(1.5rem, 2.25vw, 1.875rem)',
              };
            case 'h2':
              return {
                fontFamily: 'var(--font-h2)',
                fontWeight: 'var(--weight-h2)',
                fontSize: isPresenting ? 'clamp(1.75rem, 2vmin, 2.25rem)' : 'clamp(1.25rem, 1.75vw, 1.5rem)',
              };
            case 'body':
            default:
              return {
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-body)',
                fontSize: isPresenting ? 'clamp(1.5rem, 1.5vmin, 1.875rem)' : 'clamp(1rem, 1.25vw, 1.125rem)',
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
              return {
                fontFamily: 'var(--font-h1)',
                fontWeight: 'var(--weight-h1)',
                fontSize: isPresenting ? 'clamp(2.25rem, 3vmin, 3rem)' : 'clamp(1.5rem, 2.25vw, 1.875rem)',
              };
            case 'h2':
              return {
                fontFamily: 'var(--font-h2)',
                fontWeight: 'var(--weight-h2)',
                fontSize: isPresenting ? 'clamp(1.75rem, 2vmin, 2.25rem)' : 'clamp(1.25rem, 1.75vw, 1.5rem)',
              };
            case 'body':
            default:
              return {
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-body)',
                fontSize: isPresenting ? 'clamp(1.5rem, 1.5vmin, 1.875rem)' : 'clamp(1rem, 1.25vw, 1.125rem)',
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
}

function GridCard({
  item,
  isPresenting,
  revealStep,
  imageManifest,
  onImageChange,
  onActiveSlotChange,
}: GridCardProps) {
  // Check if this grid item should be visible based on its revealOrder
  const isVisible = (item.revealOrder ?? 0) <= revealStep;

  return (
    <div
      className={`
        flex flex-col items-center text-center
        p-4 md:p-6 rounded-xl
        bg-slide-surface/20
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
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
        />
      ))}
    </div>
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
}

function GridRowRenderer({
  row,
  isPresenting,
  imageManifest,
  onImageChange,
  onActiveSlotChange,
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
      // ## in grid = same as ## Header in main
      return (
        <h4
          className="text-slide-text leading-normal"
          style={{
            fontFamily: 'var(--font-h1)',
            fontWeight: 'var(--weight-h1)',
            fontSize: isPresenting ? 'clamp(3rem, 8vmin, 6rem)' : 'clamp(1.75rem, 4vw, 2.5rem)',
          }}
        >
          <FormattedText text={row.content} />
        </h4>
      );
    case 'h3':
      // ### in grid = same as ### text in main
      return (
        <h5
          className="text-slide-text leading-normal"
          style={{
            fontFamily: 'var(--font-h2)',
            fontWeight: 'var(--weight-h2)',
            fontSize: isPresenting ? 'clamp(2.25rem, 3vmin, 3rem)' : 'clamp(1.5rem, 2.25vw, 1.875rem)',
          }}
        >
          <FormattedText text={row.content} />
        </h5>
      );
    case 'body':
    default:
      // Plain text in grid = same as body in main
      return (
        <p
          className="text-slide-text leading-normal"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--weight-body)',
            fontSize: isPresenting ? 'clamp(1.5rem, 1.5vmin, 1.875rem)' : 'clamp(1rem, 1.25vw, 1.125rem)',
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
