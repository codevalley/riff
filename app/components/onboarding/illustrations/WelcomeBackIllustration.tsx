'use client';

// ============================================
// WelcomeBackIllustration - Returning User Welcome
// Shows stacked decks representing user's presentations
// Warm, inviting feel for returning users
// ============================================

import { motion } from 'framer-motion';

interface WelcomeBackIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function WelcomeBackIllustration({ className = '' }: WelcomeBackIllustrationProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 280 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[280px] h-[120px]"
      >
        {/* Ambient glow - subtle white */}
        <defs>
          <radialGradient id="welcomeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="deckGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="120" fill="url(#welcomeGlow)" />

        {/* Stack of decks - representing user's presentations */}
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Back deck */}
          <motion.rect
            x="100"
            y="35"
            width="80"
            height="55"
            rx="5"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          />

          {/* Middle deck */}
          <motion.rect
            x="95"
            y="30"
            width="80"
            height="55"
            rx="5"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />

          {/* Front deck */}
          <motion.rect
            x="90"
            y="25"
            width="80"
            height="55"
            rx="5"
            fill="url(#deckGradient)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          />

          {/* Content lines on front deck */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <rect x="100" y="35" width="35" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
            <rect x="100" y="44" width="55" height="3" rx="1" fill="rgba(255,255,255,0.12)" />
            <rect x="100" y="51" width="45" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
            <rect x="100" y="58" width="50" height="3" rx="1" fill="rgba(255,255,255,0.06)" />
          </motion.g>
        </motion.g>

        {/* Floating dots - subtle activity */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.circle
            cx="60"
            cy="45"
            r="2"
            fill="rgba(255,255,255,0.15)"
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.circle
            cx="220"
            cy="75"
            r="1.5"
            fill="rgba(255,255,255,0.12)"
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="200"
            cy="35"
            r="1.5"
            fill="rgba(255,255,255,0.1)"
            animate={{ opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 1 }}
          />
        </motion.g>

        {/* Subtle arrow pointing to decks */}
        <motion.path
          d="M55 60 L75 60"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        />
        <motion.path
          d="M72 56 L76 60 L72 64"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        />
      </svg>
    </div>
  );
}

export default WelcomeBackIllustration;
