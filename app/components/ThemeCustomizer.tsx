'use client';

// ============================================
// VIBE SLIDES - Theme Customizer Component
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sparkles, Loader2, X, Wand2 } from 'lucide-react';

interface ThemeCustomizerProps {
  currentPrompt: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating?: boolean;
}

const EXAMPLE_PROMPTS = [
  'Dark and minimal with neon cyan accents, like a cyberpunk terminal',
  'Warm, elegant, and luxurious with gold accents on deep burgundy',
  'Clean Apple-style with lots of white space, SF Pro fonts, subtle grays',
  'Retro 80s synthwave with pink and purple gradients, bold geometric shapes',
  'Natural and organic with earth tones, handwritten-style fonts',
  'High contrast brutalist with stark black and white, raw typography',
  'Soft pastel aesthetic with rounded shapes and gentle gradients',
  'Editorial magazine style with sophisticated serif fonts and minimal color',
];

export function ThemeCustomizer({
  currentPrompt,
  onGenerate,
  isGenerating = false,
}: ThemeCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(currentPrompt);

  useEffect(() => {
    setPrompt(currentPrompt);
  }, [currentPrompt]);

  const handleGenerate = async () => {
    if (prompt.trim()) {
      await onGenerate(prompt.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-4 py-2.5
          bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20
          hover:from-violet-600/30 hover:to-fuchsia-600/30
          border border-violet-500/30 rounded-xl
          text-violet-300 font-medium text-sm
          transition-all duration-200
        "
      >
        <Palette className="w-4 h-4" />
        Theme
        {currentPrompt && (
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="
                fixed right-4 top-20 z-50
                w-96 max-h-[calc(100vh-120px)] overflow-hidden
                bg-slate-900 border border-slate-700/50 rounded-2xl
                shadow-2xl shadow-black/50
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-200">Theme Generator</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Prompt input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Describe your theme in natural language
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Dark and minimal with neon accents, like a cyberpunk terminal meets TED talk..."
                    className="
                      w-full h-24 px-3 py-2
                      bg-slate-800/50 border border-slate-700/50 rounded-xl
                      text-slate-200 text-sm placeholder:text-slate-500
                      focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                      outline-none resize-none
                    "
                  />
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="
                    w-full flex items-center justify-center gap-2 px-4 py-3
                    bg-gradient-to-r from-violet-600 to-fuchsia-600
                    hover:from-violet-500 hover:to-fuchsia-500
                    disabled:from-slate-700 disabled:to-slate-700
                    disabled:cursor-not-allowed
                    rounded-xl text-white font-medium
                    transition-all duration-200
                  "
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Theme...
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
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Example Prompts
                  </p>
                  <div className="space-y-2">
                    {EXAMPLE_PROMPTS.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(example)}
                        className="
                          w-full text-left px-3 py-2
                          bg-slate-800/30 hover:bg-slate-800/60
                          border border-slate-700/30 hover:border-violet-500/30
                          rounded-lg text-slate-400 hover:text-slate-200 text-xs
                          transition-all duration-200
                        "
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current theme info */}
                {currentPrompt && (
                  <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <p className="text-xs font-medium text-violet-300 mb-1">
                      Current Theme
                    </p>
                    <p className="text-xs text-violet-200/70">{currentPrompt}</p>
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
