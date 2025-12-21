'use client';

// ============================================
// ImageStylesIllustration - Visual Consistency
// Shows style presets and scene context
// ============================================

import { motion } from 'framer-motion';

interface ImageStylesIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function ImageStylesIllustration({ className = '' }: ImageStylesIllustrationProps) {
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
          <radialGradient id="imgStyleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#imgStyleGlow)" />

        {/* Three image thumbnails in a row - same style */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Image 1 */}
          <rect x="30" y="25" width="60" height="45" rx="4" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
          <path d="M45 55 L55 42 L65 50 L75 40 L80 55 Z" fill="rgba(139,92,246,0.4)" />
          <circle cx="72" cy="35" r="5" fill="rgba(245,158,11,0.4)" />

          {/* Image 2 */}
          <rect x="110" y="25" width="60" height="45" rx="4" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
          <path d="M125 55 L135 42 L145 50 L155 40 L160 55 Z" fill="rgba(139,92,246,0.4)" />
          <circle cx="152" cy="35" r="5" fill="rgba(245,158,11,0.4)" />

          {/* Image 3 */}
          <rect x="190" y="25" width="60" height="45" rx="4" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
          <path d="M205 55 L215 42 L225 50 L235 40 L240 55 Z" fill="rgba(139,92,246,0.4)" />
          <circle cx="232" cy="35" r="5" fill="rgba(245,158,11,0.4)" />
        </motion.g>

        {/* Connecting line showing consistency */}
        <motion.path
          d="M60 75 L140 75 L220 75"
          stroke="rgba(139,92,246,0.4)"
          strokeWidth="2"
          strokeDasharray="4 3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        />

        {/* Style preset chips */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {/* Style chip 1 - selected */}
          <rect x="55" y="85" width="50" height="18" rx="9" fill="rgba(139,92,246,0.3)" stroke="rgba(139,92,246,0.6)" strokeWidth="1" />
          <text x="80" y="97" fill="rgba(255,255,255,0.9)" fontSize="8" fontFamily="system-ui" textAnchor="middle">Cinematic</text>

          {/* Style chip 2 */}
          <rect x="115" y="85" width="50" height="18" rx="9" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="140" y="97" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="system-ui" textAnchor="middle">Minimal</text>

          {/* Style chip 3 */}
          <rect x="175" y="85" width="50" height="18" rx="9" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="200" y="97" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="system-ui" textAnchor="middle">Illustration</text>
        </motion.g>

        {/* Scene context input */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <rect x="55" y="112" width="170" height="20" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <text x="65" y="125" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="system-ui">Scene: Mountain landscape at sunset...</text>
        </motion.g>
      </svg>
    </div>
  );
}

export default ImageStylesIllustration;
