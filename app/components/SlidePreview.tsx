'use client';

// ============================================
// VIBE SLIDES - Slide Preview Component
// Minimal, Vercel-inspired design
// ============================================

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Play,
  Sparkles,
  Layout,
  Palette,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { SlideRenderer } from './SlideRenderer';
import { GeneratedSlide } from './GeneratedSlide';
import { SlideGeneratorSettings } from './SlideGeneratorSettings';
import { ThemeCustomizer } from './ThemeCustomizer';
import { ImageStyleSelector } from './ImageStyleSelector';
import { countReveals } from '@/lib/parser';
import { ImageSlot } from '@/lib/types';

interface SlidePreviewProps {
  deckId: string;
  onSave?: () => Promise<void>;
  onGenerateTheme?: (prompt: string, systemPrompt?: string) => Promise<void>;
  onResetTheme?: () => void;
  isGeneratingTheme?: boolean;
  onImageChange?: (description: string, slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (description: string, slot: ImageSlot) => void;
}

export function SlidePreview({
  deckId,
  onSave,
  onGenerateTheme,
  onResetTheme,
  isGeneratingTheme = false,
  onImageChange,
  onActiveSlotChange,
}: SlidePreviewProps) {
  const {
    parsedDeck,
    presentation,
    themePrompt,
    currentTheme,
    nextSlide,
    prevSlide,
    goToSlide,
    toggleSpeakerNotes,
    toggleRenderMode,
  } = useStore();

  const isGeneratedMode = presentation.renderMode === 'generated';

  const currentSlide = parsedDeck?.slides[presentation.currentSlide];
  const totalSlides = parsedDeck?.slides.length || 0;
  const currentReveals = currentSlide ? countReveals(currentSlide) : 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      <div className="flex items-center justify-center h-full bg-background rounded-lg border border-border">
        <p className="text-text-quaternary text-sm">No slides to preview</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg overflow-hidden border border-border">
      {/* Inject theme CSS if available */}
      {currentTheme?.css && <style dangerouslySetInnerHTML={{ __html: currentTheme.css }} />}

      {/* Slide view */}
      <div className="flex-1 relative overflow-hidden group">
        {isGeneratedMode ? (
          <GeneratedSlide
            slide={currentSlide}
            slideIndex={presentation.currentSlide}
            deckId={deckId}
            revealStep={presentation.currentReveal}
            themePrompt={themePrompt}
            isPresenting={false}
          />
        ) : (
          <SlideRenderer
            slide={currentSlide}
            revealStep={presentation.currentReveal}
            isPresenting={false}
            imageManifest={parsedDeck.imageManifest}
            onImageChange={onImageChange}
            onActiveSlotChange={onActiveSlotChange}
          />
        )}

        {/* Navigation overlays */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-surface/90 hover:bg-surface-hover border border-border rounded-md text-text-secondary hover:text-text-primary transition-all opacity-0 group-hover:opacity-100"
          disabled={presentation.currentSlide === 0 && presentation.currentReveal === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-surface/90 hover:bg-surface-hover border border-border rounded-md text-text-secondary hover:text-text-primary transition-all opacity-0 group-hover:opacity-100"
          disabled={presentation.currentSlide === totalSlides - 1 && presentation.currentReveal >= currentReveals - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Speaker notes */}
      {presentation.showSpeakerNotes && currentSlide.speakerNotes && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border bg-surface"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-xs text-text-tertiary uppercase tracking-wider">
                Notes
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {currentSlide.speakerNotes}
            </p>
          </div>
        </motion.div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        {/* Slide counter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-text-secondary">
            {presentation.currentSlide + 1}
            <span className="text-text-quaternary"> / {totalSlides}</span>
          </span>
          {currentReveals > 1 && (
            <span className="text-xs text-text-quaternary">
              step {presentation.currentReveal + 1}/{currentReveals}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Render mode toggle */}
          <div className="flex items-center bg-surface rounded-md p-0.5 border border-border">
            <button
              onClick={() => !isGeneratedMode || toggleRenderMode()}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all
                ${!isGeneratedMode
                  ? 'bg-background text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
              title="Standard mode"
            >
              <Layout className="w-3 h-3" />
              Standard
            </button>
            <button
              onClick={() => isGeneratedMode || toggleRenderMode()}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all
                ${isGeneratedMode
                  ? 'bg-background text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
              title="AI-generated slides"
            >
              <Sparkles className="w-3 h-3" />
              Generated
            </button>
          </div>

          {/* Slide generator settings (only show when in generated mode) */}
          {isGeneratedMode && <SlideGeneratorSettings />}

          <div className="w-px h-5 bg-border" />

          {/* Theme customizer */}
          {onGenerateTheme && (
            <ThemeCustomizer
              currentPrompt={themePrompt}
              onGenerate={onGenerateTheme}
              onReset={onResetTheme || (() => {})}
              isGenerating={isGeneratingTheme}
            />
          )}

          {/* Image style selector */}
          <ImageStyleSelector />

          <div className="w-px h-5 bg-border" />

          <button
            onClick={toggleSpeakerNotes}
            className={`
              p-1.5 rounded-md transition-colors
              ${
                presentation.showSpeakerNotes
                  ? 'bg-surface text-text-primary'
                  : 'hover:bg-surface text-text-tertiary hover:text-text-secondary'
              }
            `}
            title="Toggle notes (Cmd+N)"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={async () => {
              // Save before presenting to ensure presenter has latest content
              if (onSave) {
                await onSave();
              }
              window.open(`/present/${encodeURIComponent(deckId)}`, '_blank');
            }}
            className="
              flex items-center gap-1.5 px-3 py-1.5
              bg-text-primary hover:bg-text-secondary
              rounded-md text-background text-sm
              transition-colors
            "
          >
            <Play className="w-3.5 h-3.5" />
            Present
          </button>
        </div>
      </div>

      {/* Mini slide navigator */}
      <div className="px-4 py-2 border-t border-border overflow-x-auto">
        <div className="flex gap-1.5">
          {parsedDeck.slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`
                flex-shrink-0 w-14 h-9 rounded overflow-hidden
                border transition-all
                ${
                  index === presentation.currentSlide
                    ? 'border-text-primary'
                    : 'border-border hover:border-border-hover'
                }
              `}
            >
              <div className="w-full h-full bg-slide-bg flex items-center justify-center">
                <span className="text-[9px] font-mono text-slide-muted">
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
