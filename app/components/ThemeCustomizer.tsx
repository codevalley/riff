'use client';

// ============================================
// VIBE SLIDES - Theme Customizer Component
// With editable system prompt and reset to default
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sparkles, Loader2, X, ChevronDown, ChevronRight, RotateCcw, Code } from 'lucide-react';
import { DEFAULT_THEME_SYSTEM_PROMPT } from '@/lib/prompts';
import { useStore } from '@/lib/store';

interface ThemeCustomizerProps {
  currentPrompt: string;
  onGenerate: (prompt: string, systemPrompt?: string) => Promise<void>;
  onReset: () => void;
  isGenerating?: boolean;
}

const EXAMPLE_PROMPTS = [
  'Dark minimal with subtle cyan accents',
  'Warm and elegant with gold on deep burgundy',
  'Clean Apple-style with white space and subtle grays',
  'High contrast with stark black and white',
  'Soft pastels with gentle gradients',
  'Editorial magazine with sophisticated serifs',
];

export function ThemeCustomizer({
  currentPrompt,
  onGenerate,
  onReset,
  isGenerating = false,
}: ThemeCustomizerProps) {
  const { customThemeSystemPrompt, setCustomThemeSystemPrompt } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(currentPrompt);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    customThemeSystemPrompt || DEFAULT_THEME_SYSTEM_PROMPT
  );

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vibe-slides-theme-system-prompt');
    if (saved) {
      setSystemPrompt(saved);
      setCustomThemeSystemPrompt(saved);
    }
  }, [setCustomThemeSystemPrompt]);

  useEffect(() => {
    setPrompt(currentPrompt);
  }, [currentPrompt]);

  const handleGenerate = async () => {
    if (prompt.trim()) {
      // Save custom system prompt if modified
      const isCustom = systemPrompt !== DEFAULT_THEME_SYSTEM_PROMPT;
      if (isCustom) {
        setCustomThemeSystemPrompt(systemPrompt);
      }
      await onGenerate(prompt.trim(), isCustom ? systemPrompt : undefined);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const handleResetSystemPrompt = () => {
    setSystemPrompt(DEFAULT_THEME_SYSTEM_PROMPT);
    setCustomThemeSystemPrompt(null);
  };

  const handleResetTheme = () => {
    onReset();
    setIsOpen(false);
  };

  const isSystemPromptModified = systemPrompt !== DEFAULT_THEME_SYSTEM_PROMPT;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2
          hover:bg-surface
          border border-border hover:border-border-hover
          rounded-md text-text-secondary hover:text-text-primary
          transition-all duration-fast text-sm
        "
      >
        <Palette className="w-4 h-4" />
        Theme
        {currentPrompt && (
          <span className="w-1.5 h-1.5 bg-text-primary rounded-full" />
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
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="
                fixed right-4 top-16 z-50
                w-96 max-h-[calc(100vh-100px)] overflow-hidden
                bg-surface border border-border rounded-lg
                shadow-xl shadow-black/20
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-primary">Theme Generator</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-surface-hover rounded text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                {/* Reset to Default */}
                {currentPrompt && (
                  <button
                    onClick={handleResetTheme}
                    className="
                      w-full flex items-center justify-center gap-2 px-4 py-2
                      bg-background hover:bg-surface-hover
                      border border-border hover:border-border-hover
                      rounded-md text-text-secondary hover:text-text-primary text-sm
                      transition-colors
                    "
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Default Theme
                  </button>
                )}

                {/* Prompt input */}
                <div className="space-y-2">
                  <label className="text-xs text-text-tertiary uppercase tracking-wider">
                    Describe your theme
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Dark minimal with neon accents..."
                    className="
                      w-full h-20 px-3 py-2
                      bg-background border border-border rounded-md
                      text-text-primary text-sm placeholder:text-text-quaternary
                      focus:border-border-focus
                      outline-none resize-none
                    "
                  />
                </div>

                {/* System Prompt (collapsible) */}
                <div className="border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="
                      w-full flex items-center justify-between px-3 py-2
                      bg-background hover:bg-surface-hover
                      text-text-secondary text-xs
                      transition-colors
                    "
                  >
                    <div className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5" />
                      <span>System Prompt</span>
                      {isSystemPromptModified && (
                        <span className="px-1.5 py-0.5 bg-warning/20 text-warning rounded text-[10px]">
                          Modified
                        </span>
                      )}
                    </div>
                    {showSystemPrompt ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showSystemPrompt && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 border-t border-border space-y-2">
                          <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="
                              w-full h-48 px-3 py-2
                              bg-background border border-border rounded-md
                              text-text-primary text-xs font-mono placeholder:text-text-quaternary
                              focus:border-border-focus
                              outline-none resize-y
                            "
                          />
                          {isSystemPromptModified && (
                            <button
                              onClick={handleResetSystemPrompt}
                              className="
                                flex items-center gap-1.5 px-2 py-1
                                text-text-tertiary hover:text-text-secondary text-xs
                                transition-colors
                              "
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reset to default prompt
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="
                    w-full flex items-center justify-center gap-2 px-4 py-2.5
                    bg-text-primary hover:bg-text-secondary
                    disabled:bg-surface disabled:text-text-quaternary
                    disabled:cursor-not-allowed
                    rounded-md text-background text-sm
                    transition-colors
                  "
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Theme
                    </>
                  )}
                </button>

                {/* Example prompts */}
                <div className="space-y-2">
                  <p className="text-xs text-text-quaternary uppercase tracking-wider">
                    Examples
                  </p>
                  <div className="space-y-1">
                    {EXAMPLE_PROMPTS.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(example)}
                        className="
                          w-full text-left px-2.5 py-2
                          hover:bg-surface-hover
                          rounded text-text-tertiary hover:text-text-secondary text-xs
                          transition-colors
                        "
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current theme */}
                {currentPrompt && (
                  <div className="p-3 bg-background border border-border rounded-md">
                    <p className="text-xs text-text-tertiary mb-1">
                      Active theme
                    </p>
                    <p className="text-xs text-text-secondary">{currentPrompt}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
