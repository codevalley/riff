'use client';

// ============================================
// ImageCreditsIllustration - Quality Takes Time
// Shows progress bar and credits indicator
// ============================================

import { motion } from 'framer-motion';

interface ImageCreditsIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function ImageCreditsIllustration({ className = '' }: ImageCreditsIllustrationProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 280 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[280px] h-[140px]"
      >
        {/* Ambient glow */}
        <defs>
          <radialGradient id="creditsGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,158,11,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(245,158,11,0.8)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.8)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#creditsGlow)" />

        {/* Image placeholder with generating state */}
        <motion.g
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <rect x="65" y="15" width="150" height="70" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Dancing dots animation */}
          <motion.circle
            cx="125"
            cy="50"
            r="4"
            fill="rgba(245,158,11,0.6)"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="140"
            cy="50"
            r="4"
            fill="rgba(245,158,11,0.6)"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
          />
          <motion.circle
            cx="155"
            cy="50"
            r="4"
            fill="rgba(245,158,11,0.6)"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />

          {/* "Creating image..." text */}
          <text x="140" y="70" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="system-ui" textAnchor="middle">Creating image...</text>
        </motion.g>

        {/* Progress bar */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <rect x="65" y="95" width="150" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
          <motion.rect
            x="65"
            y="95"
            width="90"
            height="6"
            rx="3"
            fill="url(#progressGradient)"
            initial={{ width: 0 }}
            animate={{ width: 90 }}
            transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
          />
        </motion.g>

        {/* Time estimate */}
        <motion.text
          x="140"
          y="115"
          fill="rgba(255,255,255,0.4)"
          fontSize="9"
          fontFamily="system-ui"
          textAnchor="middle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          ~30-60 seconds
        </motion.text>

        {/* Credits indicator - bottom right */}
        <motion.g
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <rect x="185" y="122" width="70" height="14" rx="7" fill="rgba(245,158,11,0.15)" />
          <circle cx="195" cy="129" r="3" fill="rgba(245,158,11,0.6)" />
          <text x="230" y="133" fill="rgba(245,158,11,0.7)" fontSize="8" fontFamily="system-ui" textAnchor="middle">Uses credits</text>
        </motion.g>

        {/* Quality indicator - bottom left */}
        <motion.g
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <rect x="25" y="122" width="70" height="14" rx="7" fill="rgba(16,185,129,0.15)" />
          <text x="60" y="133" fill="rgba(16,185,129,0.7)" fontSize="8" fontFamily="system-ui" textAnchor="middle">SOTA quality</text>
        </motion.g>
      </svg>
    </div>
  );
}

export default ImageCreditsIllustration;
