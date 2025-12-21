'use client';

// ============================================
// CreatingFromContentIllustration - From Your Content
// Document/notes transforming into polished slides
// ============================================

import { motion } from 'framer-motion';

interface CreatingFromContentIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreatingFromContentIllustration({ className = '' }: CreatingFromContentIllustrationProps) {
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
          <radialGradient id="fromContentGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.5)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.3)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#fromContentGlow)" />

        {/* Left: Various document types */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Document 1: Text file */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <rect x="25" y="35" width="40" height="50" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <rect x="31" y="43" width="24" height="2" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="31" y="49" width="28" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
            <rect x="31" y="55" width="20" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
            <rect x="31" y="61" width="26" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
            <rect x="31" y="67" width="18" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
            <rect x="31" y="73" width="22" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
          </motion.g>

          {/* Document 2: Notes */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <rect x="45" y="55" width="35" height="45" rx="4" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
            <rect x="50" y="62" width="18" height="2" rx="1" fill="rgba(251,191,36,0.4)" />
            <rect x="50" y="68" width="24" height="2" rx="1" fill="rgba(251,191,36,0.3)" />
            <rect x="50" y="74" width="14" height="2" rx="1" fill="rgba(251,191,36,0.2)" />
            <circle cx="52" cy="85" r="1.5" fill="rgba(251,191,36,0.3)" />
            <rect x="56" y="84" width="16" height="2" rx="1" fill="rgba(251,191,36,0.2)" />
            <circle cx="52" cy="91" r="1.5" fill="rgba(251,191,36,0.3)" />
            <rect x="56" y="90" width="12" height="2" rx="1" fill="rgba(251,191,36,0.2)" />
          </motion.g>

          {/* Clipboard text */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <rect x="35" y="20" width="30" height="20" rx="3" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <text x="50" y="33" textAnchor="middle" fill="rgba(16,185,129,0.6)" fontSize="8" fontFamily="system-ui">Paste</text>
          </motion.g>
        </motion.g>

        {/* Center: Transformation arrow with magic */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {/* Arrow */}
          <path d="M100 70 L130 70" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
          <path d="M125 65 L132 70 L125 75" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Magic sparkles */}
          <motion.circle
            cx="115"
            cy="60"
            r="2"
            fill="rgba(251,191,36,0.6)"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="120"
            cy="78"
            r="1.5"
            fill="rgba(59,130,246,0.6)"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          />
        </motion.g>

        {/* Right: Polished slide deck */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Stack of slides */}
          <motion.rect
            x="155"
            y="50"
            width="80"
            height="55"
            rx="6"
            fill="rgba(59,130,246,0.08)"
            stroke="rgba(59,130,246,0.2)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          />
          <motion.rect
            x="150"
            y="45"
            width="80"
            height="55"
            rx="6"
            fill="rgba(59,130,246,0.12)"
            stroke="rgba(59,130,246,0.25)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          />
          <motion.rect
            x="145"
            y="40"
            width="80"
            height="55"
            rx="6"
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          />

          {/* Slide content */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <rect x="155" y="50" width="40" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
            <rect x="155" y="58" width="60" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
            <rect x="155" y="64" width="50" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
            <rect x="155" y="70" width="55" height="2" rx="1" fill="rgba(255,255,255,0.15)" />

            {/* Image placeholder */}
            <rect x="155" y="78" width="30" height="12" rx="2" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          </motion.g>

          {/* Slide count indicator */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.3 }}
          >
            <rect x="175" y="105" width="40" height="16" rx="8" fill="rgba(255,255,255,0.06)" />
            <text x="195" y="116" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="system-ui">3 slides</text>
          </motion.g>
        </motion.g>

        {/* Decorative sparkles */}
        <motion.g
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="95" cy="45" r="1.5" fill="rgba(251,191,36,0.4)" />
          <circle cx="140" cy="95" r="1" fill="rgba(59,130,246,0.5)" />
        </motion.g>
      </svg>
    </div>
  );
}

export default CreatingFromContentIllustration;
