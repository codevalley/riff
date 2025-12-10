'use client';

// ============================================
// VIBE SLIDES - Slide Editor Component
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, FileText, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { parseSlideMarkdown } from '@/lib/parser';

interface SlideEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function SlideEditor({ content, onChange, onSave, isSaving = false }: SlideEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { setParsedDeck } = useStore();

  // Track the last saved content to detect changes
  const lastSavedContent = useRef(content);

  // Only sync when content changes from external source (deck switch)
  const isExternalUpdate = useRef(false);

  // Sync with external content only when switching decks
  useEffect(() => {
    // If content changed externally (deck switch), reset
    if (content !== lastSavedContent.current && !hasUnsavedChanges) {
      setLocalContent(content);
      lastSavedContent.current = content;
      setHasUnsavedChanges(false);
    }
  }, [content, hasUnsavedChanges]);

  // Parse on change (debounced)
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

  // Keyboard shortcut for save
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

  // Count slides
  const slideCount = (localContent.match(/^---$/gm) || []).length;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Slide Editor</span>
          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
            {slideCount} slides
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-amber-400 text-xs"
            >
              <AlertCircle className="w-3 h-3" />
              Unsaved
            </motion.div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={localContent}
          onChange={(e) => handleChange(e.target.value)}
          className="
            w-full h-full p-4
            bg-transparent text-slate-200 font-mono text-sm
            resize-none outline-none
            placeholder:text-slate-600
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

      {/* Footer with syntax hint */}
      <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700/50">
        <p className="text-xs text-slate-500">
          <span className="text-slate-400">Tip:</span> Use{' '}
          <code className="bg-slate-700/50 px-1 rounded">---</code> to separate slides,{' '}
          <code className="bg-slate-700/50 px-1 rounded">**pause**</code> for reveals,{' '}
          <code className="bg-slate-700/50 px-1 rounded">`text`</code> to highlight
        </p>
      </div>
    </div>
  );
}
