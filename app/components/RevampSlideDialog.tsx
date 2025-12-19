'use client';

// ============================================
// RIFF - Revamp Slide Dialog
// Premium dialog for AI-powered slide transformation
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Wand2,
  Eye,
  LayoutGrid,
  Sparkles,
  Palette,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { CREDIT_COSTS } from '@/lib/credits-config';

// Rotating status messages during revamp
const REVAMP_MESSAGES = [
  'Analyzing slide structure...',
  'Applying transformations...',
  'Enhancing visual elements...',
  'Adding polish...',
  'Finalizing changes...',
];

interface RevampSlideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRevamp: (instructions: string) => Promise<void>;
  slideIndex: number;
  isRevamping: boolean;
}

interface Suggestion {
  id: string;
  label: string;
  text: string;
  icon: React.ElementType;
}

const SUGGESTIONS: Suggestion[] = [
  { id: 'visual', label: 'More visual', text: 'Make it more visual with icons and layout improvements', icon: Eye },
  { id: 'grid', label: 'Icon grid', text: 'Convert content to an icon grid layout', icon: LayoutGrid },
  { id: 'reveals', label: 'Progressive reveals', text: 'Add progressive reveal animations for better pacing', icon: Sparkles },
  { id: 'simplify', label: 'Simplify', text: 'Simplify the content and reduce text density', icon: Minimize2 },
  { id: 'background', label: 'Background effect', text: 'Add a dynamic background effect', icon: Palette },
  { id: 'stats', label: 'Stats slide', text: 'Transform into a statistics slide with large numbers', icon: Maximize2 },
];

export function RevampSlideDialog({
  isOpen,
  onClose,
  onRevamp,
  slideIndex,
  isRevamping,
}: RevampSlideDialogProps) {
  const [instructions, setInstructions] = useState('');
  const [activeSuggestions, setActiveSuggestions] = useState<Set<string>>(new Set());
  const [currentMessage, setCurrentMessage] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInstructions('');
      setActiveSuggestions(new Set());
      setCurrentMessage(0);
    }
  }, [isOpen]);

  // Rotate messages during revamp
  useEffect(() => {
    if (isRevamping) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % REVAMP_MESSAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isRevamping]);

  // Toggle suggestion - add/remove from textarea
  const toggleSuggestion = useCallback((suggestion: Suggestion) => {
    const isActive = activeSuggestions.has(suggestion.id);

    if (isActive) {
      setActiveSuggestions(prev => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
      setInstructions(current => {
        const lines = current.split('\n').filter(line =>
          line.trim() !== suggestion.text && line.trim() !== `• ${suggestion.text}`
        );
        return lines.join('\n').trim();
      });
    } else {
      setActiveSuggestions(prev => new Set(prev).add(suggestion.id));
      setInstructions(current => {
        const trimmed = current.trim();
        if (trimmed) {
          return `${trimmed}\n• ${suggestion.text}`;
        }
        return `• ${suggestion.text}`;
      });
    }
  }, [activeSuggestions]);

  const handleSubmit = useCallback(async () => {
    if (!instructions.trim() || isRevamping) return;
    await onRevamp(instructions.trim());
  }, [instructions, isRevamping, onRevamp]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleClose = () => {
    if (!isRevamping) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Processing state overlay */}
        <AnimatePresence>
          {isRevamping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-[#0a0a0a] flex flex-col items-center justify-center px-8 py-10"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/5"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                {/* Progress indicator with breathing wand */}
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-4"
                >
                  <Wand2 className="w-7 h-7 text-amber-400" />
                </motion.div>

                {/* Rotating status message */}
                <div className="h-6 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentMessage}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm text-white/70 text-center"
                    >
                      {REVAMP_MESSAGES[currentMessage]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Animated progress bar */}
                <div className="w-full max-w-[200px] h-1 mt-4 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500/60 via-amber-400 to-amber-500/60 rounded-full"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '50%' }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Revamp Slide
                </h2>
                <p className="text-sm text-white/40 mt-0.5">
                  Transforming slide {slideIndex + 1}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isRevamping}
              className="p-2 -mr-2 -mt-1 hover:bg-white/5 rounded-xl text-white/30 hover:text-white/70 transition-all duration-200 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Quick suggestions */}
          <div>
            <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-3">
              Quick suggestions
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => {
                const Icon = suggestion.icon;
                const isActive = activeSuggestions.has(suggestion.id);
                return (
                  <motion.button
                    key={suggestion.id}
                    onClick={() => toggleSuggestion(suggestion)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                      border transition-all duration-200
                      ${isActive
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white/80 hover:border-white/20 hover:bg-white/[0.06]'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{suggestion.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Instructions textarea */}
          <div>
            <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell the AI how to transform this slide...&#10;&#10;Example: Add icons to each bullet point, use a 2-column layout, and add a subtle gradient background"
              rows={4}
              disabled={isRevamping}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Credit notice */}
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
            <span>
              Uses <span className="text-white/60">{CREDIT_COSTS.SLIDE_REVAMP} credits</span> · You can compare before applying
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
          <div className="text-xs text-white/30">
            <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-white/50">
              ⌘
            </kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-white/50">
              Enter
            </kbd>
            {' to revamp'}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={isRevamping}
              className="px-4 py-2.5 text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.05] rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!instructions.trim() || isRevamping}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${instructions.trim()
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              {isRevamping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Revamping...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Revamp Slide</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
