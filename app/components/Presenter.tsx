'use client';

// ============================================
// VIBE SLIDES - Full Screen Presenter Component
// ============================================

import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  Grid,
  Maximize,
  Minimize,
  RotateCcw,
  Play,
  Pause,
} from 'lucide-react';
import { ParsedDeck, ImageSlot } from '@/lib/types';
import { SlideRenderer } from './SlideRenderer';
import { countReveals } from '@/lib/parser';
import { analytics } from '@/lib/analytics';

interface PresenterProps {
  deck: ParsedDeck;
  deckId: string;
  initialSlide?: number;
  themeCSS?: string;
  isSharedView?: boolean;
  onImageChange?: (description: string, slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (description: string, slot: ImageSlot) => void;
  sceneContext?: string;
}

export function Presenter({
  deck,
  deckId,
  initialSlide = 0,
  themeCSS,
  isSharedView = false,
  onImageChange,
  onActiveSlotChange,
  sceneContext,
}: PresenterProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [currentReveal, setCurrentReveal] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayInterval] = useState(3000); // 3 seconds per slide/reveal
  const [autoPlayProgress, setAutoPlayProgress] = useState(0); // 0-1 for smooth animation
  const [showMobileControls, setShowMobileControls] = useState(true); // Tap to show/hide on mobile
  const [controlsAutoHideTimer, setControlsAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  const slide = deck.slides[currentSlide];
  const totalSlides = deck.slides.length;
  const maxReveals = slide ? countReveals(slide) - 1 : 0;
  const isAtEnd = currentSlide >= totalSlides - 1 && currentReveal >= maxReveals;

  // Track slide views for shared/published decks
  useEffect(() => {
    if (isSharedView) {
      analytics.slideViewed(currentSlide, totalSlides);
      // Track deck completion when viewer reaches the last slide
      if (currentSlide === totalSlides - 1) {
        analytics.deckCompleted();
      }
    }
  }, [currentSlide, totalSlides, isSharedView]);

  // Auto-start autoplay on mobile
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 640px), (orientation: portrait)').matches;
    if (isMobile) {
      setIsAutoPlaying(true);
    }
  }, []); // Only on mount

  // Navigation
  const goNext = useCallback(() => {
    setAutoPlayProgress(0); // Reset progress immediately to prevent flicker
    if (currentReveal < maxReveals) {
      setCurrentReveal((r) => r + 1);
    } else if (currentSlide < totalSlides - 1) {
      setCurrentSlide((s) => s + 1);
      setCurrentReveal(0);
    }
  }, [currentReveal, maxReveals, currentSlide, totalSlides]);

  const goPrev = useCallback(() => {
    setAutoPlayProgress(0); // Reset progress immediately to prevent flicker
    if (currentReveal > 0) {
      setCurrentReveal((r) => r - 1);
    } else if (currentSlide > 0) {
      const prevSlide = deck.slides[currentSlide - 1];
      const prevMaxReveals = prevSlide ? countReveals(prevSlide) - 1 : 0;
      setCurrentSlide((s) => s - 1);
      setCurrentReveal(prevMaxReveals);
    }
  }, [currentReveal, currentSlide, deck.slides]);

  const goToSlide = useCallback((index: number) => {
    setAutoPlayProgress(0); // Reset progress immediately to prevent flicker
    setCurrentSlide(index);
    setCurrentReveal(0);
    setShowOverview(false);
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
        case 'PageDown':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'Backspace':
        case 'PageUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          if (showOverview) {
            setShowOverview(false);
          } else if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            // Exit presentation - close tab or go back
            window.close();
          }
          break;
        case 'x':
        case 'q':
          // Exit presentation
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          window.close();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'n':
          setShowNotes((n) => !n);
          break;
        case 'g':
        case 'o':
          setShowOverview((o) => !o);
          break;
        case 'Home':
          goToSlide(0);
          break;
        case 'End':
          goToSlide(totalSlides - 1);
          break;
        case 'a':
        case 'p':
          // Toggle auto-play
          setIsAutoPlaying((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, goToSlide, toggleFullscreen, showOverview, totalSlides]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-play with smooth progress animation
  useEffect(() => {
    if (!isAutoPlaying) {
      setAutoPlayProgress(0);
      return;
    }

    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / autoPlayInterval, 1);
      setAutoPlayProgress(progress);

      if (progress >= 1) {
        // Check if we're at the last slide and last reveal
        const isLastSlide = currentSlide >= totalSlides - 1;
        const isLastReveal = currentReveal >= maxReveals;

        if (isLastSlide && isLastReveal) {
          setIsAutoPlaying(false);
        } else {
          goNext();
        }
        return;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAutoPlaying, autoPlayInterval, currentSlide, currentReveal, totalSlides, maxReveals, goNext]);

  // Toggle auto-play
  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  // Auto-hide controls after 2 seconds on mobile (but not during autoplay)
  const scheduleControlsHide = useCallback(() => {
    // Clear existing timer
    if (controlsAutoHideTimer) {
      clearTimeout(controlsAutoHideTimer);
    }
    // Don't auto-hide during autoplay - user needs access to pause button
    if (isAutoPlaying) {
      return;
    }
    // Set new timer to hide controls after 4 seconds
    const timer = setTimeout(() => {
      setShowMobileControls(false);
    }, 4000);
    setControlsAutoHideTimer(timer);
  }, [controlsAutoHideTimer, isAutoPlaying]);

  // Show controls initially, then auto-hide
  useEffect(() => {
    if (showMobileControls) {
      scheduleControlsHide();
    }
    return () => {
      if (controlsAutoHideTimer) {
        clearTimeout(controlsAutoHideTimer);
      }
    };
  }, [showMobileControls]); // eslint-disable-line react-hooks/exhaustive-deps

  // When autoplay starts, ensure controls are visible and cancel any pending hide timer
  useEffect(() => {
    if (isAutoPlaying) {
      setShowMobileControls(true);
      // Cancel any pending auto-hide timer immediately
      if (controlsAutoHideTimer) {
        clearTimeout(controlsAutoHideTimer);
        setControlsAutoHideTimer(null);
      }
    }
  }, [isAutoPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle slide tap - on mobile toggle controls, on desktop advance slide
  const handleSlideTap = useCallback((e: React.MouseEvent) => {
    // Check if we're on mobile (portrait or small screen)
    const isMobile = window.matchMedia('(max-width: 640px), (orientation: portrait)').matches;
    if (isMobile) {
      setShowMobileControls(prev => !prev);
    } else {
      goNext();
    }
  }, [goNext]);

  return (
    <div className="relative w-full h-dvh bg-slide-bg overflow-hidden">
      {/* Inject theme CSS */}
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

      {/* Safe area and dvh fallback for older browsers */}
      <style dangerouslySetInnerHTML={{ __html: `
        @supports not (height: 100dvh) {
          .h-dvh { height: 100vh; }
        }
      `}} />

      {/* Main slide */}
      <div
        className="w-full h-full"
        onClick={handleSlideTap}
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
            imageManifest={deck.imageManifest}
            onImageChange={onImageChange}
            onActiveSlotChange={onActiveSlotChange}
            sceneContext={sceneContext}
          />
        )}
      </div>

      {/* Progress bar - positioned above safe area */}
      <div className="absolute left-0 right-0 h-1 bg-slide-surface/30 z-50" style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {(() => {
          // Calculate base progress (completed slides + reveals)
          const baseProgress = (currentSlide + (currentReveal / (maxReveals + 1))) / totalSlides;
          // Calculate step size (how much one reveal/slide advances the bar)
          const stepSize = 1 / totalSlides / (maxReveals + 1);
          // When auto-playing, smoothly fill to the next step
          const totalProgress = isAutoPlaying
            ? baseProgress + (stepSize * autoPlayProgress)
            : baseProgress;

          return (
            <motion.div
              className="h-full bg-slide-accent"
              initial={false}
              animate={{ width: `${totalProgress * 100}%` }}
              transition={{ duration: isAutoPlaying ? 0 : 0.3 }}
            />
          );
        })()}
      </div>

      {/* ========== MOBILE CONTROLS (portrait / small screens) ========== */}
      <AnimatePresence>
        {showMobileControls && (
          <>
            {/* Left edge - Prev button (hidden during autoplay) */}
            {!isAutoPlaying && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="sm:hidden fixed left-2 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/40 backdrop-blur-sm rounded-full text-white/70 active:text-white active:bg-black/60"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}

            {/* Right edge - Next button (hidden during autoplay) */}
            {!isAutoPlaying && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="sm:hidden fixed right-2 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/40 backdrop-blur-sm rounded-full text-white/70 active:text-white active:bg-black/60"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            )}

            {/* Bottom bar - Auto-play + counter (left) and Riff badge (right) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="sm:hidden fixed left-3 right-3 z-50 flex items-center justify-between"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            >
              {/* Left side: Auto-play/Reset + counter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAtEnd && !isAutoPlaying) {
                      goToSlide(0);
                    } else {
                      toggleAutoPlay();
                    }
                  }}
                  className={`p-3 rounded-full backdrop-blur-sm transition-colors bg-black/50 ${
                    isAutoPlaying ? 'text-emerald-400' : 'text-white/80'
                  }`}
                >
                  {isAutoPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : isAtEnd ? (
                    <RotateCcw className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
                <span className="text-sm font-mono tabular-nums px-2 py-1 rounded bg-black/50 backdrop-blur-sm text-white/80">
                  {currentSlide + 1}/{totalSlides}
                </span>
              </div>

              {/* Right side: Riff badge */}
              <a
                href="https://www.riff.im"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-full"
              >
                <svg viewBox="0 0 512 512" fill="none" className="w-4 h-4">
                  <path d="M451.755 105.052L415.896 377.78C413.449 396.325 396.381 409.253 377.968 406.806L358.815 404.244L323.072 132.731C320.018 109.916 300.503 92.717 277.455 92.717C275.5 92.717 273.43 92.8328 271.476 93.0789L196.951 102.836L200.975 71.9718C203.422 53.4271 220.374 40.3837 238.903 42.8156L422.597 67.0932C441.141 69.5542 454.199 86.5066 451.753 105.051L451.755 105.052Z" className="fill-white/40" />
                  <path d="M346.87 407.08L310.982 134.352C308.55 115.836 291.554 102.793 273.039 105.225L89.3715 129.386C70.8557 131.819 57.8122 148.814 60.2441 167.329L96.132 440.057C98.5641 458.573 115.56 471.616 134.075 469.184L317.743 445.023C336.258 442.591 349.302 425.595 346.87 407.08Z" className="fill-white/60" />
                </svg>
                <span className="text-xs text-white/60">riff</span>
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== DESKTOP CONTROLS (landscape / large screens) ========== */}
      <div className="hidden sm:block absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="presenter-controls flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full">
          {/* Prev button */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="slide-nav-button flex items-center justify-center p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Slide counter */}
          <span className="slide-counter text-white/70 text-sm font-mono px-3 whitespace-nowrap tabular-nums">
            {currentSlide + 1}/{totalSlides}
          </span>

          {/* Next button */}
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="slide-nav-button flex items-center justify-center p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Auto-play / Reset button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAtEnd && !isAutoPlaying) {
                goToSlide(0);
              } else {
                toggleAutoPlay();
              }
            }}
            className={`slide-nav-button flex items-center justify-center p-2 rounded-full transition-colors hover:bg-white/10 ${
              isAutoPlaying ? 'text-emerald-400' : 'text-white/70 hover:text-white'
            }`}
            title={isAutoPlaying ? "Pause (A)" : isAtEnd ? "Restart (Home)" : "Auto-play (A)"}
          >
            {isAutoPlaying ? (
              <Pause className="w-5 h-5" />
            ) : isAtEnd ? (
              <RotateCcw className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Restart button */}
          {currentSlide > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToSlide(0); }}
              className="slide-nav-button flex items-center justify-center p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
              title="Go to start (Home)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          {/* Notes button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowNotes((n) => !n); }}
            className={`slide-nav-button flex items-center justify-center p-2 rounded-full transition-colors ${
              showNotes ? 'bg-amber-500/30 text-amber-300' : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title="Toggle notes (N)"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Overview button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowOverview((o) => !o); }}
            className={`slide-nav-button flex items-center justify-center p-2 rounded-full transition-colors ${
              showOverview ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title="Overview (G)"
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* Fullscreen button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className="slide-nav-button flex items-center justify-center p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Speaker notes panel */}
      <AnimatePresence>
        {showNotes && slide?.speakerNotes && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-4xl mx-auto p-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Speaker Notes</span>
              </div>
              <p className="text-white/80 text-lg leading-relaxed whitespace-pre-wrap">
                {slide.speakerNotes}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide overview */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md overflow-auto z-50"
            onClick={() => setShowOverview(false)}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Slide Overview</h2>
                <button
                  onClick={() => setShowOverview(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {deck.slides.map((s, index) => (
                  <button
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(index);
                    }}
                    className={`
                      relative aspect-video rounded-lg overflow-hidden
                      border-2 transition-all
                      ${
                        index === currentSlide
                          ? 'border-slide-accent ring-2 ring-slide-accent/30'
                          : 'border-white/10 hover:border-white/30'
                      }
                    `}
                  >
                    <div className="absolute inset-0 transform scale-[0.2] origin-top-left w-[500%] h-[500%]">
                      <SlideRenderer
                        slide={s}
                        revealStep={999}
                        isPresenting={false}
                        imageManifest={deck.imageManifest}
                        sceneContext={sceneContext}
                      />
                    </div>
                    <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-black/60 rounded text-xs text-white/70">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard hints (visible briefly on load) */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute top-4 right-4 text-white/40 text-xs space-y-1 pointer-events-none"
      >
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Space</kbd> Next</div>
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">A</kbd> Auto-play</div>
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Home</kbd> Restart</div>
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">F</kbd> Fullscreen</div>
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">N</kbd> Notes</div>
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">G</kbd> Overview</div>
      </motion.div>
    </div>
  );
}
