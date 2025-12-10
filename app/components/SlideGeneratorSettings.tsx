'use client';

// ============================================
// VIBE SLIDES - Slide Generator Settings
// User can edit the system prompt for slide generation
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, RotateCcw, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { DEFAULT_SLIDE_SYSTEM_PROMPT } from '@/lib/prompts';
import { useStore } from '@/lib/store';

export function SlideGeneratorSettings() {
  const { customSlideSystemPrompt, setCustomSlideSystemPrompt } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    customSlideSystemPrompt || DEFAULT_SLIDE_SYSTEM_PROMPT
  );
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vibe-slides-slide-system-prompt');
    if (saved) {
      setSystemPrompt(saved);
      setCustomSlideSystemPrompt(saved);
    }
  }, [setCustomSlideSystemPrompt]);

  const handleSave = () => {
    const isCustom = systemPrompt !== DEFAULT_SLIDE_SYSTEM_PROMPT;
    if (isCustom) {
      setCustomSlideSystemPrompt(systemPrompt);
    } else {
      setCustomSlideSystemPrompt(null);
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SLIDE_SYSTEM_PROMPT);
    setCustomSlideSystemPrompt(null);
  };

  const isModified = systemPrompt !== DEFAULT_SLIDE_SYSTEM_PROMPT;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          p-1.5 rounded-md transition-colors
          hover:bg-surface text-text-tertiary hover:text-text-secondary
        "
        title="Slide generation settings"
      >
        <Settings className="w-4 h-4" />
        {isModified && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-warning rounded-full" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                absolute bottom-full right-0 mb-2 z-50
                w-[500px] max-h-[70vh] overflow-hidden
                bg-surface border border-border rounded-lg
                shadow-xl shadow-black/20
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-primary">Slide Generation Settings</span>
                  {isModified && (
                    <span className="px-1.5 py-0.5 bg-warning/20 text-warning rounded text-[10px]">
                      Modified
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-surface-hover rounded text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(70vh-120px)]">
                <p className="text-xs text-text-tertiary">
                  Customize the system prompt used when generating slides in "Generated" mode.
                  This controls how the AI creates HTML for your slides.
                </p>

                {/* Collapsible prompt editor */}
                <div className="border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => setShowFullPrompt(!showFullPrompt)}
                    className="
                      w-full flex items-center justify-between px-3 py-2
                      bg-background hover:bg-surface-hover
                      text-text-secondary text-xs
                      transition-colors
                    "
                  >
                    <span>System Prompt</span>
                    {showFullPrompt ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showFullPrompt && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 border-t border-border">
                          <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="
                              w-full h-64 px-3 py-2
                              bg-background border border-border rounded-md
                              text-text-primary text-xs font-mono placeholder:text-text-quaternary
                              focus:border-border-focus
                              outline-none resize-y
                            "
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Preview (collapsed state) */}
                {!showFullPrompt && (
                  <div className="p-3 bg-background border border-border rounded-md">
                    <p className="text-xs text-text-tertiary line-clamp-3 font-mono">
                      {systemPrompt.slice(0, 200)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <button
                  onClick={handleReset}
                  disabled={!isModified}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5
                    text-text-tertiary hover:text-text-secondary text-xs
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                  "
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to default
                </button>

                <button
                  onClick={handleSave}
                  className="
                    px-4 py-1.5
                    bg-text-primary hover:bg-text-secondary
                    rounded-md text-background text-xs
                    transition-colors
                  "
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
