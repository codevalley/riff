'use client';

// ============================================
// ImageGenIllustration - One-Click Generation
// Shows image placeholder with Generate button
// ============================================

import { motion } from 'framer-motion';

interface ImageGenIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function ImageGenIllustration({ className = '' }: ImageGenIllustrationProps) {
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
          <radialGradient id="imgGenGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#imgGenGlow)" />

        {/* Image placeholder with dashed border */}
        <motion.g
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <rect
            x="60"
            y="15"
            width="160"
            height="90"
            rx="8"
            fill="rgba(16,185,129,0.05)"
            stroke="rgba(16,185,129,0.3)"
            strokeWidth="2"
            strokeDasharray="8 4"
          />

          {/* Image icon */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {/* Mountain */}
            <path
              d="M115 75 L130 50 L145 65 L155 55 L170 75 Z"
              fill="rgba(16,185,129,0.3)"
            />
            {/* Sun */}
            <circle cx="160" cy="40" r="10" fill="rgba(245,158,11,0.4)" />
          </motion.g>

          {/* Description text placeholder */}
          <motion.rect
            x="100"
            y="82"
            width="80"
            height="5"
            rx="2"
            fill="rgba(255,255,255,0.2)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          />
        </motion.g>

        {/* Generate button - highlighted */}
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: EASE_OUT }}
        >
          <rect
            x="105"
            y="112"
            width="70"
            height="22"
            rx="6"
            fill="rgba(16,185,129,0.2)"
            stroke="rgba(16,185,129,0.5)"
            strokeWidth="1"
          />
          <text
            x="140"
            y="126"
            fill="rgba(16,185,129,1)"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            fontWeight="600"
            textAnchor="middle"
          >
            Generate
          </text>
        </motion.g>

        {/* Click indicator arrow */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <motion.path
            d="M185 120 L195 123 L192 113"
            stroke="rgba(245,158,11,0.8)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="195"
            cy="123"
            r="3"
            fill="rgba(245,158,11,0.6)"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>
      </svg>
    </div>
  );
}

export default ImageGenIllustration;
