'use client';

// ============================================
// TipThankYouIllustration - Gratitude for tips
// Heart + coffee cup with warm appreciation
// ============================================

import { motion } from 'framer-motion';

interface TipThankYouIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function TipThankYouIllustration({ className = '' }: TipThankYouIllustrationProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 280 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[280px] h-[140px]"
      >
        {/* Warm ambient glow */}
        <defs>
          <radialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(251,146,60,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(244,63,94,0.8)" />
            <stop offset="100%" stopColor="rgba(251,113,133,0.6)" />
          </linearGradient>
          <linearGradient id="cupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.6)" />
            <stop offset="100%" stopColor="rgba(217,119,6,0.4)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#tipGlow)" />

        {/* Coffee cup */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Cup body */}
          <path
            d="M115 55 L120 95 C120 100 125 105 140 105 C155 105 160 100 160 95 L165 55 Z"
            fill="url(#cupGradient)"
            stroke="rgba(251,191,36,0.5)"
            strokeWidth="1.5"
          />

          {/* Cup handle */}
          <motion.path
            d="M165 60 C180 60 185 70 185 80 C185 90 180 95 170 95"
            stroke="rgba(251,191,36,0.5)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />

          {/* Steam lines */}
          <motion.path
            d="M130 45 C130 40 135 38 135 32"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            animate={{ y: [0, -3, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M145 42 C145 37 150 35 150 28"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            animate={{ y: [0, -4, 0], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          <motion.path
            d="M155 47 C155 42 160 40 160 34"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            animate={{ y: [0, -3, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
        </motion.g>

        {/* Floating heart */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4, type: "spring", stiffness: 200 }}
        >
          <motion.path
            d="M140 25 C140 20 145 15 152 15 C159 15 165 22 165 28 C165 38 140 50 140 50 C140 50 115 38 115 28 C115 22 121 15 128 15 C135 15 140 20 140 25 Z"
            fill="url(#heartGradient)"
            animate={{
              scale: [1, 1.05, 1],
              y: [0, -2, 0]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: '140px 32px' }}
          />
        </motion.g>

        {/* Sparkles around */}
        <motion.g
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="95" cy="40" r="2" fill="rgba(251,191,36,0.6)" />
          <circle cx="185" cy="50" r="1.5" fill="rgba(244,63,94,0.5)" />
          <circle cx="100" cy="85" r="1.5" fill="rgba(251,191,36,0.4)" />
          <circle cx="180" cy="90" r="2" fill="rgba(251,113,133,0.5)" />
        </motion.g>

        {/* Thank you text */}
        <motion.text
          x="140"
          y="125"
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize="10"
          fontFamily="system-ui"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          You made our day!
        </motion.text>
      </svg>
    </div>
  );
}

export default TipThankYouIllustration;
