'use client';

// ============================================
// SignInPromptIllustration - Deck Ready & Waiting
// Shows a polished deck ready to be claimed
// Warm, inviting feel - not security/vault
// ============================================

import { motion } from 'framer-motion';

interface SignInPromptIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function SignInPromptIllustration({ className = '' }: SignInPromptIllustrationProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 280 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[280px] h-[140px]"
      >
        {/* Ambient glow - warm amber */}
        <defs>
          <radialGradient id="readyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="slideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#readyGlow)" />

        {/* Center: Beautiful slide deck - the star */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Stack of slides - showing depth */}
          <motion.rect
            x="105"
            y="45"
            width="90"
            height="60"
            rx="6"
            fill="rgba(251,191,36,0.06)"
            stroke="rgba(251,191,36,0.15)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
          <motion.rect
            x="100"
            y="40"
            width="90"
            height="60"
            rx="6"
            fill="rgba(251,191,36,0.1)"
            stroke="rgba(251,191,36,0.2)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />
          {/* Top slide - prominent */}
          <motion.rect
            x="95"
            y="35"
            width="90"
            height="60"
            rx="6"
            fill="url(#slideGradient)"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          />

          {/* Slide content preview */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {/* Title bar */}
            <rect x="105" y="45" width="45" height="5" rx="2" fill="rgba(251,191,36,0.5)" />
            {/* Content lines */}
            <rect x="105" y="55" width="65" height="3" rx="1" fill="rgba(255,255,255,0.25)" />
            <rect x="105" y="62" width="55" height="3" rx="1" fill="rgba(255,255,255,0.18)" />
            <rect x="105" y="69" width="60" height="3" rx="1" fill="rgba(255,255,255,0.12)" />
            {/* Small accent */}
            <rect x="105" y="78" width="25" height="8" rx="2" fill="rgba(16,185,129,0.2)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          </motion.g>

          {/* Checkmark badge - ready state */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <circle cx="175" cy="42" r="10" fill="rgba(16,185,129,0.9)" />
            <path
              d="M170 42 L173 45 L180 38"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </motion.g>
        </motion.g>

        {/* Left: Floating elements showing content came from somewhere */}
        <motion.g
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {/* Small doc icon */}
          <rect x="35" y="55" width="28" height="35" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <rect x="40" y="62" width="16" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
          <rect x="40" y="68" width="12" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
          <rect x="40" y="74" width="14" height="2" rx="1" fill="rgba(255,255,255,0.1)" />

          {/* Arrow showing transformation happened */}
          <motion.path
            d="M68 72 Q 78 72, 85 65"
            stroke="rgba(251,191,36,0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="3 2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />
        </motion.g>

        {/* Right: User avatar placeholder - waiting for you */}
        <motion.g
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {/* Dashed circle - spot waiting */}
          <motion.circle
            cx="225"
            cy="70"
            r="18"
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '225px 70px' }}
          />
          {/* User silhouette */}
          <circle cx="225" cy="64" r="6" fill="rgba(255,255,255,0.15)" />
          <path
            d="M215 82 Q 225 75, 235 82"
            fill="rgba(255,255,255,0.12)"
          />

          {/* Arrow pointing to deck */}
          <motion.path
            d="M205 70 L195 70"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          />
          <motion.path
            d="M198 66 L194 70 L198 74"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          />
        </motion.g>

        {/* Floating sparkles - magic/delight */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.circle
            cx="80"
            cy="45"
            r="2"
            fill="rgba(251,191,36,0.5)"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="200"
            cy="105"
            r="1.5"
            fill="rgba(16,185,129,0.5)"
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="250"
            cy="50"
            r="1.5"
            fill="rgba(251,191,36,0.4)"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }}
          />
        </motion.g>

        {/* Slide count badge */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          <rect x="115" y="108" width="50" height="18" rx="9" fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
          <text x="140" y="120" textAnchor="middle" fill="rgba(251,191,36,0.8)" fontSize="9" fontFamily="system-ui" fontWeight="500">Ready!</text>
        </motion.g>
      </svg>
    </div>
  );
}

export default SignInPromptIllustration;
