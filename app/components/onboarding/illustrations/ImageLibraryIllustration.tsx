'use client';

// ============================================
// ImageLibraryIllustration - Upload or Reuse
// Shows library grid and upload icon
// ============================================

import { motion } from 'framer-motion';

interface ImageLibraryIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function ImageLibraryIllustration({ className = '' }: ImageLibraryIllustrationProps) {
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
          <radialGradient id="libraryGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#libraryGlow)" />

        {/* Library panel */}
        <motion.rect
          x="25"
          y="15"
          width="160"
          height="110"
          rx="8"
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        />

        {/* Library header */}
        <motion.text
          x="35"
          y="32"
          fill="rgba(255,255,255,0.4)"
          fontSize="9"
          fontFamily="system-ui"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Library
        </motion.text>

        {/* Image grid */}
        <motion.g
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } }
          }}
        >
          {/* Row 1 */}
          <motion.rect x="35" y="42" width="40" height="30" rx="3" fill="rgba(59,130,246,0.2)" variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} />
          <motion.rect x="80" y="42" width="40" height="30" rx="3" fill="rgba(16,185,129,0.2)" variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} />
          <motion.rect x="125" y="42" width="40" height="30" rx="3" fill="rgba(245,158,11,0.2)" variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} />

          {/* Row 2 */}
          <motion.rect x="35" y="77" width="40" height="30" rx="3" fill="rgba(139,92,246,0.2)" variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} />
          <motion.rect x="80" y="77" width="40" height="30" rx="3" fill="rgba(244,63,94,0.2)" variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} />
          <motion.rect x="125" y="77" width="40" height="30" rx="3" fill="rgba(6,182,212,0.2)" variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} />
        </motion.g>

        {/* Selected indicator on one image */}
        <motion.rect
          x="78"
          y="40"
          width="44"
          height="34"
          rx="4"
          fill="none"
          stroke="rgba(59,130,246,0.8)"
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        />

        {/* Upload button - right side */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
        >
          <rect x="200" y="40" width="60" height="55" rx="6" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1" strokeDasharray="4 3" />

          {/* Upload icon */}
          <path
            d="M230 60 L230 75"
            stroke="rgba(59,130,246,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M223 67 L230 60 L237 67"
            stroke="rgba(59,130,246,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <text x="230" y="88" fill="rgba(59,130,246,0.6)" fontSize="8" fontFamily="system-ui" textAnchor="middle">Upload</text>
        </motion.g>

        {/* Or divider */}
        <motion.text
          x="230"
          y="115"
          fill="rgba(255,255,255,0.3)"
          fontSize="8"
          fontFamily="system-ui"
          textAnchor="middle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          or drag & drop
        </motion.text>
      </svg>
    </div>
  );
}

export default ImageLibraryIllustration;
