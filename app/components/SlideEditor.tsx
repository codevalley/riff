'use client';

// ============================================
// VIBE SLIDES - Slide Editor Component
// Single textarea with slide position indicator
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, FileText, Circle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { parseSlideMarkdown } from '@/lib/parser';

interface SlideEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

// Find the character position where slide N starts (0-indexed)
function getSlidePosition(content: string, slideIndex: number): number {
  if (slideIndex === 0) return 0;

  const lines = content.split('\n');
  let slideCount = 0;
  let charPos = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      slideCount++;
      if (slideCount === slideIndex) {
        return charPos + lines[i].length + 1;
      }
    }
    charPos += lines[i].length + 1;
  }

  return 0;
}

// Find which slide the cursor is in based on character position
function getSlideFromPosition(content: string, cursorPos: number): number {
  const textBefore = content.substring(0, cursorPos);
  const separators = textBefore.match(/^---$/gm);
  return separators ? separators.length : 0;
}

export function SlideEditor({ content, onChange, onSave, isSaving = false }: SlideEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorSlide, setEditorSlide] = useState(0);
  const { setParsedDeck, presentation, goToSlide, parsedDeck } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lastSavedContent = useRef(content);
  const lastScrolledSlide = useRef(-1);
  const isEditorDriven = useRef(false);

  useEffect(() => {
    if (content !== lastSavedContent.current && !hasUnsavedChanges) {
      setLocalContent(content);
      lastSavedContent.current = content;
      setHasUnsavedChanges(false);
    }
  }, [content, hasUnsavedChanges]);

  // Handle cursor position changes - update preview to match
  const handleCursorChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !parsedDeck) return;

    const cursorPos = textarea.selectionStart;
    // Use textarea.value directly to avoid stale state issues
    let slideIndex = getSlideFromPosition(textarea.value, cursorPos);

    // Clamp to actual parsed slide count (parser filters empty slides)
    slideIndex = Math.min(slideIndex, parsedDeck.slides.length - 1);
    slideIndex = Math.max(0, slideIndex);

    setEditorSlide(slideIndex);

    if (slideIndex !== presentation.currentSlide) {
      isEditorDriven.current = true;
      lastScrolledSlide.current = slideIndex;
      goToSlide(slideIndex);
    }
  }, [presentation.currentSlide, goToSlide, parsedDeck]);

  // Scroll editor to current slide when preview changes (don't steal focus)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (isEditorDriven.current) {
      isEditorDriven.current = false;
      return;
    }

    if (presentation.currentSlide === lastScrolledSlide.current) return;
    lastScrolledSlide.current = presentation.currentSlide;

    const pos = getSlidePosition(localContent, presentation.currentSlide);

    // Calculate scroll position
    const textBefore = localContent.substring(0, pos);
    const lineNumber = textBefore.split('\n').length;
    const lineHeight = 24;
    const scrollTarget = Math.max(0, (lineNumber - 3) * lineHeight);

    textarea.scrollTop = scrollTarget;
    setEditorSlide(presentation.currentSlide);
  }, [presentation.currentSlide, localContent]);

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

  const handleChange = useCallback(
    (value: string) => {
      setLocalContent(value);
      setHasUnsavedChanges(value !== lastSavedContent.current);
      onChange(value);
    },
    [onChange]
  );

  const handleSave = useCallback(() => {
    onSave();
    lastSavedContent.current = localContent;
    setHasUnsavedChanges(false);
  }, [onSave, localContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Use actual parsed slide count (parser filters empty slides)
  const slideCount = parsedDeck?.slides.length || 1;

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
        </div>

        <div className="flex items-center gap-3">
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

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => handleChange(e.target.value)}
          onClick={handleCursorChange}
          onKeyUp={handleCursorChange}
          onSelect={handleCursorChange}
          className="
            w-full h-full p-4
            bg-transparent text-text-primary font-mono text-sm
            resize-none outline-none
            placeholder:text-text-quaternary
            leading-relaxed
          "
          placeholder={`# Your Presentation Title
### Subtitle goes here

> Speaker notes start with >

---

# New Slide

**pause**

### Elements after pause appear on click

---

[image: Description of the image you want]

# Images are auto-generated!`}
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-xs text-text-quaternary">
          <code className="text-text-tertiary">---</code> separate slides
          <span className="mx-2 text-border">·</span>
          <code className="text-text-tertiary">**pause**</code> for reveals
          <span className="mx-2 text-border">·</span>
          <code className="text-text-tertiary">`text`</code> to highlight
        </p>
      </div>
    </div>
  );
}
