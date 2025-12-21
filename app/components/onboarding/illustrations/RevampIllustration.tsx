'use client';

// ============================================
// RevampIllustration - Revamp Your Deck
// End-to-end redesign based on instructions
// ============================================

import { motion } from 'framer-motion';

interface RevampIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function RevampIllustration({ className = '' }: RevampIllustrationProps) {
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
          <radialGradient id="revampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(251,146,60,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="revampGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(251,146,60,0.5)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0.5)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#revampGlow)" />

        {/* Left: Before state - basic deck */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Before label */}
          <text x="60" y="22" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="system-ui">
            BEFORE
          </text>

          {/* Stack of basic slides */}
          <motion.rect
            x="30" y="35" width="60" height="40" rx="4"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          <motion.rect
            x="25" y="30" width="60" height="40" rx="4"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          />

          {/* Basic content lines */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <rect x="32" y="38" width="25" height="3" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="32" y="45" width="45" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
            <rect x="32" y="51" width="35" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
            <rect x="32" y="57" width="40" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
          </motion.g>

          {/* "Plain" indicator */}
          <motion.rect
            x="35" y="80" width="40" height="12" rx="6"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.2 }}
          />
          <text x="55" y="89" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="system-ui">
            Basic
          </text>
        </motion.g>

        {/* Center: Transformation with instruction */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {/* Instruction bubble */}
          <rect x="105" y="20" width="70" height="28" rx="6" fill="rgba(251,146,60,0.1)" stroke="rgba(251,146,60,0.3)" strokeWidth="1" />
          <text x="140" y="33" textAnchor="middle" fill="rgba(251,146,60,0.8)" fontSize="7" fontFamily="system-ui">
            "Make it modern
          </text>
          <text x="140" y="43" textAnchor="middle" fill="rgba(251,146,60,0.8)" fontSize="7" fontFamily="system-ui">
            and bold"
          </text>

          {/* Transformation arrow */}
          <motion.path
            d="M100 70 L180 70"
            stroke="rgba(251,146,60,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
          <motion.path
            d="M175 65 L182 70 L175 75"
            stroke="rgba(251,146,60,0.5)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.2 }}
          />

          {/* Magic sparkles around arrow */}
          <motion.circle
            cx="125" cy="60" r="2"
            fill="rgba(251,146,60,0.7)"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="155" cy="78" r="1.5"
            fill="rgba(239,68,68,0.6)"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
          />
          <motion.circle
            cx="140" cy="85" r="1.5"
            fill="rgba(251,146,60,0.5)"
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.2 }}
          />
        </motion.g>

        {/* Right: After state - polished deck */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: EASE_OUT }}
        >
          {/* After label */}
          <text x="220" y="22" textAnchor="middle" fill="rgba(251,146,60,0.5)" fontSize="7" fontFamily="system-ui">
            AFTER
          </text>

          {/* Stack of polished slides */}
          <motion.rect
            x="195" y="35" width="60" height="40" rx="4"
            fill="rgba(251,146,60,0.05)"
            stroke="rgba(251,146,60,0.15)"
            strokeWidth="1"
          />
          <motion.rect
            x="190" y="30" width="60" height="40" rx="4"
            fill="rgba(251,146,60,0.1)"
            stroke="rgba(251,146,60,0.3)"
            strokeWidth="1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          />

          {/* Polished content with color accent */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <rect x="197" y="38" width="30" height="4" rx="2" fill="rgba(251,146,60,0.6)" />
            <rect x="197" y="46" width="45" height="2" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="197" y="52" width="38" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
            {/* Image placeholder */}
            <rect x="197" y="58" width="20" height="8" rx="2" fill="rgba(251,146,60,0.2)" />
          </motion.g>

          {/* "Redesigned" indicator */}
          <motion.rect
            x="190" y="80" width="60" height="12" rx="6"
            fill="rgba(251,146,60,0.15)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.2 }}
          />
          <text x="220" y="89" textAnchor="middle" fill="rgba(251,146,60,0.8)" fontSize="6" fontFamily="system-ui">
            Redesigned
          </text>
        </motion.g>

        {/* Bottom: End-to-end message */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.3 }}
        >
          <text x="140" y="115" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui">
            Style • Structure • Visuals • Everything
          </text>

          {/* Credit cost hint */}
          <rect x="110" y="122" width="60" height="12" rx="6" fill="rgba(251,191,36,0.1)" />
          <text x="140" y="131" textAnchor="middle" fill="rgba(251,191,36,0.7)" fontSize="6" fontFamily="system-ui">
            Uses credits
          </text>
        </motion.g>

        {/* Decorative elements */}
        <motion.g
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <circle cx="15" cy="70" r="1.5" fill="rgba(251,146,60,0.4)" />
          <circle cx="265" cy="70" r="1.5" fill="rgba(251,146,60,0.4)" />
        </motion.g>
      </svg>
    </div>
  );
}

export default RevampIllustration;
