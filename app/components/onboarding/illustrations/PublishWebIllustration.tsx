'use client';

// ============================================
// PublishWebIllustration - Publish to the Web
// Globe with shareable link and analytics preview
// ============================================

import { motion } from 'framer-motion';

interface PublishWebIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function PublishWebIllustration({ className = '' }: PublishWebIllustrationProps) {
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
          <radialGradient id="webGlow" cx="35%" cy="50%" r="40%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.8)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.8)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#webGlow)" />

        {/* Globe */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <circle cx="70" cy="70" r="40" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" />
          {/* Globe lines */}
          <ellipse cx="70" cy="70" rx="40" ry="15" fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
          <ellipse cx="70" cy="70" rx="20" ry="40" fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
          <line x1="30" y1="70" x2="110" y2="70" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
          <line x1="70" y1="30" x2="70" y2="110" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
          {/* Highlight */}
          <circle cx="55" cy="55" r="8" fill="rgba(16,185,129,0.15)" />
        </motion.g>

        {/* Link chain connecting to URL */}
        <motion.path
          d="M110 70 C 130 70 130 50 150 50"
          stroke="url(#linkGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />

        {/* URL bar */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
        >
          <rect x="150" y="35" width="110" height="30" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Lock icon */}
          <rect x="158" y="46" width="6" height="5" rx="1" fill="none" stroke="rgba(16,185,129,0.7)" strokeWidth="1" />
          <path d="M159 46 L159 44 C159 42.5 160 41.5 161 41.5 C162 41.5 163 42.5 163 44 L163 46" fill="none" stroke="rgba(16,185,129,0.7)" strokeWidth="1" />
          {/* URL text */}
          <text x="170" y="53" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="monospace">riff.run/s/abc123</text>
        </motion.g>

        {/* Copy button */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <rect x="232" y="41" width="22" height="18" rx="3" fill="rgba(16,185,129,0.2)" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
          <rect x="237" y="45" width="7" height="9" rx="1" fill="none" stroke="rgba(16,185,129,0.8)" strokeWidth="1" />
          <rect x="240" y="48" width="7" height="9" rx="1" fill="rgba(16,185,129,0.3)" stroke="rgba(16,185,129,0.8)" strokeWidth="1" />
        </motion.g>

        {/* Analytics preview */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4, ease: EASE_OUT }}
        >
          <rect x="150" y="75" width="110" height="45" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Views count */}
          <text x="160" y="90" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="system-ui">Views</text>
          <text x="160" y="103" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="system-ui" fontWeight="600">247</text>

          {/* Mini chart */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
          >
            <rect x="200" y="108" width="8" height="6" rx="1" fill="rgba(16,185,129,0.3)" />
            <rect x="212" y="104" width="8" height="10" rx="1" fill="rgba(16,185,129,0.4)" />
            <rect x="224" y="100" width="8" height="14" rx="1" fill="rgba(16,185,129,0.5)" />
            <rect x="236" y="96" width="8" height="18" rx="1" fill="rgba(16,185,129,0.7)" />
          </motion.g>

          {/* Trend arrow */}
          <motion.path
            d="M248 88 L252 84 L256 88 M252 84 L252 95"
            stroke="rgba(16,185,129,0.8)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* "No login required" badge */}
        <motion.g
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.3 }}
        >
          <rect x="30" y="118" width="80" height="16" rx="8" fill="rgba(16,185,129,0.15)" />
          <circle cx="42" cy="126" r="4" fill="rgba(16,185,129,0.4)" />
          <path d="M40 126 L41.5 127.5 L44 125" stroke="rgba(16,185,129,0.9)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x="75" y="130" fill="rgba(16,185,129,0.8)" fontSize="7" fontFamily="system-ui" textAnchor="middle">No login needed</text>
        </motion.g>
      </svg>
    </div>
  );
}

export default PublishWebIllustration;
