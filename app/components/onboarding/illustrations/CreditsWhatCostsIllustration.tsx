'use client';

// ============================================
// CreditsWhatCostsIllustration - What Uses Credits
// Shows image/theme/revamp with costs, free items below
// ============================================

import { motion } from 'framer-motion';

interface CreditsWhatCostsIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreditsWhatCostsIllustration({ className = '' }: CreditsWhatCostsIllustrationProps) {
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
          <radialGradient id="whatCostsGlow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#whatCostsGlow)" />

        {/* Divider line */}
        <motion.line
          x1="40"
          y1="85"
          x2="240"
          y2="85"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        />

        {/* Top section label */}
        <motion.text
          x="140"
          y="22"
          textAnchor="middle"
          fill="rgba(251,191,36,0.7)"
          fontSize="8"
          fontFamily="system-ui"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          USES CREDITS
        </motion.text>

        {/* Credits items row */}
        {/* Image generation */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASE_OUT }}
        >
          <rect x="35" y="35" width="50" height="40" rx="6" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          {/* Image icon */}
          <rect x="45" y="42" width="20" height="14" rx="2" fill="rgba(16,185,129,0.3)" />
          <circle cx="51" cy="48" r="2" fill="rgba(16,185,129,0.5)" />
          <path d="M47 54 L52 50 L57 54 L62 48 L65 54" stroke="rgba(16,185,129,0.5)" strokeWidth="1" fill="none" />
          <text x="60" y="68" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui">Images</text>
          {/* Credit cost badge */}
          <circle cx="80" cy="40" r="8" fill="rgba(251,191,36,0.2)" />
          <text x="80" y="43" textAnchor="middle" fill="rgba(251,191,36,0.9)" fontSize="7" fontFamily="system-ui" fontWeight="bold">1</text>
        </motion.g>

        {/* Theme generation */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: EASE_OUT }}
        >
          <rect x="115" y="35" width="50" height="40" rx="6" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
          {/* Palette icon */}
          <circle cx="135" cy="50" r="8" fill="rgba(139,92,246,0.25)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
          <circle cx="132" cy="47" r="2" fill="rgba(244,63,94,0.6)" />
          <circle cx="138" cy="47" r="2" fill="rgba(59,130,246,0.6)" />
          <circle cx="135" cy="53" r="2" fill="rgba(16,185,129,0.6)" />
          <text x="140" y="68" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui">Themes</text>
          {/* Credit cost badge */}
          <circle cx="160" cy="40" r="8" fill="rgba(251,191,36,0.2)" />
          <text x="160" y="43" textAnchor="middle" fill="rgba(251,191,36,0.9)" fontSize="7" fontFamily="system-ui" fontWeight="bold">2</text>
        </motion.g>

        {/* Deck revamp */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
        >
          <rect x="195" y="35" width="50" height="40" rx="6" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
          {/* Wand/magic icon */}
          <line x1="212" y1="56" x2="228" y2="44" stroke="rgba(251,191,36,0.5)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="229" cy="43" r="3" fill="rgba(251,191,36,0.4)" />
          {/* Sparkles */}
          <circle cx="215" cy="45" r="1" fill="rgba(251,191,36,0.6)" />
          <circle cx="225" cy="52" r="1" fill="rgba(251,191,36,0.5)" />
          <text x="220" y="68" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui">Revamps</text>
          {/* Credit cost badge */}
          <circle cx="240" cy="40" r="8" fill="rgba(251,191,36,0.2)" />
          <text x="240" y="43" textAnchor="middle" fill="rgba(251,191,36,0.9)" fontSize="7" fontFamily="system-ui" fontWeight="bold">4</text>
        </motion.g>

        {/* Bottom section label */}
        <motion.text
          x="140"
          y="98"
          textAnchor="middle"
          fill="rgba(16,185,129,0.7)"
          fontSize="8"
          fontFamily="system-ui"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          ALWAYS FREE
        </motion.text>

        {/* Free items row */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {/* Edit icon */}
          <g>
            <rect x="55" y="106" width="24" height="20" rx="4" fill="rgba(255,255,255,0.04)" />
            <path d="M62 112 L70 112 M62 116 L74 116 M62 120 L68 120" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
            <text x="67" y="132" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="system-ui">Edit</text>
          </g>

          {/* Export icon */}
          <g>
            <rect x="100" y="106" width="24" height="20" rx="4" fill="rgba(255,255,255,0.04)" />
            <path d="M112 118 L112 112 M108 114 L112 110 L116 114" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <text x="112" y="132" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="system-ui">Export</text>
          </g>

          {/* Share icon */}
          <g>
            <rect x="145" y="106" width="24" height="20" rx="4" fill="rgba(255,255,255,0.04)" />
            <circle cx="154" cy="113" r="2" fill="rgba(255,255,255,0.25)" />
            <circle cx="162" cy="116" r="2" fill="rgba(255,255,255,0.25)" />
            <circle cx="154" cy="119" r="2" fill="rgba(255,255,255,0.25)" />
            <line x1="156" y1="114" x2="160" y2="115" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="156" y1="118" x2="160" y2="117" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x="157" y="132" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="system-ui">Share</text>
          </g>

          {/* More icon */}
          <g>
            <rect x="190" y="106" width="24" height="20" rx="4" fill="rgba(255,255,255,0.04)" />
            <text x="202" y="119" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="system-ui">...</text>
            <text x="202" y="132" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="system-ui">& more</text>
          </g>
        </motion.g>
      </svg>
    </div>
  );
}

export default CreditsWhatCostsIllustration;
