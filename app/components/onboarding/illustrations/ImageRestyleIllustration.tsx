'use client';

// ============================================
// ImageRestyleIllustration - Restyle & Tweak
// Shows before/after transformation
// ============================================

import { motion } from 'framer-motion';

interface ImageRestyleIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function ImageRestyleIllustration({ className = '' }: ImageRestyleIllustrationProps) {
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
          <radialGradient id="restyleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,158,11,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#restyleGlow)" />

        {/* Before image - left */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <rect x="30" y="25" width="90" height="65" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {/* Simple image content */}
          <path d="M50 70 L65 50 L80 60 L95 45 L110 70 Z" fill="rgba(255,255,255,0.2)" />
          <circle cx="100" cy="40" r="8" fill="rgba(255,255,255,0.15)" />
          {/* Label */}
          <text x="75" y="100" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="system-ui" textAnchor="middle">Original</text>
        </motion.g>

        {/* Arrow */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <motion.path
            d="M130 57 L150 57"
            stroke="rgba(245,158,11,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          />
          <motion.path
            d="M145 52 L152 57 L145 62"
            stroke="rgba(245,158,11,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.2 }}
          />
        </motion.g>

        {/* After image - right (styled) */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
        >
          <rect x="160" y="25" width="90" height="65" rx="6" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
          {/* Styled image content */}
          <path d="M180 70 L195 50 L210 60 L225 45 L240 70 Z" fill="rgba(245,158,11,0.4)" />
          <circle cx="230" cy="40" r="8" fill="rgba(244,63,94,0.4)" />
          {/* Sparkle overlay */}
          <motion.path
            d="M240 30 L241 33 L244 34 L241 35 L240 38 L239 35 L236 34 L239 33 Z"
            fill="rgba(245,158,11,0.8)"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {/* Label */}
          <text x="205" y="100" fill="rgba(245,158,11,0.6)" fontSize="8" fontFamily="system-ui" textAnchor="middle">Restyled</text>
        </motion.g>

        {/* Prompt input below */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <rect x="60" y="115" width="160" height="18" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
          <text x="70" y="127" fill="rgba(245,158,11,0.7)" fontSize="8" fontFamily="system-ui">Make it warmer and more dramatic</text>
        </motion.g>
      </svg>
    </div>
  );
}

export default ImageRestyleIllustration;
