'use client';

// ============================================
// VIBE SLIDES - Slide Renderer Component
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { Slide, SlideElement } from '@/lib/types';
import { getVisibleElements } from '@/lib/parser';
import { ImagePlaceholder } from './ImagePlaceholder';

interface SlideRendererProps {
  slide: Slide;
  revealStep: number;
  isPresenting?: boolean;
}

export function SlideRenderer({ slide, revealStep, isPresenting = false }: SlideRendererProps) {
  const visibleElements = getVisibleElements(slide, revealStep);

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
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slide-surface/20 to-transparent pointer-events-none" />

      {/* Slide content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-8">
        <AnimatePresence mode="popLayout">
          {visibleElements.map((element, index) => (
            <ElementRenderer
              key={`${slide.id}-${index}-${element.type}-${element.content.slice(0, 20)}`}
              element={element}
              index={index}
              isPresenting={isPresenting}
            />
          ))}
        </AnimatePresence>
      </div>

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
}

function ElementRenderer({ element, index, isPresenting }: ElementRendererProps) {
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
        return (
          <h1
            className={`
              font-display font-bold text-slide-text
              ${isPresenting ? 'text-5xl md:text-7xl lg:text-8xl' : 'text-3xl md:text-4xl'}
              leading-tight tracking-tight
            `}
          >
            <HighlightedText text={element.content} />
          </h1>
        );

      case 'subtitle':
        return (
          <h2
            className={`
              font-display font-semibold text-slide-text
              ${isPresenting ? 'text-3xl md:text-5xl lg:text-6xl' : 'text-xl md:text-2xl'}
              leading-tight
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
              ${isPresenting ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-lg md:text-xl'}
              leading-relaxed
            `}
          >
            <HighlightedText text={element.content} />
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

      default:
        return <span>{element.content}</span>;
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      {renderContent()}
    </motion.div>
  );
}

// ============================================
// Highlighted Text (for `backtick` markers)
// ============================================

function HighlightedText({ text }: { text: string }) {
  // Split by backticks and render highlighted portions
  const parts = text.split(/`([^`]+)`/);

  return (
    <>
      {parts.map((part, index) => {
        // Odd indices are the highlighted parts (between backticks)
        if (index % 2 === 1) {
          return (
            <span
              key={index}
              className="text-slide-accent font-semibold px-2 py-0.5 bg-slide-accent/10 rounded"
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
