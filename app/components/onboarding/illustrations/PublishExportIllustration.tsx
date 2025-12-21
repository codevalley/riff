'use client';

// ============================================
// PublishExportIllustration - Export & Download
// Three file format icons: .riff, PDF, PowerPoint
// ============================================

import { motion } from 'framer-motion';

interface PublishExportIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function PublishExportIllustration({ className = '' }: PublishExportIllustrationProps) {
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
          <radialGradient id="exportGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#exportGlow)" />

        {/* File 1: .riff - Left */}
        <motion.g
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* File shape */}
          <path
            d="M35 25 L35 95 L85 95 L85 40 L70 25 Z"
            fill="rgba(59,130,246,0.1)"
            stroke="rgba(59,130,246,0.4)"
            strokeWidth="1.5"
          />
          {/* Folded corner */}
          <path
            d="M70 25 L70 40 L85 40"
            fill="rgba(59,130,246,0.2)"
            stroke="rgba(59,130,246,0.4)"
            strokeWidth="1.5"
          />
          {/* JSON brackets icon */}
          <text x="60" y="68" fill="rgba(59,130,246,0.8)" fontSize="16" fontFamily="monospace" textAnchor="middle">{ }</text>
          {/* Label */}
          <rect x="40" y="75" width="40" height="14" rx="3" fill="rgba(59,130,246,0.2)" />
          <text x="60" y="85" fill="rgba(59,130,246,0.9)" fontSize="8" fontFamily="system-ui" textAnchor="middle" fontWeight="600">.riff</text>
          {/* Description */}
          <text x="60" y="108" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui" textAnchor="middle">Full backup</text>
        </motion.g>

        {/* File 2: PDF - Center */}
        <motion.g
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: EASE_OUT }}
        >
          {/* File shape */}
          <path
            d="M115 25 L115 95 L165 95 L165 40 L150 25 Z"
            fill="rgba(244,63,94,0.1)"
            stroke="rgba(244,63,94,0.4)"
            strokeWidth="1.5"
          />
          {/* Folded corner */}
          <path
            d="M150 25 L150 40 L165 40"
            fill="rgba(244,63,94,0.2)"
            stroke="rgba(244,63,94,0.4)"
            strokeWidth="1.5"
          />
          {/* Document lines icon */}
          <rect x="125" y="52" width="30" height="2" rx="1" fill="rgba(244,63,94,0.5)" />
          <rect x="125" y="58" width="25" height="2" rx="1" fill="rgba(244,63,94,0.4)" />
          <rect x="125" y="64" width="28" height="2" rx="1" fill="rgba(244,63,94,0.4)" />
          {/* Label */}
          <rect x="120" y="75" width="40" height="14" rx="3" fill="rgba(244,63,94,0.2)" />
          <text x="140" y="85" fill="rgba(244,63,94,0.9)" fontSize="8" fontFamily="system-ui" textAnchor="middle" fontWeight="600">PDF</text>
          {/* Description */}
          <text x="140" y="108" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui" textAnchor="middle">Universal</text>
        </motion.g>

        {/* File 3: PowerPoint - Right */}
        <motion.g
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
        >
          {/* File shape */}
          <path
            d="M195 25 L195 95 L245 95 L245 40 L230 25 Z"
            fill="rgba(245,158,11,0.1)"
            stroke="rgba(245,158,11,0.4)"
            strokeWidth="1.5"
          />
          {/* Folded corner */}
          <path
            d="M230 25 L230 40 L245 40"
            fill="rgba(245,158,11,0.2)"
            stroke="rgba(245,158,11,0.4)"
            strokeWidth="1.5"
          />
          {/* Presentation slides icon */}
          <rect x="205" y="50" width="18" height="12" rx="1" fill="rgba(245,158,11,0.3)" stroke="rgba(245,158,11,0.5)" strokeWidth="1" />
          <rect x="210" y="55" width="18" height="12" rx="1" fill="rgba(245,158,11,0.4)" stroke="rgba(245,158,11,0.6)" strokeWidth="1" />
          {/* Label */}
          <rect x="200" y="75" width="40" height="14" rx="3" fill="rgba(245,158,11,0.2)" />
          <text x="220" y="85" fill="rgba(245,158,11,0.9)" fontSize="8" fontFamily="system-ui" textAnchor="middle" fontWeight="600">PPTX</text>
          {/* Beta badge */}
          <rect x="230" y="72" width="18" height="10" rx="2" fill="rgba(245,158,11,0.3)" />
          <text x="239" y="79" fill="rgba(245,158,11,1)" fontSize="6" fontFamily="system-ui" textAnchor="middle">Beta</text>
          {/* Description */}
          <text x="220" y="108" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui" textAnchor="middle">Editable</text>
        </motion.g>

        {/* Download arrow animation */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <motion.path
            d="M140 15 L140 8"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M136 12 L140 16 L144 12"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Connecting base line */}
        <motion.path
          d="M60 120 L220 120"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        />
      </svg>
    </div>
  );
}

export default PublishExportIllustration;
