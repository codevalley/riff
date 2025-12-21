'use client';

// ============================================
// CreditsNeverExpireIllustration - Credits Never Expire
// Infinity symbol with timeless credits
// ============================================

import { motion } from 'framer-motion';

interface CreditsNeverExpireIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreditsNeverExpireIllustration({ className = '' }: CreditsNeverExpireIllustrationProps) {
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
          <radialGradient id="neverExpireGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(244,63,94,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.8)" />
            <stop offset="50%" stopColor="rgba(244,63,94,0.8)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0.8)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#neverExpireGlow)" />

        {/* Left: Crossed out clock/expiry */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Clock circle */}
          <circle cx="60" cy="70" r="28" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

          {/* Clock hands */}
          <line x1="60" y1="70" x2="60" y2="52" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="70" x2="74" y2="70" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />

          {/* Clock center */}
          <circle cx="60" cy="70" r="3" fill="rgba(255,255,255,0.3)" />

          {/* Expiry text */}
          <text x="60" y="110" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="system-ui">EXPIRES</text>

          {/* Red X overlay */}
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <circle cx="60" cy="70" r="30" fill="rgba(239,68,68,0.08)" />
            <line x1="38" y1="48" x2="82" y2="92" stroke="rgba(239,68,68,0.7)" strokeWidth="3" strokeLinecap="round" />
            <line x1="82" y1="48" x2="38" y2="92" stroke="rgba(239,68,68,0.7)" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        </motion.g>

        {/* Center: Animated infinity symbol with coins */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Infinity path */}
          <motion.path
            d="M140 70 C140 50, 160 50, 175 70 C190 90, 210 90, 210 70 C210 50, 190 50, 175 70 C160 90, 140 90, 140 70"
            stroke="url(#infinityGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Animated particle along infinity */}
          <motion.circle
            cx="0"
            cy="0"
            r="5"
            fill="rgba(251,191,36,0.9)"
            animate={{
              offsetDistance: ['0%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              offsetPath: 'path("M140 70 C140 50, 160 50, 175 70 C190 90, 210 90, 210 70 C210 50, 190 50, 175 70 C160 90, 140 90, 140 70")',
            }}
          />
        </motion.g>

        {/* Right: Credit coins with "Forever" label */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Stacked coins */}
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ellipse cx="245" cy="80" rx="20" ry="6" fill="rgba(251,191,36,0.25)" />
            <ellipse cx="245" cy="72" rx="20" ry="6" fill="rgba(251,191,36,0.35)" />
            <ellipse cx="245" cy="64" rx="20" ry="6" fill="rgba(251,191,36,0.5)" />
            <ellipse cx="245" cy="56" rx="20" ry="6" fill="rgba(251,191,36,0.7)" />

            {/* Coin sides */}
            <path d="M225 56 L225 80" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
            <path d="M265 56 L265 80" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />

            {/* Dollar sign on top */}
            <text x="245" y="60" textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="8" fontFamily="system-ui" fontWeight="bold">$</text>
          </motion.g>

          {/* Forever badge */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
          >
            <rect x="223" y="95" width="44" height="18" rx="9" fill="rgba(16,185,129,0.15)" />
            <text x="245" y="107" textAnchor="middle" fill="rgba(16,185,129,0.9)" fontSize="8" fontFamily="system-ui">Forever</text>
          </motion.g>
        </motion.g>

        {/* Sparkle accents */}
        <motion.g
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="130" cy="45" r="2" fill="rgba(251,191,36,0.5)" />
          <circle cx="200" cy="95" r="1.5" fill="rgba(251,191,36,0.4)" />
          <circle cx="165" cy="35" r="1" fill="rgba(244,63,94,0.5)" />
        </motion.g>
      </svg>
    </div>
  );
}

export default CreditsNeverExpireIllustration;
