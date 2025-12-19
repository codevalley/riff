'use client';

// ============================================
// RIFF - Revamp Deck Dialog
// AI-powered deck refinement with smart suggestions
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wand2,
  Zap,
  Eye,
  Scissors,
  Target,
  MessageSquare,
  Smile,
  Palette,
  Loader2,
  ArrowUpCircle,
  Sparkles,
  FileText,
  LayoutGrid,
  MousePointerClick,
} from 'lucide-react';
import { CREDIT_COSTS } from '@/lib/credits-config';

// Rotating status messages during revamp
const REVAMP_MESSAGES = [
  'Analyzing your deck structure...',
  'Applying DeckSmith transformations...',
  'Optimizing slide density...',
  'Adding progressive reveals...',
  'Polishing visual elements...',
  'Ensuring content preservation...',
  'Finalizing your revamped deck...',
];

// Tips shown during revamp
const REVAMP_TIPS = [
  {
    icon: LayoutGrid,
    title: 'Grids & Icons',
    description: 'Features become eye-catching grid cards with icons.',
  },
  {
    icon: MousePointerClick,
    title: 'Progressive Reveals',
    description: 'Content reveals step-by-step for better pacing.',
  },
  {
    icon: Sparkles,
    title: 'Visual Polish',
    description: 'Background effects and text animations add impact.',
  },
  {
    icon: FileText,
    title: 'Content Preserved',
    description: 'Your facts and message stay intact.',
  },
];

interface RevampDeckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRevamp: (instructions: string) => Promise<void>;
  slideCount: number;
  isRevamping?: boolean;
  isLegacy?: boolean;
}

interface Suggestion {
  id: string;
  label: string;
  text: string;
  icon: React.ElementType;
}

const SUGGESTIONS: Suggestion[] = [
  { id: 'punchy', label: 'Punchier', text: 'Make it punchier and more impactful', icon: Zap },
  { id: 'visuals', label: 'More visuals', text: 'Add more image placeholders and visual elements', icon: Eye },
  { id: 'simplify', label: 'Simplify', text: 'Simplify the language for broader accessibility', icon: Scissors },
  { id: 'professional', label: 'Professional', text: 'Make it more professional and polished', icon: Target },
  { id: 'storytelling', label: 'Storytelling', text: 'Improve the narrative flow and storytelling', icon: MessageSquare },
  { id: 'engaging', label: 'Engaging', text: 'Make it more engaging and dynamic', icon: Smile },
  { id: 'transitions', label: 'Transitions', text: 'Improve slide transitions and progressive reveals', icon: Palette },
  { id: 'concise', label: 'Concise', text: 'Make it more concise, removing redundancy', icon: Scissors },
];

// Upgrade suggestion for legacy decks - uses v2 features
const UPGRADE_SUGGESTION: Suggestion = {
  id: 'upgrade',
  label: 'Upgrade to v2',
  text: 'Upgrade this deck to use the new v2 format with grids, icons, background effects, alignment controls, and text effects like [anvil], [typewriter], and [glow]. Preserve the existing content while enhancing it with these new features.',
  icon: ArrowUpCircle,
};

