'use client';

// ============================================
// RIFF - Embed Client Component
// Minimal presenter optimized for iframe embedding
// ============================================

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ParsedDeck } from '@/lib/types';
import { SlideRenderer } from './SlideRenderer';
import { countReveals } from '@/lib/parser';

interface EmbedClientProps {
  deck: ParsedDeck;
  initialSlide?: number;
  themeCSS?: string;
}

export function EmbedClient({
  deck,
  initialSlide = 0,
  themeCSS,
}: EmbedClientProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [currentReveal, setCurrentReveal] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const slide = deck.slides[currentSlide];
  const totalSlides = deck.slides.length;
  const maxReveals = slide ? countReveals(slide) - 1 : 0;

  // Navigation
  const goNext = useCallback(() => {
    if (currentReveal < maxReveals) {
      setCurrentReveal((r) => r + 1);
    } else if (currentSlide < totalSlides - 1) {
      setCurrentSlide((s) => s + 1);
      setCurrentReveal(0);
    }
  }, [currentReveal, maxReveals, currentSlide, totalSlides]);

  const goPrev = useCallback(() => {
    if (currentReveal > 0) {
      setCurrentReveal((r) => r - 1);
    } else if (currentSlide > 0) {
      const prevSlide = deck.slides[currentSlide - 1];
      const prevMaxReveals = prevSlide ? countReveals(prevSlide) - 1 : 0;
      setCurrentSlide((s) => s - 1);
      setCurrentReveal(prevMaxReveals);
    }
  }, [currentReveal, currentSlide, deck.slides]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'Backspace':
          e.preventDefault();
          goPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Touch/swipe support
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goNext(); // Swipe left = next
      } else {
        goPrev(); // Swipe right = prev
      }
    }

    touchStartX.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-slide-bg overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Inject theme CSS */}
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

      {/* Main slide - click to advance */}
      <div
        className="w-full h-full cursor-pointer"
        onClick={goNext}
        onContextMenu={(e) => {
          e.preventDefault();
          goPrev();
        }}
      >
        {slide && (
          <SlideRenderer
            slide={slide}
            revealStep={currentReveal}
            isPresenting={true}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slide-surface/30">
        <motion.div
          className="h-full bg-slide-accent"
          initial={false}
          animate={{
            width: `${((currentSlide + (currentReveal / (maxReveals + 1))) / totalSlides) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Navigation arrows - visible on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="pointer-events-none"
      >
        {/* Left arrow */}
        {currentSlide > 0 || currentReveal > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : null}

        {/* Right arrow */}
        {currentSlide < totalSlides - 1 || currentReveal < maxReveals ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : null}
      </motion.div>

      {/* Slide counter - always visible, subtle */}
      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-xs text-white/60 font-mono">
        {currentSlide + 1} / {totalSlides}
      </div>
    </div>
  );
}
