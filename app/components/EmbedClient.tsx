'use client';

// ============================================
// RIFF - Embed Client Component
// Minimal presenter optimized for iframe embedding
// ============================================

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ParsedDeck } from '@/lib/types';
import { SlideRenderer } from './SlideRenderer';
import { countReveals } from '@/lib/parser';
import { RiffIcon } from './RiffIcon';

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
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // Design dimensions (16:9 aspect ratio)
  const DESIGN_WIDTH = 1280;
  const DESIGN_HEIGHT = 720;

  // Calculate scale to fit content
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = clientWidth / DESIGN_WIDTH;
      const scaleY = clientHeight / DESIGN_HEIGHT;
      setScale(Math.min(scaleX, scaleY, 1)); // Don't scale up, only down
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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
    <>
      {/* Google Fonts for embeds */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

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

        {/* Main slide - scaled to fit, click to advance */}
        <div
          ref={slideRef}
          className="w-full h-full cursor-pointer flex items-center justify-center"
          onClick={goNext}
          onContextMenu={(e) => {
            e.preventDefault();
            goPrev();
          }}
        >
          <div
            style={{
              width: DESIGN_WIDTH,
              height: DESIGN_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            {slide && (
              <SlideRenderer
                slide={slide}
                revealStep={currentReveal}
                isPresenting={true}
                imageManifest={deck.imageManifest}
              />
            )}
          </div>
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

        {/* Slide counter */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-xs text-white/60 font-mono">
          {currentSlide + 1} / {totalSlides}
        </div>

        {/* Riff Badge */}
        <Link
          href="https://www.riff.im"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-xs text-white/60 hover:text-white hover:bg-black/60 transition-all"
        >
          <RiffIcon size={14} primaryColor="currentColor" secondaryColor="currentColor" />
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Riff</span>
        </Link>
      </div>
    </>
  );
}
