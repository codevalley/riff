'use client';

// ============================================
// RIFF - Add Slide Dialog
// Premium dialog for AI-powered slide generation
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Sparkles,
  LayoutGrid,
  BarChart3,
  Quote,
  List,
  ImageIcon,
  Zap,
} from 'lucide-react';
import { CREDIT_COSTS } from '@/lib/credits-config';
import { useCreditsContext } from '@/hooks/useCredits';

// Rotating status messages during generation
const GENERATION_MESSAGES = [
  'Analyzing deck context...',
  'Crafting slide structure...',
  'Adding visual elements...',
  'Polishing content...',
  'Finalizing your slide...',
];

interface AddSlideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (description: string) => Promise<void>;
  insertPosition: number;
  isAdding: boolean;
}

interface SlideTemplate {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'comparison',
    label: 'Comparison',
    description: 'Before/after or side-by-side comparison',
    icon: LayoutGrid,
  },
  {
    id: 'stats',
    label: 'Statistics',
    description: 'Key metrics with visual emphasis',
    icon: BarChart3,
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Customer testimonial or key quote',
    icon: Quote,
  },
  {
    id: 'features',
    label: 'Features',
    description: 'Feature grid with icons',
    icon: List,
  },
  {
    id: 'visual',
    label: 'Visual',
    description: 'Image-focused with minimal text',
    icon: ImageIcon,
  },
  {
    id: 'impact',
    label: 'Impact',
    description: 'Bold statement with emphasis',
    icon: Zap,
  },
];

export function AddSlideDialog({
  isOpen,
  onClose,
  onAdd,
  insertPosition,
  isAdding,
}: AddSlideDialogProps) {
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState(0);
  const { setShowLedgerModal } = useCreditsContext();

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setSelectedTemplate(null);
      setCurrentMessage(0);
    }
  }, [isOpen]);

  // Rotate messages during generation
  useEffect(() => {
    if (isAdding) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % GENERATION_MESSAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isAdding]);

  // Build the final description with template
  const buildDescription = useCallback(() => {
    const template = SLIDE_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template && description.trim()) {
      return `${template.description}: ${description.trim()}`;
    }
    if (template) {
      return template.description;
    }
    return description.trim();
  }, [description, selectedTemplate]);

  const handleSubmit = useCallback(async () => {
    const finalDescription = buildDescription();
    if (!finalDescription || isAdding) return;
    await onAdd(finalDescription);
  }, [buildDescription, isAdding, onAdd]);

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
    if (!isAdding) {
      onClose();
    }
  };

  const canSubmit = description.trim() || selectedTemplate;

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
          {isAdding && (
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
                {/* Progress indicator with breathing sparkle */}
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-4"
                >
                  <Sparkles className="w-7 h-7 text-amber-400" />
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
                      {GENERATION_MESSAGES[currentMessage]}
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
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Add New Slide
                </h2>
                <p className="text-sm text-white/40 mt-0.5">
                  Inserting after slide {insertPosition + 1}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isAdding}
              className="p-2 -mr-2 -mt-1 hover:bg-white/5 rounded-xl text-white/30 hover:text-white/70 transition-all duration-200 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Slide templates */}
          <div>
            <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-3">
              Start with a template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SLIDE_TEMPLATES.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate === template.id;
                return (
                  <motion.button
                    key={template.id}
                    onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl
                      border transition-all duration-200
                      ${isSelected
                        ? 'bg-amber-500/20 border-amber-500/40'
                        : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-white/50'}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-amber-300' : 'text-white/60'}`}>
                      {template.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2">
              Describe your slide
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell us what content you want on this slide...&#10;&#10;Example: Three key metrics showing our Q4 growth with visual emphasis on the 40% revenue increase"
              rows={4}
              disabled={isAdding}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Credit notice */}
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
            <button
              type="button"
              onClick={() => setShowLedgerModal(true)}
              className="hover:text-amber-400 transition-colors text-left"
            >
              Uses <span className="text-white/60">{CREDIT_COSTS.ADD_SLIDE} credits</span>
            </button>
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
            {' to create'}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={isAdding}
              className="px-4 py-2.5 text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.05] rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isAdding}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${canSubmit
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Slide</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
