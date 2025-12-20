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
} from 'lucide-react';
import { ParsedDeck, ImageSlot } from '@/lib/types';
import { SlideRenderer } from './SlideRenderer';
import { countReveals } from '@/lib/parser';

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

  const goToSlide = useCallback((index: number) => {
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

  return (
    <div className="relative w-full h-screen bg-slide-bg overflow-hidden">
      {/* Inject theme CSS */}
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

      {/* Main slide */}
      <div
        className="w-full h-full cursor-none"
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
            imageManifest={deck.imageManifest}
            onImageChange={onImageChange}
            onActiveSlotChange={onActiveSlotChange}
            sceneContext={sceneContext}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slide-surface/30 z-50">
        <motion.div
          className="h-full bg-slide-accent"
          initial={false}
          animate={{
            width: `${((currentSlide + (currentReveal / (maxReveals + 1))) / totalSlides) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Controls - always visible */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-white/70 text-sm font-mono px-3">
            {currentSlide + 1} / {totalSlides}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {currentSlide > 0 && (
            <>
              <div className="w-px h-6 bg-white/20 mx-2" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(0);
                }}
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                title="Go to start (Home)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="w-px h-6 bg-white/20 mx-2" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotes((n) => !n);
            }}
            className={`p-2 rounded-full transition-colors ${
              showNotes ? 'bg-amber-500/30 text-amber-300' : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title="Toggle notes (N)"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOverview((o) => !o);
            }}
            className={`p-2 rounded-full transition-colors ${
              showOverview ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title="Overview (G)"
          >
            <Grid className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
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
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Home</kbd> Restart</div>
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">F</kbd> Fullscreen</div>
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">N</kbd> Notes</div>
        <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">G</kbd> Overview</div>
      </motion.div>
    </div>
  );
}
