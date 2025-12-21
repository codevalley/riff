'use client';

// ============================================
// CreditsTrustIllustration - Our Promise
// No dark patterns, your work is portable
// ============================================

import { motion } from 'framer-motion';

interface CreditsTrustIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreditsTrustIllustration({ className = '' }: CreditsTrustIllustrationProps) {
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
          <radialGradient id="trustGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="shieldGradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.6)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.3)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#trustGlow)" />

        {/* Left: Crossed out timer/countdown */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Timer/hourglass shape */}
          <rect x="35" y="45" width="50" height="50" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Countdown display */}
          <rect x="43" y="55" width="34" height="14" rx="3" fill="rgba(239,68,68,0.1)" />
          <text x="60" y="65" textAnchor="middle" fill="rgba(239,68,68,0.5)" fontSize="9" fontFamily="monospace">00:59</text>

          {/* "LIMITED" text */}
          <text x="60" y="82" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="system-ui">LIMITED!</text>

          {/* Red X overlay */}
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <line x1="30" y1="40" x2="90" y2="100" stroke="rgba(239,68,68,0.7)" strokeWidth="3" strokeLinecap="round" />
            <line x1="90" y1="40" x2="30" y2="100" stroke="rgba(239,68,68,0.7)" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        </motion.g>

        {/* Center: Shield with checkmark */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Shield shape */}
          <motion.path
            d="M140 30 L160 38 L160 65 C160 80 140 95 140 95 C140 95 120 80 120 65 L120 38 Z"
            fill="url(#shieldGradient)"
            stroke="rgba(16,185,129,0.6)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          />

          {/* Checkmark inside shield */}
          <motion.path
            d="M132 60 L138 66 L150 52"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          />

          {/* "Trust" label */}
          <motion.text
            x="140"
            y="110"
            textAnchor="middle"
            fill="rgba(16,185,129,0.8)"
            fontSize="9"
            fontFamily="system-ui"
            fontWeight="500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            Your trust matters
          </motion.text>
        </motion.g>

        {/* Right: Portable markdown export */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
        >
          {/* File icon */}
          <rect x="195" y="45" width="50" height="50" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Markdown document */}
          <rect x="203" y="52" width="34" height="28" rx="3" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
          <text x="220" y="64" textAnchor="middle" fill="rgba(59,130,246,0.6)" fontSize="8" fontFamily="monospace" fontWeight="bold">MD</text>
          <rect x="208" y="68" width="24" height="2" rx="1" fill="rgba(59,130,246,0.3)" />
          <rect x="208" y="73" width="18" height="2" rx="1" fill="rgba(59,130,246,0.2)" />

          {/* Export arrow */}
          <motion.g
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M242 68 L252 68" stroke="rgba(16,185,129,0.6)" strokeWidth="2" strokeLinecap="round" />
            <path d="M249 64 L254 68 L249 72" stroke="rgba(16,185,129,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </motion.g>

          {/* "Take anywhere" label */}
          <text x="220" y="105" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="system-ui">Take it anywhere</text>
        </motion.g>

        {/* Decorative trust elements */}
        <motion.g
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <circle cx="100" cy="55" r="1.5" fill="rgba(16,185,129,0.5)" />
          <circle cx="180" cy="40" r="1" fill="rgba(16,185,129,0.4)" />
          <circle cx="165" cy="100" r="1.5" fill="rgba(59,130,246,0.4)" />
        </motion.g>

        {/* Subtle pulse around shield */}
        <motion.path
          d="M140 25 L165 35 L165 67 C165 85 140 102 140 102 C140 102 115 85 115 67 L115 35 Z"
          fill="none"
          stroke="rgba(16,185,129,0.3)"
          strokeWidth="1"
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}

export default CreditsTrustIllustration;
