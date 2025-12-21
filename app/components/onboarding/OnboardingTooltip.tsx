'use client';

// ============================================
// OnboardingTooltip - Contextual Hint Component
// Small tooltip with arrow pointing to target
// ============================================

import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ArrowPosition = 'top' | 'bottom' | 'left' | 'right';

interface OnboardingTooltipProps {
  isOpen: boolean;
  onDismiss: () => void;

  // Content
  title: string;
  description: string;

  // Positioning
  targetRef: React.RefObject<HTMLElement | null>;
  preferredPosition?: ArrowPosition; // Where the arrow points FROM (tooltip is opposite)

  // Actions
  primaryLabel?: string;
}

// Smooth, refined easing
const EASE_OUT = [0.22, 1, 0.36, 1];

export function OnboardingTooltip({
  isOpen,
  onDismiss,
  title,
  description,
  targetRef,
  preferredPosition = 'bottom',
  primaryLabel = 'Got it',
}: OnboardingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<ArrowPosition>(preferredPosition);

  // Parse description with backtick highlighting (same as OnboardingDialog)
  const parseDescription = useCallback((text: string): ReactNode[] => {
    const parts = text.split(/`([^`]+)`/);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <code
            key={index}
            className="px-1 py-0.5 mx-0.5 rounded bg-cyan-500/15 text-cyan-400 font-mono text-[12px]"
          >
            {part}
          </code>
        );
      }
      return part;
    });
  }, []);

  // Calculate position relative to target element
  useEffect(() => {
    if (!isOpen || !targetRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const target = targetRef.current;
      const tooltip = tooltipRef.current;
      if (!target || !tooltip) return;

      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const padding = 12; // Gap between tooltip and target

      let top = 0;
      let left = 0;
      let finalArrow: ArrowPosition = preferredPosition;

      // Calculate based on preferred position
      switch (preferredPosition) {
        case 'bottom': // Arrow points down, tooltip is above
          top = targetRect.top - tooltipRect.height - padding;
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
          finalArrow = 'bottom';
          // If not enough space above, flip to below
          if (top < padding) {
            top = targetRect.bottom + padding;
            finalArrow = 'top';
          }
          break;

        case 'top': // Arrow points up, tooltip is below
          top = targetRect.bottom + padding;
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
          finalArrow = 'top';
          // If not enough space below, flip to above
          if (top + tooltipRect.height > window.innerHeight - padding) {
            top = targetRect.top - tooltipRect.height - padding;
            finalArrow = 'bottom';
          }
          break;

        case 'left': // Arrow points left, tooltip is to the right
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          left = targetRect.right + padding;
          finalArrow = 'left';
          break;

        case 'right': // Arrow points right, tooltip is to the left
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          left = targetRect.left - tooltipRect.width - padding;
          finalArrow = 'right';
          break;
      }

      // Clamp to viewport
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      setPosition({ top, left });
      setArrowPosition(finalArrow);
    };

    updatePosition();

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, targetRef, preferredPosition]);

  // Arrow styles based on position
  const getArrowStyles = (): string => {
    const base = 'absolute w-3 h-3 bg-[#1a1a1a] border-white/[0.08] rotate-45';
    switch (arrowPosition) {
      case 'top': // Arrow at top, pointing up
        return `${base} -top-1.5 left-1/2 -translate-x-1/2 border-l border-t`;
      case 'bottom': // Arrow at bottom, pointing down
        return `${base} -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b`;
      case 'left': // Arrow at left, pointing left
        return `${base} -left-1.5 top-1/2 -translate-y-1/2 border-l border-b`;
      case 'right': // Arrow at right, pointing right
        return `${base} -right-1.5 top-1/2 -translate-y-1/2 border-r border-t`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop for click-outside dismiss */}
          <div
            className="fixed inset-0 z-50"
            onClick={onDismiss}
          />

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
            }}
            className="z-50 w-[280px]"
          >
            <div className="relative bg-[#1a1a1a] rounded-xl border border-white/[0.08] shadow-xl shadow-black/40 overflow-hidden">
              {/* Arrow */}
              <div className={getArrowStyles()} />

              {/* Content */}
              <div className="p-4">
                {/* Title */}
                <h3 className="text-sm font-medium text-white mb-1.5">
                  {title}
                </h3>

                {/* Description */}
                <p className="text-[13px] leading-relaxed text-white/50 mb-4">
                  {parseDescription(description)}
                </p>

                {/* Action */}
                <button
                  onClick={onDismiss}
                  className="w-full h-8 px-4 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors duration-150"
                >
                  {primaryLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default OnboardingTooltip;
