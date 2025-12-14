'use client';

// ============================================
// RIFF - Theme Customizer Component
// AI-powered theme generation with elegant UI
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paintbrush, X, ChevronDown, RotateCcw, Code, Copy, Check } from 'lucide-react';
import { DEFAULT_THEME_SYSTEM_PROMPT } from '@/lib/prompts';
import { useStore } from '@/lib/store';

interface ThemeCustomizerProps {
  currentPrompt: string;
  onGenerate: (prompt: string, systemPrompt?: string) => Promise<void>;
  onReset: () => void;
  isGenerating?: boolean;
}

const STYLE_MOODS = [
  { label: 'Minimal Dark', prompt: 'Dark minimal with subtle cyan accents', color: '#06b6d4' },
  { label: 'Warm Elegant', prompt: 'Warm and elegant with gold on deep burgundy', color: '#d97706' },
  { label: 'Clean Modern', prompt: 'Clean Apple-style with generous white space', color: '#a1a1aa' },
  { label: 'High Contrast', prompt: 'High contrast with stark black and white', color: '#ffffff' },
  { label: 'Soft Pastel', prompt: 'Soft pastels with gentle gradients', color: '#f9a8d4' },
  { label: 'Editorial', prompt: 'Editorial magazine with sophisticated serifs', color: '#78716c' },
];

// Animated dots for loading state
function ThemeLoadingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

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
  const [copied, setCopied] = useState(false);
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
      const isCustom = systemPrompt !== DEFAULT_THEME_SYSTEM_PROMPT;
      if (isCustom) {
        setCustomThemeSystemPrompt(systemPrompt);
      }
      await onGenerate(prompt.trim(), isCustom ? systemPrompt : undefined);
    }
  };

  const handleMoodClick = (mood: typeof STYLE_MOODS[0]) => {
    setPrompt(mood.prompt);
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
      {/* Trigger button - matches ImageStyleSelector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-1.5 px-2.5 py-1.5
          hover:bg-surface
          border border-border hover:border-border-hover
          rounded-md text-text-secondary hover:text-text-primary
          transition-all duration-fast text-xs
        "
        title="Theme customization"
      >
        <Paintbrush className="w-3.5 h-3.5" />
        <span>Theme</span>
        {currentPrompt && (
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
        )}
        <ChevronDown
          className={`w-3 h-3 text-text-tertiary transition-transform duration-fast ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel - dropdown menu attached to button */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.1 }}
              className="
                absolute right-0 bottom-full mb-1.5 z-50
                w-[340px] max-h-[70vh] overflow-hidden
                bg-[#0c0c0c] border border-[#1f1f1f] rounded-xl
                shadow-2xl shadow-black/50
              "
            >
              {/* Header with gradient accent */}
              <div className="relative px-5 py-4 border-b border-[#1f1f1f]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">Theme Studio</h3>
                    <p className="text-xs text-[#666] mt-0.5">Generate colors, fonts & mood</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-[#666] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(70vh-80px)]">
                {/* Quick mood selector */}
                <div className="space-y-2.5">
                  <label className="text-[11px] text-[#666] uppercase tracking-wider font-medium">
                    Quick styles
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLE_MOODS.map((mood) => (
                      <button
                        key={mood.label}
                        onClick={() => handleMoodClick(mood)}
                        className={`
                          relative px-2.5 py-2 rounded-lg text-left transition-all
                          border hover:border-[#333] group
                          ${prompt === mood.prompt
                            ? 'bg-white/5 border-[#333]'
                            : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                          }
                        `}
                      >
                        <div
                          className="w-3 h-3 rounded-full mb-1.5 ring-2 ring-white/10"
                          style={{ backgroundColor: mood.color }}
                        />
                        <span className="text-[11px] text-[#999] group-hover:text-white transition-colors line-clamp-1">
                          {mood.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt input */}
                <div className="space-y-2">
                  <label className="text-[11px] text-[#666] uppercase tracking-wider font-medium">
                    Describe your vision
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe colors, mood, typography style..."
                    className="
                      w-full h-[72px] px-3 py-2.5
                      bg-[#141414] border border-[#1f1f1f] rounded-lg
                      text-white text-sm placeholder:text-[#444]
                      focus:border-[#333] focus:ring-1 focus:ring-[#333]
                      outline-none resize-none transition-all
                    "
                  />
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="
                    w-full flex items-center justify-center gap-2.5 px-4 py-3
                    bg-gradient-to-r from-amber-600 to-orange-600
                    hover:from-amber-500 hover:to-orange-500
                    disabled:from-[#1f1f1f] disabled:to-[#1f1f1f] disabled:text-[#444]
                    disabled:cursor-not-allowed
                    rounded-lg text-white text-sm font-medium
                    transition-all shadow-lg shadow-amber-500/20
                    disabled:shadow-none
                  "
                >
                  {isGenerating ? (
                    <>
                      <span>Crafting theme</span>
                      <ThemeLoadingDots />
                    </>
                  ) : (
                    <>
                      <Paintbrush className="w-4 h-4" />
                      Generate Theme
                    </>
                  )}
                </button>

                {/* Reset button */}
                {currentPrompt && (
                  <button
                    onClick={handleResetTheme}
                    className="
                      w-full flex items-center justify-center gap-2 px-4 py-2
                      hover:bg-white/5 border border-[#1f1f1f]
                      rounded-lg text-[#666] hover:text-white text-xs
                      transition-colors
                    "
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to default
                  </button>
                )}

                {/* System Prompt (collapsible) */}
                <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="
                      w-full flex items-center justify-between px-3 py-2
                      hover:bg-white/[0.02]
                      text-[#666] text-xs
                      transition-colors
                    "
                  >
                    <div className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5" />
                      <span>Advanced: System Prompt</span>
                      {isSystemPromptModified && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">
                          Modified
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSystemPrompt ? 'rotate-180' : ''}`} />
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
                        <div className="p-3 border-t border-[#1f1f1f] space-y-2">
                          <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="
                              w-full h-40 px-3 py-2
                              bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg
                              text-white text-[11px] font-mono placeholder:text-[#444]
                              focus:border-[#333]
                              outline-none resize-y
                            "
                          />
                          {isSystemPromptModified && (
                            <button
                              onClick={handleResetSystemPrompt}
                              className="
                                flex items-center gap-1.5 px-2 py-1
                                text-[#666] hover:text-white text-xs
                                transition-colors
                              "
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reset to default
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Current theme indicator */}
                {currentPrompt && (
                  <div className="p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-[#666] uppercase tracking-wider">Active theme</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentPrompt);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-[#666] hover:text-white hover:bg-white/5 rounded transition-colors"
                        title="Copy theme prompt"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-[#999]">{currentPrompt}</p>
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
