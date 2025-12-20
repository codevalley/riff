'use client';

// ============================================
// VIBE SLIDES - Slide Editor Component
// CodeMirror-based editor with syntax highlighting
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, FileText, Circle, Wand2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { parseSlideMarkdown } from '@/lib/parser';
import { FormatHelpDialog } from '@/components/FormatHelpDialog';
import { CodeMirrorEditor } from '@/components/CodeMirrorEditor';

interface SlideEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onRevamp?: () => void;
  isSaving?: boolean;
  isLegacy?: boolean;
}

export function SlideEditor({ content, onChange, onSave, onRevamp, isSaving = false, isLegacy = false }: SlideEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorSlide, setEditorSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(1);
  const { setParsedDeck, presentation, goToSlide, parsedDeck } = useStore();

  const lastSavedContent = useRef(content);

  // Sync content from props (e.g., after external load)
  useEffect(() => {
    if (content !== lastSavedContent.current && !hasUnsavedChanges) {
      setLocalContent(content);
      lastSavedContent.current = content;
      setHasUnsavedChanges(false);
    }
  }, [content, hasUnsavedChanges]);

  // Handle slide change from CodeMirror (cursor moved to different slide)
  const handleSlideChange = useCallback(
    (slideIndex: number, total: number) => {
      // Clamp to actual parsed slide count
      const clampedIndex = parsedDeck
        ? Math.min(slideIndex, parsedDeck.slides.length - 1)
        : slideIndex;
      const finalIndex = Math.max(0, clampedIndex);

      setEditorSlide(finalIndex);
      setTotalSlides(total);

      // Sync with preview
      if (finalIndex !== presentation.currentSlide) {
        goToSlide(finalIndex);
      }
    },
    [presentation.currentSlide, goToSlide, parsedDeck]
  );

  // Parse content with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const parsed = parseSlideMarkdown(localContent);
        setParsedDeck(parsed);
      } catch (e) {
        console.error('Parse error:', e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localContent, setParsedDeck]);

  // Handle content change from CodeMirror
  const handleChange = useCallback(
    (value: string) => {
      setLocalContent(value);
      setHasUnsavedChanges(value !== lastSavedContent.current);
      onChange(value);
    },
    [onChange]
  );

  // Handle save
  const handleSave = useCallback(() => {
    onSave();
    lastSavedContent.current = localContent;
    setHasUnsavedChanges(false);
  }, [onSave, localContent]);

  // Use actual parsed slide count
  const slideCount = parsedDeck?.slides.length || totalSlides;

  // Current slide for CodeMirror (for external navigation sync)
  // Always pass the current slide - CodeMirrorEditor handles the loop prevention
  const currentSlideForEditor = presentation.currentSlide;

  return (
    <div className="flex flex-col h-full bg-background rounded-lg overflow-hidden border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-secondary">Editor</span>
          <span className="text-xs font-mono px-1.5 py-0.5 bg-surface rounded">
            <span className="text-text-primary">{editorSlide + 1}</span>
            <span className="text-text-quaternary"> / {slideCount}</span>
          </span>
          <span className="text-[10px] text-text-quaternary px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
            /
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRevamp && (
            <button
              onClick={onRevamp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-fast relative"
              title={isLegacy ? "Upgrade deck to v2 format" : "Revamp deck with AI"}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Revamp</span>
              {isLegacy && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              )}
            </button>
          )}

          <div className="h-4 w-px bg-border" />

          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-warning text-xs"
            >
              <Circle className="w-2 h-2 fill-current" />
              <span>Unsaved</span>
            </motion.div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm
              transition-all duration-fast
              ${
                hasUnsavedChanges
                  ? 'bg-text-primary text-background hover:bg-text-secondary'
                  : 'bg-surface text-text-quaternary cursor-not-allowed'
              }
            `}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* CodeMirror Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeMirrorEditor
          value={localContent}
          onChange={handleChange}
          onSlideChange={handleSlideChange}
          currentSlide={currentSlideForEditor}
          onSave={handleSave}
        />
      </div>

      {/* Footer with hints */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between">
        <p className="text-xs text-text-quaternary">
          Type <code className="text-cyan-400 bg-cyan-500/10 px-1 rounded">/</code> for commands
          <span className="mx-2 text-border">·</span>
          <code className="text-text-tertiary">---</code> separates slides
          <span className="mx-2 text-border">·</span>
          <code className="text-text-tertiary">**pause**</code> for reveals
        </p>
        <FormatHelpDialog />
      </div>
    </div>
  );
}
