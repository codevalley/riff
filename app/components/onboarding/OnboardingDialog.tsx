'use client';

// ============================================
// OnboardingDialog - Welcome & Tutorial Modal
// Refined dark aesthetic with illustration support
// ============================================

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

/**
 * Parse description text and highlight backtick-wrapped segments
 * e.g., "Use `---` to separate" → ["Use ", <code>---</code>, " to separate"]
 */
function parseDescription(text: string): ReactNode[] {
  const parts = text.split(/`([^`]+)`/);
  return parts.map((part, index) => {
    // Odd indices are the captured groups (content inside backticks)
    if (index % 2 === 1) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-cyan-500/15 text-cyan-400 font-mono text-[13px]"
        >
          {part}
        </code>
      );
    }
    return part;
  });
}

interface OnboardingDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  onClose?: () => void; // For X button / backdrop - truly exits (defaults to onDismiss)
  onSecondaryAction?: () => void;

  // Content
  title: string;
  description: string;
  illustration?: ReactNode;

  // Actions
  primaryLabel?: string;
  secondaryLabel?: string;

  // Tour progress (optional)
  tourProgress?: {
    current: number;
    total: number;
  };
}

// Smooth, refined easing
const EASE_OUT = [0.22, 1, 0.36, 1];

export function OnboardingDialog({
  isOpen,
  onDismiss,
  onClose,
  onSecondaryAction,
  title,
  description,
  illustration,
  primaryLabel = 'Get started',
  secondaryLabel,
  tourProgress,
}: OnboardingDialogProps) {
  // X button and backdrop use onClose if provided, otherwise fall back to onDismiss
  const handleClose = onClose ?? onDismiss;
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="relative w-full max-w-[420px] overflow-hidden"
            >
              {/* Card with refined border and shadow */}
              <div className="relative bg-[#0c0c0c] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden">

                {/* Close button - subtle, top right */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-200"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>

                {/* Illustration Area */}
                {illustration && (
                  <div className="relative w-full h-[180px] bg-gradient-to-b from-white/[0.02] to-transparent flex items-center justify-center overflow-hidden">
                    {/* Subtle radial glow behind illustration */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4, ease: EASE_OUT }}
                    >
                      {illustration}
                    </motion.div>
                  </div>
                )}

                {/* Content */}
                <div className="px-8 pb-8 pt-6">
                  {/* Tour Progress Dots */}
                  {tourProgress && tourProgress.total > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="flex items-center justify-center gap-2 mb-5"
                    >
                      {Array.from({ length: tourProgress.total }).map((_, i) => (
                        <div
                          key={i}
                          className={`
                            h-1.5 rounded-full transition-all duration-300
                            ${i === tourProgress.current
                              ? 'w-6 bg-white'
                              : i < tourProgress.current
                                ? 'w-1.5 bg-white/40'
                                : 'w-1.5 bg-white/20'
                            }
                          `}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* Title - Playfair Display for elegance */}
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.35, ease: EASE_OUT }}
                    className="text-2xl font-medium text-white text-center mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {title}
                  </motion.h2>

                  {/* Description - with inline code highlighting */}
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.35, ease: EASE_OUT }}
                    className="text-[15px] leading-relaxed text-white/50 text-center mb-8"
                  >
                    {parseDescription(description)}
                  </motion.p>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.35, ease: EASE_OUT }}
                    className="flex flex-col items-center gap-3"
                  >
                    {/* Primary Action - Full width, white button */}
                    <button
                      onClick={onDismiss}
                      className="w-full h-11 px-6 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      {primaryLabel}
                    </button>

                    {/* Secondary Action - Subtle text link */}
                    {secondaryLabel && onSecondaryAction && (
                      <button
                        onClick={onSecondaryAction}
                        className="text-sm text-white/40 hover:text-white/60 transition-colors duration-200"
                      >
                        {secondaryLabel}
                      </button>
                    )}

                    {/* Docs footnote */}
                    <div className="pt-3 mt-1 border-t border-white/[0.04]">
                      <Link
                        href="/docs"
                        className="inline-flex items-center gap-1 text-xs text-white/25 hover:text-white/40 transition-colors duration-200"
                      >
                        Learn more in Docs
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default OnboardingDialog;
