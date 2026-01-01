'use client';

// ============================================
// RIFF - Embed Client Component
// Minimal presenter optimized for iframe embedding
// ============================================

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
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
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // Design dimensions (16:9 aspect ratio)
  const DESIGN_WIDTH = 1280;
  const DESIGN_HEIGHT = 720;

  // Calculate scale to fit content with safety margin
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = clientWidth / DESIGN_WIDTH;
      const scaleY = clientHeight / DESIGN_HEIGHT;
      // Use 0.92 factor for breathing room (accounts for padding/margins)
      setScale(Math.min(scaleX, scaleY, 1) * 0.92);
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

  const goToStart = useCallback(() => {
    setCurrentSlide(0);
    setCurrentReveal(0);
  }, []);

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
        case 'Home':
          e.preventDefault();
          goToStart();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, goToStart]);

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
      {/* Fonts - proxied through our domain to bypass CSP restrictions in third-party embeds */}
      <link
        href="/api/fonts?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700"
        rel="stylesheet"
      />

      <div
        ref={containerRef}
        className="relative w-full h-dvh bg-slide-bg overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Inject theme CSS */}
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

        {/* Override min-h-screen for embed context + dvh fallback + safe areas */}
        <style dangerouslySetInnerHTML={{ __html: `
          .embed-slide-container .min-h-screen { min-height: 100% !important; }
          .embed-slide-container { width: 100%; height: 100%; }
          @supports not (height: 100dvh) {
            .h-dvh { height: 100vh; }
          }
        `}} />

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
            className="embed-slide-container"
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

        {/* Controls overlay - always visible, on top of content */}
        <div className="absolute inset-0 pointer-events-none z-50">
          {/* Progress bar */}
          <div
            className="absolute left-0 right-0 h-1 bg-slide-surface/30"
            style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <motion.div
              className="h-full bg-slide-accent"
              initial={false}
              animate={{
                width: `${((currentSlide + (currentReveal / (maxReveals + 1))) / totalSlides) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Navigation arrows */}
          {(currentSlide > 0 || currentReveal > 0) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {(currentSlide < totalSlides - 1 || currentReveal < maxReveals) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/70 hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Slide counter with reset button */}
          <div
            className="absolute right-3 flex items-center gap-2"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            {currentSlide > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToStart();
                }}
                className="pointer-events-auto p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded text-white/50 hover:text-white transition-all"
                title="Go to start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-xs text-white/60 font-mono">
              {currentSlide + 1} / {totalSlides}
            </div>
          </div>

          {/* Riff Badge */}
          <Link
            href="https://www.riff.im"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto absolute left-8 flex items-center gap-1.5 px-2 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded text-white/60 hover:text-white transition-all"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            <RiffIcon size={14} primaryColor="currentColor" secondaryColor="currentColor" />
            <span className="text-xs" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Riff</span>
          </Link>
        </div>
      </div>
    </>
  );
}
