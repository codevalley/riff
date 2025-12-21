'use client';

// ============================================
// CreditsTransparencyIllustration - Transparent Pricing
// Visual cost breakdown: dollar to images
// ============================================

import { motion } from 'framer-motion';

interface CreditsTransparencyIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function CreditsTransparencyIllustration({ className = '' }: CreditsTransparencyIllustrationProps) {
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
          <radialGradient id="transparencyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="dollarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.8)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.5)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#transparencyGlow)" />

        {/* Left: Dollar coin */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <circle cx="55" cy="70" r="30" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="2" />
          <circle cx="55" cy="70" r="22" fill="rgba(16,185,129,0.1)" />
          <text x="55" y="80" textAnchor="middle" fill="url(#dollarGradient)" fontSize="28" fontFamily="system-ui" fontWeight="bold">$1</text>
        </motion.g>

        {/* Center: Equals sign with arrow */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <path d="M95 65 L115 65 M95 75 L115 75" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
          <path d="M115 70 L130 70 M125 65 L132 70 L125 75" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>

        {/* Right: 4 image cards */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Image 1 */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <rect x="145" y="35" width="35" height="28" rx="4" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
            <rect x="150" y="40" width="16" height="12" rx="2" fill="rgba(16,185,129,0.25)" />
            <circle cx="155" cy="44" r="2" fill="rgba(16,185,129,0.5)" />
            <path d="M151 50 L156 46 L161 50 L166 44" stroke="rgba(16,185,129,0.4)" strokeWidth="1" fill="none" />
          </motion.g>

          {/* Image 2 */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <rect x="188" y="35" width="35" height="28" rx="4" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
            <rect x="193" y="40" width="16" height="12" rx="2" fill="rgba(139,92,246,0.25)" />
            <circle cx="198" cy="44" r="2" fill="rgba(139,92,246,0.5)" />
            <path d="M194 50 L199 46 L204 50 L209 44" stroke="rgba(139,92,246,0.4)" strokeWidth="1" fill="none" />
          </motion.g>

          {/* Image 3 */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <rect x="145" y="70" width="35" height="28" rx="4" fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.4)" strokeWidth="1" />
            <rect x="150" y="75" width="16" height="12" rx="2" fill="rgba(251,191,36,0.25)" />
            <circle cx="155" cy="79" r="2" fill="rgba(251,191,36,0.5)" />
            <path d="M151 85 L156 81 L161 85 L166 79" stroke="rgba(251,191,36,0.4)" strokeWidth="1" fill="none" />
          </motion.g>

          {/* Image 4 */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <rect x="188" y="70" width="35" height="28" rx="4" fill="rgba(244,63,94,0.15)" stroke="rgba(244,63,94,0.4)" strokeWidth="1" />
            <rect x="193" y="75" width="16" height="12" rx="2" fill="rgba(244,63,94,0.25)" />
            <circle cx="198" cy="79" r="2" fill="rgba(244,63,94,0.5)" />
            <path d="M194 85 L199 81 L204 85 L209 79" stroke="rgba(244,63,94,0.4)" strokeWidth="1" fill="none" />
          </motion.g>

          {/* "4 images" label */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.3 }}
          >
            <rect x="165" y="106" width="50" height="18" rx="9" fill="rgba(255,255,255,0.06)" />
            <text x="190" y="118" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="system-ui" fontWeight="500">4 images</text>
          </motion.g>
        </motion.g>

        {/* Bottom: Cost breakdown mini text */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          <rect x="30" y="108" width="80" height="22" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x="40" y="118" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="system-ui">Model: $0.10</text>
          <text x="40" y="126" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="system-ui">Infra: $0.02</text>
          <text x="78" y="118" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="system-ui">Buffer: $0.03</text>
          <text x="78" y="126" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="system-ui">Margin: $0.05</text>
        </motion.g>

        {/* Sparkle effects */}
        <motion.g
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <circle cx="230" cy="45" r="1.5" fill="rgba(16,185,129,0.6)" />
          <circle cx="140" cy="75" r="1" fill="rgba(251,191,36,0.5)" />
        </motion.g>
      </svg>
    </div>
  );
}

export default CreditsTransparencyIllustration;
