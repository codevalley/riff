'use client';

// ============================================
// CreatingIntroIllustration - Create a New Riff
// Three paths emanating from center - content, scratch, import
// ============================================

import { motion } from 'framer-motion';

interface CreatingIntroIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreatingIntroIllustration({ className = '' }: CreatingIntroIllustrationProps) {
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
          <radialGradient id="creatingIntroGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="creatingGradient" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.6)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.6)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#creatingIntroGlow)" />

        {/* Center: Plus icon in circle */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <circle cx="140" cy="70" r="22" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <line x1="140" y1="60" x2="140" y2="80" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="130" y1="70" x2="150" y2="70" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
          </motion.g>
        </motion.g>

        {/* Left path: From Content */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: EASE_OUT }}
        >
          {/* Connecting line */}
          <motion.line
            x1="118" y1="70"
            x2="65" y2="45"
            stroke="rgba(59,130,246,0.3)"
            strokeWidth="1"
            strokeDasharray="3 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          />

          {/* Content icon - document with lines */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <rect x="30" y="25" width="35" height="40" rx="4" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />
            <rect x="37" y="33" width="18" height="2" rx="1" fill="rgba(59,130,246,0.5)" />
            <rect x="37" y="39" width="21" height="2" rx="1" fill="rgba(59,130,246,0.3)" />
            <rect x="37" y="45" width="15" height="2" rx="1" fill="rgba(59,130,246,0.3)" />
            <rect x="37" y="51" width="19" height="2" rx="1" fill="rgba(59,130,246,0.2)" />
          </motion.g>

          <text x="47" y="75" textAnchor="middle" fill="rgba(59,130,246,0.7)" fontSize="7" fontFamily="system-ui">Content</text>
        </motion.g>

        {/* Bottom path: From Scratch */}
        <motion.g
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
        >
          {/* Connecting line */}
          <motion.line
            x1="140" y1="92"
            x2="140" y2="105"
            stroke="rgba(139,92,246,0.3)"
            strokeWidth="1"
            strokeDasharray="3 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          />

          {/* Editor icon - split view */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <rect x="115" y="107" width="50" height="25" rx="4" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
            <line x1="140" y1="112" x2="140" y2="127" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
            {/* Left: markdown */}
            <text x="127" y="120" textAnchor="middle" fill="rgba(139,92,246,0.6)" fontSize="7" fontFamily="monospace">#</text>
            {/* Right: preview */}
            <rect x="145" y="115" width="12" height="2" rx="1" fill="rgba(139,92,246,0.3)" />
            <rect x="145" y="120" width="8" height="2" rx="1" fill="rgba(139,92,246,0.2)" />
          </motion.g>

          <text x="140" y="141" textAnchor="middle" fill="rgba(139,92,246,0.7)" fontSize="7" fontFamily="system-ui">Scratch</text>
        </motion.g>

        {/* Right path: Import .riff */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.4, ease: EASE_OUT }}
        >
          {/* Connecting line */}
          <motion.line
            x1="162" y1="70"
            x2="215" y2="45"
            stroke="rgba(16,185,129,0.3)"
            strokeWidth="1"
            strokeDasharray="3 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          />

          {/* .riff file icon */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <path
              d="M215 25 L215 60 C215 63 217 65 220 65 L245 65 C248 65 250 63 250 60 L250 35 L240 25 Z"
              fill="rgba(16,185,129,0.1)"
              stroke="rgba(16,185,129,0.4)"
              strokeWidth="1.5"
            />
            <path d="M240 25 L250 35 L240 35 Z" fill="rgba(16,185,129,0.2)" />
            <rect x="222" y="42" width="22" height="10" rx="2" fill="rgba(16,185,129,0.25)" />
            <text x="233" y="50" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="6" fontFamily="monospace">.riff</text>
          </motion.g>

          <text x="232" y="75" textAnchor="middle" fill="rgba(16,185,129,0.7)" fontSize="7" fontFamily="system-ui">Import</text>
        </motion.g>

        {/* Top label */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          <text x="140" y="18" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="system-ui">
            Choose your starting point
          </text>
        </motion.g>

        {/* Decorative sparkles */}
        <motion.g
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <circle cx="95" cy="95" r="1.5" fill="rgba(99,102,241,0.5)" />
          <circle cx="185" cy="95" r="1.5" fill="rgba(99,102,241,0.5)" />
          <circle cx="75" cy="65" r="1" fill="rgba(59,130,246,0.4)" />
          <circle cx="205" cy="65" r="1" fill="rgba(16,185,129,0.4)" />
        </motion.g>
      </svg>
    </div>
  );
}

export default CreatingIntroIllustration;
