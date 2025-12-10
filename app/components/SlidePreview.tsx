'use client';

// ============================================
// VIBE SLIDES - Slide Preview Component
// ============================================

import { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Play,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { SlideRenderer } from './SlideRenderer';
import { countReveals } from '@/lib/parser';
import Link from 'next/link';

interface SlidePreviewProps {
  deckId: string;
}

export function SlidePreview({ deckId }: SlidePreviewProps) {
  const {
    parsedDeck,
    presentation,
    nextSlide,
    prevSlide,
    goToSlide,
    toggleSpeakerNotes,
  } = useStore();

  const currentSlide = parsedDeck?.slides[presentation.currentSlide];
  const totalSlides = parsedDeck?.slides.length || 0;
  const currentReveals = currentSlide ? countReveals(currentSlide) : 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'Backspace':
          e.preventDefault();
          prevSlide();
          break;
        case 'n':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            toggleSpeakerNotes();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, toggleSpeakerNotes]);

  if (!parsedDeck || !currentSlide) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-xl">
        <p className="text-slate-500">No slides to preview</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
      {/* Slide view */}
      <div className="flex-1 relative overflow-hidden">
        <SlideRenderer
          slide={currentSlide}
          revealStep={presentation.currentReveal}
          isPresenting={false}
        />

        {/* Navigation overlays */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-300 transition-all opacity-0 hover:opacity-100 focus:opacity-100"
          disabled={presentation.currentSlide === 0 && presentation.currentReveal === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-300 transition-all opacity-0 hover:opacity-100 focus:opacity-100"
          disabled={presentation.currentSlide === totalSlides - 1 && presentation.currentReveal >= currentReveals - 1}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Speaker notes (collapsible) */}
      {presentation.showSpeakerNotes && currentSlide.speakerNotes && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-700/50 bg-slate-800/50"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                Speaker Notes
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {currentSlide.speakerNotes}
            </p>
          </div>
        </motion.div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-t border-slate-700/50">
        {/* Slide counter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-slate-400">
            {presentation.currentSlide + 1} / {totalSlides}
          </span>
          {currentReveals > 1 && (
            <span className="text-xs text-slate-500">
              (reveal {presentation.currentReveal + 1}/{currentReveals})
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeakerNotes}
            className={`
              p-2 rounded-lg transition-colors
              ${
                presentation.showSpeakerNotes
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'hover:bg-slate-700 text-slate-400'
              }
            `}
            title="Toggle speaker notes (Cmd+N)"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <Link
            href={`/present/${encodeURIComponent(deckId)}`}
            target="_blank"
            className="
              flex items-center gap-2 px-3 py-2
              bg-emerald-600 hover:bg-emerald-500
              rounded-lg text-white text-sm font-medium
              transition-colors
            "
          >
            <Play className="w-4 h-4" />
            Present
          </Link>
        </div>
      </div>

      {/* Mini slide navigator */}
      <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700/50 overflow-x-auto">
        <div className="flex gap-2">
          {parsedDeck.slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`
                flex-shrink-0 w-16 h-10 rounded-md overflow-hidden
                border-2 transition-all
                ${
                  index === presentation.currentSlide
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-700 hover:border-slate-600'
                }
              `}
            >
              <div className="w-full h-full bg-slide-bg flex items-center justify-center">
                <span className="text-[8px] font-mono text-slide-muted">
                  {index + 1}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
