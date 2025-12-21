'use client';

// ============================================
// CreatingImportRiffIllustration - Import a .riff
// Complete backup file with slides, images, themes, metadata
// ============================================

import { motion } from 'framer-motion';

interface CreatingImportRiffIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreatingImportRiffIllustration({ className = '' }: CreatingImportRiffIllustrationProps) {
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
          <radialGradient id="importRiffGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="riffFileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.6)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.3)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#importRiffGlow)" />

        {/* Center: .riff file icon */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* File shape */}
          <path
            d="M115 30 L115 95 C115 99 118 102 122 102 L158 102 C162 102 165 99 165 95 L165 45 L150 30 Z"
            fill="rgba(16,185,129,0.15)"
            stroke="rgba(16,185,129,0.5)"
            strokeWidth="1.5"
          />

          {/* Folded corner */}
          <path
            d="M150 30 L165 45 L150 45 Z"
            fill="rgba(16,185,129,0.25)"
            stroke="rgba(16,185,129,0.4)"
            strokeWidth="1"
          />

          {/* .riff label */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <rect x="122" y="55" width="36" height="16" rx="3" fill="rgba(16,185,129,0.3)" />
            <text x="140" y="66" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="9" fontFamily="monospace" fontWeight="bold">.riff</text>
          </motion.g>

          {/* Content indicators inside file */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <rect x="122" y="78" width="20" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
            <rect x="122" y="84" width="30" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
            <rect x="122" y="90" width="18" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
          </motion.g>
        </motion.g>

        {/* Left: Content inside the file */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Slides indicator */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <rect x="30" y="35" width="55" height="35" rx="4" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
            <rect x="35" y="42" width="25" height="3" rx="1" fill="rgba(59,130,246,0.4)" />
            <rect x="35" y="49" width="40" height="2" rx="1" fill="rgba(59,130,246,0.25)" />
            <rect x="35" y="55" width="30" height="2" rx="1" fill="rgba(59,130,246,0.2)" />
            <rect x="35" y="61" width="35" height="2" rx="1" fill="rgba(59,130,246,0.15)" />
            <text x="57" y="78" textAnchor="middle" fill="rgba(59,130,246,0.7)" fontSize="7" fontFamily="system-ui">Slides</text>
          </motion.g>

          {/* Images indicator */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <rect x="30" y="85" width="55" height="35" rx="4" fill="rgba(251,191,36,0.1)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
            {/* Image icon */}
            <rect x="38" y="92" width="18" height="13" rx="2" fill="rgba(251,191,36,0.2)" />
            <circle cx="44" cy="97" r="2" fill="rgba(251,191,36,0.4)" />
            <path d="M40 103 L45 99 L50 103 L54 97" stroke="rgba(251,191,36,0.4)" strokeWidth="1" fill="none" />
            {/* Second image */}
            <rect x="60" y="95" width="12" height="8" rx="1" fill="rgba(251,191,36,0.15)" />
            <text x="57" y="128" textAnchor="middle" fill="rgba(251,191,36,0.7)" fontSize="7" fontFamily="system-ui">Images</text>
          </motion.g>
        </motion.g>

        {/* Right: More content types */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Theme indicator */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <rect x="195" y="35" width="55" height="35" rx="4" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
            {/* Color palette dots */}
            <circle cx="210" cy="50" r="5" fill="rgba(59,130,246,0.4)" />
            <circle cx="222" cy="50" r="5" fill="rgba(16,185,129,0.4)" />
            <circle cx="234" cy="50" r="5" fill="rgba(251,191,36,0.4)" />
            <rect x="205" y="60" width="35" height="2" rx="1" fill="rgba(139,92,246,0.3)" />
            <text x="222" y="78" textAnchor="middle" fill="rgba(139,92,246,0.7)" fontSize="7" fontFamily="system-ui">Theme</text>
          </motion.g>

          {/* Metadata indicator */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <rect x="195" y="85" width="55" height="35" rx="4" fill="rgba(244,63,94,0.1)" stroke="rgba(244,63,94,0.3)" strokeWidth="1" />
            {/* Metadata lines */}
            <rect x="202" y="93" width="8" height="2" rx="1" fill="rgba(244,63,94,0.3)" />
            <rect x="213" y="93" width="28" height="2" rx="1" fill="rgba(244,63,94,0.2)" />
            <rect x="202" y="100" width="12" height="2" rx="1" fill="rgba(244,63,94,0.3)" />
            <rect x="217" y="100" width="20" height="2" rx="1" fill="rgba(244,63,94,0.2)" />
            <rect x="202" y="107" width="6" height="2" rx="1" fill="rgba(244,63,94,0.3)" />
            <rect x="211" y="107" width="24" height="2" rx="1" fill="rgba(244,63,94,0.2)" />
            <text x="222" y="128" textAnchor="middle" fill="rgba(244,63,94,0.7)" fontSize="7" fontFamily="system-ui">Metadata</text>
          </motion.g>
        </motion.g>

        {/* Connecting lines from file to components */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          <line x1="115" y1="52" x2="85" y2="52" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="115" y1="82" x2="85" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="165" y1="52" x2="195" y2="52" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="165" y1="82" x2="195" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 2" />
        </motion.g>

        {/* "Complete backup" badge */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.3 }}
        >
          <rect x="110" y="108" width="60" height="14" rx="7" fill="rgba(16,185,129,0.15)" />
          <text x="140" y="118" textAnchor="middle" fill="rgba(16,185,129,0.8)" fontSize="7" fontFamily="system-ui">All-in-one</text>
        </motion.g>

        {/* Decorative sparkles */}
        <motion.g
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="145" cy="20" r="1.5" fill="rgba(16,185,129,0.5)" />
          <circle cx="100" cy="115" r="1" fill="rgba(16,185,129,0.4)" />
        </motion.g>
      </svg>
    </div>
  );
}

export default CreatingImportRiffIllustration;
