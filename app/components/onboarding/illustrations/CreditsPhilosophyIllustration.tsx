'use client';

// ============================================
// CreditsPhilosophyIllustration - Pay for What You Use
// No subscriptions - just credits when you need them
// ============================================

import { motion } from 'framer-motion';

interface CreditsPhilosophyIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreditsPhilosophyIllustration({ className = '' }: CreditsPhilosophyIllustrationProps) {
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
          <radialGradient id="creditsPhiloGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.8)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0.6)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#creditsPhiloGlow)" />

        {/* Left side: Crossed out subscription */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Calendar/subscription icon */}
          <rect x="35" y="45" width="50" height="50" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="35" y="45" width="50" height="12" rx="8" fill="rgba(239,68,68,0.15)" />
          <text x="60" y="54" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="system-ui">$XX/mo</text>
          {/* Calendar dots */}
          <g fill="rgba(255,255,255,0.15)">
            <circle cx="48" cy="70" r="3" />
            <circle cx="60" cy="70" r="3" />
            <circle cx="72" cy="70" r="3" />
            <circle cx="48" cy="82" r="3" />
            <circle cx="60" cy="82" r="3" />
            <circle cx="72" cy="82" r="3" />
          </g>

          {/* Strike-through X */}
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <line x1="30" y1="40" x2="90" y2="100" stroke="rgba(239,68,68,0.7)" strokeWidth="3" strokeLinecap="round" />
            <line x1="90" y1="40" x2="30" y2="100" stroke="rgba(239,68,68,0.7)" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        </motion.g>

        {/* Center: Arrow */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <path d="M105 70 L125 70" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
          <path d="M120 65 L127 70 L120 75" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>

        {/* Right side: Credits coin stack */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Stack of coins */}
          <motion.ellipse
            cx="190"
            cy="95"
            rx="35"
            ry="10"
            fill="rgba(251,191,36,0.2)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
          <motion.ellipse
            cx="190"
            cy="80"
            rx="35"
            ry="10"
            fill="rgba(251,191,36,0.3)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          />
          <motion.ellipse
            cx="190"
            cy="65"
            rx="35"
            ry="10"
            fill="rgba(251,191,36,0.4)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          />

          {/* Top coin with symbol */}
          <motion.g
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <ellipse cx="190" cy="50" rx="35" ry="10" fill="url(#coinGradient)" />
            <text x="190" y="54" textAnchor="middle" fill="rgba(0,0,0,0.5)" fontSize="10" fontFamily="system-ui" fontWeight="600">CREDITS</text>
          </motion.g>

          {/* Coin sides connecting layers */}
          <path d="M155 50 L155 95" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
          <path d="M225 50 L225 95" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
        </motion.g>

        {/* Floating "Use as needed" indicator */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          <rect x="160" y="20" width="60" height="18" rx="9" fill="rgba(16,185,129,0.15)" />
          <text x="190" y="32" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="8" fontFamily="system-ui">Pay as you go</text>
        </motion.g>

        {/* Subtle pulse on coins */}
        <motion.ellipse
          cx="190"
          cy="50"
          rx="35"
          ry="10"
          fill="none"
          stroke="rgba(251,191,36,0.4)"
          strokeWidth="1"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}

export default CreditsPhilosophyIllustration;
