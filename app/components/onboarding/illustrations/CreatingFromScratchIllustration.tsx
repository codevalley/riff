'use client';

// ============================================
// CreatingFromScratchIllustration - Write from Scratch
// Empty deck with markdown editor and cursor
// ============================================

import { motion } from 'framer-motion';

interface CreatingFromScratchIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreatingFromScratchIllustration({ className = '' }: CreatingFromScratchIllustrationProps) {
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
          <radialGradient id="fromScratchGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#fromScratchGlow)" />

        {/* Split view: Editor left, Preview right */}
        <motion.g
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Editor container */}
          <rect x="30" y="25" width="220" height="90" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Window controls */}
          <circle cx="45" cy="35" r="3" fill="rgba(239,68,68,0.6)" />
          <circle cx="55" cy="35" r="3" fill="rgba(251,191,36,0.6)" />
          <circle cx="65" cy="35" r="3" fill="rgba(16,185,129,0.6)" />

          {/* Divider */}
          <line x1="140" y1="45" x2="140" y2="105" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </motion.g>

        {/* Left: Markdown editor panel */}
        <motion.g
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASE_OUT }}
        >
          {/* Panel label */}
          <text x="42" y="55" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="system-ui">
            MARKDOWN
          </text>

          {/* Markdown content */}
          <g style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {/* # Title */}
            <text x="42" y="70" fill="rgba(139,92,246,0.7)" fontSize="9">#</text>
            <text x="52" y="70" fill="rgba(255,255,255,0.6)" fontSize="9">My Presentation</text>

            {/* --- */}
            <text x="42" y="82" fill="rgba(255,255,255,0.25)" fontSize="9">---</text>

            {/* - Bullet */}
            <text x="42" y="94" fill="rgba(139,92,246,0.5)" fontSize="9">-</text>
            <text x="50" y="94" fill="rgba(255,255,255,0.4)" fontSize="9">First point</text>
          </g>

          {/* Blinking cursor */}
          <motion.rect
            x="95"
            y="87"
            width="1.5"
            height="10"
            rx="0.5"
            fill="rgba(139,92,246,0.8)"
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
          />
        </motion.g>

        {/* Right: Preview panel */}
        <motion.g
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: EASE_OUT }}
        >
          {/* Panel label */}
          <text x="152" y="55" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="system-ui">
            PREVIEW
          </text>

          {/* Slide preview */}
          <rect x="152" y="60" width="85" height="48" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Slide content preview */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            {/* Title in preview */}
            <rect x="162" y="72" width="50" height="5" rx="2" fill="rgba(255,255,255,0.4)" />

            {/* Bullet in preview */}
            <circle cx="166" cy="86" r="1.5" fill="rgba(255,255,255,0.25)" />
            <rect x="172" y="84.5" width="35" height="3" rx="1" fill="rgba(255,255,255,0.2)" />
          </motion.g>

          {/* Slide navigation dots */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <circle cx="187" cy="115" r="2.5" fill="rgba(255,255,255,0.5)" />
            <circle cx="197" cy="115" r="2" fill="rgba(255,255,255,0.15)" />
            <circle cx="205" cy="115" r="2" fill="rgba(255,255,255,0.15)" />
          </motion.g>
        </motion.g>

        {/* "Empty deck" badge */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <rect x="105" y="118" width="70" height="16" rx="8" fill="rgba(139,92,246,0.15)" />
          <text x="140" y="129" textAnchor="middle" fill="rgba(139,92,246,0.8)" fontSize="8" fontFamily="system-ui">Start typing...</text>
        </motion.g>

        {/* Decorative elements */}
        <motion.g
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <circle cx="255" cy="35" r="1.5" fill="rgba(139,92,246,0.4)" />
          <circle cx="25" cy="100" r="1" fill="rgba(139,92,246,0.3)" />
        </motion.g>
      </svg>
    </div>
  );
}

export default CreatingFromScratchIllustration;