export function RevampDeckDialog({
  isOpen,
  onClose,
  onRevamp,
  slideCount,
  isRevamping = false,
  isLegacy = false,
}: RevampDeckDialogProps) {
  const [instructions, setInstructions] = useState('');
  const [activeSuggestions, setActiveSuggestions] = useState<Set<string>>(new Set());
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  // Reset state when dialog opens, auto-select upgrade if legacy
  useEffect(() => {
    if (isOpen) {
      if (isLegacy) {
        setActiveSuggestions(new Set(['upgrade']));
        setInstructions(`• ${UPGRADE_SUGGESTION.text}`);
      } else {
        setInstructions('');
        setActiveSuggestions(new Set());
      }
      setCurrentMessage(0);
      setCurrentTip(0);
    }
  }, [isOpen, isLegacy]);

  // Rotate messages and tips during revamp
  useEffect(() => {
    if (isRevamping) {
      const messageInterval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % REVAMP_MESSAGES.length);
      }, 3000);
      const tipInterval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % REVAMP_TIPS.length);
      }, 4000);
      return () => {
        clearInterval(messageInterval);
        clearInterval(tipInterval);
      };
    }
  }, [isRevamping]);

  // Toggle suggestion - add/remove from textarea
  const toggleSuggestion = useCallback((suggestion: Suggestion) => {
    const isActive = activeSuggestions.has(suggestion.id);

    if (isActive) {
      // Remove from active set
      setActiveSuggestions(prev => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
      // Remove from instructions
      setInstructions(current => {
        const lines = current.split('\n').filter(line =>
          line.trim() !== suggestion.text && line.trim() !== `• ${suggestion.text}`
        );
        return lines.join('\n').trim();
      });
    } else {
      // Add to active set
      setActiveSuggestions(prev => new Set(prev).add(suggestion.id));
      // Add to instructions
      setInstructions(current => {
        const trimmed = current.trim();
        if (trimmed) {
          return `${trimmed}\n• ${suggestion.text}`;
        }
        return `• ${suggestion.text}`;
      });
    }
  }, [activeSuggestions]);

  const handleRevamp = async () => {
    if (!instructions.trim()) return;
    await onRevamp(instructions.trim());
  };

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
        {/* Processing state overlay - lively with tips and rotating messages */}
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

              <div className="relative z-10 w-full max-w-sm">
                {/* Tip card - rotates through tips */}
                <div className="mb-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTip}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const TipIcon = REVAMP_TIPS[currentTip].icon;
                            return <TipIcon className="w-5 h-5 text-amber-400" />;
                          })()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/90">
                            {REVAMP_TIPS[currentTip].title}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">
                            {REVAMP_TIPS[currentTip].description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Tip indicators */}
                  <div className="flex justify-center gap-1.5 mt-3">
                    {REVAMP_TIPS.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentTip ? 'bg-amber-400 w-3' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress indicator with breathing wand */}
                <div className="flex flex-col items-center">
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

                  <p className="text-xs text-white/30 mt-3">
                    Using premium model for best results
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isLegacy
                  ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-amber-500/30'
                  : 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/20'
              }`}>
                {isLegacy ? (
                  <ArrowUpCircle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Wand2 className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  {isLegacy ? 'Upgrade Deck' : 'Revamp Deck'}
                </h2>
                <p className="text-sm text-white/40 mt-0.5">
                  {isLegacy
                    ? `Upgrade your ${slideCount}-slide deck to v2 format`
                    : `Refine your ${slideCount}-slide deck with AI`
                  }
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
          {/* Upgrade banner for legacy decks */}
          {isLegacy && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-300">Legacy deck detected</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    This deck uses an older format. Upgrade to unlock grids, icons, background effects, and text animations.
                  </p>
                </div>
                <motion.button
                  onClick={() => toggleSuggestion(UPGRADE_SUGGESTION)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0
                    transition-all duration-200
                    ${activeSuggestions.has('upgrade')
                      ? 'bg-amber-500 text-black'
                      : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    }
                  `}
                >
                  {activeSuggestions.has('upgrade') ? 'Selected' : 'Upgrade'}
                </motion.button>
              </div>
            </div>
          )}

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
              placeholder="Tell the AI how to improve your deck...&#10;&#10;Example: Focus on the key metrics, add more pauses for dramatic effect, and ensure each slide has a clear takeaway."
              rows={5}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all duration-200"
            />
          </div>

          {/* Credit notice */}
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
            <span>
              Uses <span className="text-white/60">{CREDIT_COSTS.DECK_REVAMP} credit</span> · Content will be replaced
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isRevamping}
            className="px-4 py-2.5 text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.05] rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRevamp}
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
                <span>{isLegacy ? 'Upgrading...' : 'Revamping...'}</span>
              </>
            ) : (
              <>
                {isLegacy ? <ArrowUpCircle className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                <span>{isLegacy ? 'Upgrade Deck' : 'Revamp Deck'}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
