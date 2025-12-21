'use client';

// ============================================
// ThemeIllustration - Design Your Theme
// Describe a mood → get colors, fonts, spacing
// ============================================

import { motion } from 'framer-motion';

interface ThemeIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function ThemeIllustration({ className = '' }: ThemeIllustrationProps) {
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
          <radialGradient id="themeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="themeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.5)" />
            <stop offset="100%" stopColor="rgba(236,72,153,0.5)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#themeGlow)" />

        {/* Left: Prompt input area */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Input container */}
          <rect x="25" y="40" width="90" height="60" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

          {/* Label */}
          <text x="32" y="55" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui">
            Describe your theme...
          </text>

          {/* Sample prompt text */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <text x="32" y="70" fill="rgba(168,85,247,0.8)" fontSize="8" fontFamily="system-ui">
              "Dark, minimal,
            </text>
            <text x="32" y="82" fill="rgba(168,85,247,0.8)" fontSize="8" fontFamily="system-ui">
              tech-forward"
            </text>
          </motion.g>

          {/* Blinking cursor */}
          <motion.rect
            x="87"
            y="74"
            width="1.5"
            height="10"
            rx="0.5"
            fill="rgba(168,85,247,0.8)"
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
          />
        </motion.g>

        {/* Center: Transformation arrow with magic */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {/* Arrow */}
          <path d="M125 70 L150 70" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
          <path d="M145 65 L152 70 L145 75" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Magic sparkles */}
          <motion.circle
            cx="138"
            cy="58"
            r="2"
            fill="rgba(168,85,247,0.7)"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="142"
            cy="80"
            r="1.5"
            fill="rgba(236,72,153,0.7)"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          />
        </motion.g>

        {/* Right: Generated theme output */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Output container */}
          <rect x="165" y="25" width="90" height="90" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" />

          {/* Color palette row */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <text x="172" y="42" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="system-ui">
              COLORS
            </text>
            <circle cx="180" cy="52" r="6" fill="rgba(15,23,42,1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="196" cy="52" r="6" fill="rgba(168,85,247,0.8)" />
            <circle cx="212" cy="52" r="6" fill="rgba(99,102,241,0.8)" />
            <circle cx="228" cy="52" r="6" fill="rgba(236,72,153,0.6)" />
            <circle cx="244" cy="52" r="6" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </motion.g>

          {/* Font samples */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <text x="172" y="72" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="system-ui">
              FONTS
            </text>
            <text x="172" y="86" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="system-ui" fontWeight="600">
              Aa
            </text>
            <text x="195" y="86" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="monospace">
              Aa
            </text>
          </motion.g>

          {/* Spacing indicators */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <text x="172" y="100" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="system-ui">
              SPACING
            </text>
            <rect x="172" y="104" width="8" height="4" rx="1" fill="rgba(168,85,247,0.4)" />
            <rect x="184" y="104" width="12" height="4" rx="1" fill="rgba(168,85,247,0.3)" />
            <rect x="200" y="104" width="16" height="4" rx="1" fill="rgba(168,85,247,0.2)" />
          </motion.g>
        </motion.g>

        {/* Bottom label */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <text x="140" y="132" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="system-ui">
            One description → complete theme
          </text>
        </motion.g>

        {/* Decorative sparkles */}
        <motion.g
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <circle cx="55" cy="25" r="1.5" fill="rgba(168,85,247,0.5)" />
          <circle cx="230" cy="20" r="1" fill="rgba(236,72,153,0.4)" />
        </motion.g>
      </svg>
    </div>
  );
}

export default ThemeIllustration;
