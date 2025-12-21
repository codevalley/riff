'use client';

// ============================================
// WelcomeIllustration - Split View Concept
// Elegant SVG showing editor + preview split
// ============================================

import { motion } from 'framer-motion';

interface WelcomeIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function WelcomeIllustration({ className = '' }: WelcomeIllustrationProps) {
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
          <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="editorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <linearGradient id="previewGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
        </defs>

        {/* Background ambient */}
        <rect x="0" y="0" width="280" height="140" fill="url(#ambientGlow)" />

        {/* Left Panel - Editor */}
        <motion.g
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Editor container */}
          <rect
            x="20"
            y="20"
            width="110"
            height="100"
            rx="8"
            fill="url(#editorGradient)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Code lines - animated stagger */}
          <motion.g
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } }
            }}
          >
            {/* Line 1 - Title */}
            <motion.rect
              x="32"
              y="36"
              width="40"
              height="6"
              rx="2"
              fill="rgba(245,158,11,0.7)"
              variants={{
                hidden: { opacity: 0, scaleX: 0.5 },
                visible: { opacity: 1, scaleX: 1 }
              }}
              style={{ transformOrigin: 'left center' }}
            />

            {/* Line 2 */}
            <motion.rect
              x="32"
              y="48"
              width="70"
              height="4"
              rx="1.5"
              fill="rgba(255,255,255,0.2)"
              variants={{
                hidden: { opacity: 0, scaleX: 0.5 },
                visible: { opacity: 1, scaleX: 1 }
              }}
              style={{ transformOrigin: 'left center' }}
            />

            {/* Line 3 */}
            <motion.rect
              x="32"
              y="58"
              width="55"
              height="4"
              rx="1.5"
              fill="rgba(255,255,255,0.15)"
              variants={{
                hidden: { opacity: 0, scaleX: 0.5 },
                visible: { opacity: 1, scaleX: 1 }
              }}
              style={{ transformOrigin: 'left center' }}
            />

            {/* Separator line (---) */}
            <motion.rect
              x="32"
              y="72"
              width="24"
              height="3"
              rx="1"
              fill="rgba(245,158,11,0.5)"
              variants={{
                hidden: { opacity: 0, scaleX: 0.5 },
                visible: { opacity: 1, scaleX: 1 }
              }}
              style={{ transformOrigin: 'left center' }}
            />

            {/* Line 4 */}
            <motion.rect
              x="32"
              y="84"
              width="60"
              height="4"
              rx="1.5"
              fill="rgba(255,255,255,0.2)"
              variants={{
                hidden: { opacity: 0, scaleX: 0.5 },
                visible: { opacity: 1, scaleX: 1 }
              }}
              style={{ transformOrigin: 'left center' }}
            />

            {/* Line 5 */}
            <motion.rect
              x="32"
              y="94"
              width="45"
              height="4"
              rx="1.5"
              fill="rgba(255,255,255,0.12)"
              variants={{
                hidden: { opacity: 0, scaleX: 0.5 },
                visible: { opacity: 1, scaleX: 1 }
              }}
              style={{ transformOrigin: 'left center' }}
            />
          </motion.g>

          {/* Cursor blink */}
          <motion.rect
            x="32"
            y="104"
            width="1.5"
            height="10"
            fill="rgba(245,158,11,0.8)"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.g>

        {/* Right Panel - Slide Preview */}
        <motion.g
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: EASE_OUT }}
        >
          {/* Preview container - looks like a slide */}
          <rect
            x="150"
            y="20"
            width="110"
            height="100"
            rx="8"
            fill="url(#previewGradient)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />

          {/* Inner slide frame */}
          <rect
            x="158"
            y="32"
            width="94"
            height="53"
            rx="4"
            fill="rgba(0,0,0,0.3)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {/* Slide content - presentation style */}
          <motion.g
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
          >
            {/* Big centered title */}
            <rect
              x="175"
              y="46"
              width="60"
              height="8"
              rx="2"
              fill="rgba(255,255,255,0.35)"
            />

            {/* Subtitle centered */}
            <rect
              x="183"
              y="60"
              width="44"
              height="5"
              rx="1.5"
              fill="rgba(255,255,255,0.15)"
            />

            {/* Decorative accent line */}
            <rect
              x="195"
              y="70"
              width="20"
              height="2"
              rx="1"
              fill="rgba(245,158,11,0.5)"
            />
          </motion.g>

          {/* Slide navigation dots */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <circle cx="196" cy="108" r="3" fill="rgba(255,255,255,0.4)" />
            <circle cx="205" cy="108" r="2.5" fill="rgba(255,255,255,0.15)" />
            <circle cx="214" cy="108" r="2.5" fill="rgba(255,255,255,0.15)" />
          </motion.g>

          {/* Live sync indicator */}
          <motion.circle
            cx="248"
            cy="32"
            r="4"
            fill="rgba(16,185,129,0.6)"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.g>

        {/* Center arrow - sync indicator */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {/* Arrow body */}
          <motion.path
            d="M135 70 L145 70"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          />
          {/* Arrow head */}
          <motion.path
            d="M142 66 L146 70 L142 74"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.2 }}
          />
        </motion.g>
      </svg>

      {/* Labels */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4, ease: EASE_OUT }}
        className="absolute -bottom-2 left-0 right-0 flex justify-between px-8"
      >
        <span className="text-[10px] tracking-wide text-white/30 uppercase">Write</span>
        <span className="text-[10px] tracking-wide text-white/30 uppercase">Preview</span>
      </motion.div>
    </div>
  );
}

export default WelcomeIllustration;
