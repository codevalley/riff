'use client';

// ============================================
// MarkdownIllustration - Markdown Syntax Visual
// Shows --- separator, # headings, bullet points
// ============================================

import { motion } from 'framer-motion';

interface MarkdownIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function MarkdownIllustration({ className = '' }: MarkdownIllustrationProps) {
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
          <radialGradient id="mdAmbientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#mdAmbientGlow)" />

        {/* Slide 1 */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT }}
        >
          <rect
            x="30"
            y="20"
            width="90"
            height="100"
            rx="6"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* # Title */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <text
              x="40"
              y="42"
              fill="rgba(6,182,212,0.8)"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="500"
            >
              #
            </text>
            <rect
              x="50"
              y="34"
              width="55"
              height="8"
              rx="2"
              fill="rgba(255,255,255,0.25)"
            />
          </motion.g>

          {/* Bullet points */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <text
              x="40"
              y="62"
              fill="rgba(255,255,255,0.4)"
              fontSize="10"
              fontFamily="monospace"
            >
              -
            </text>
            <rect x="50" y="55" width="45" height="5" rx="1.5" fill="rgba(255,255,255,0.15)" />

            <text
              x="40"
              y="78"
              fill="rgba(255,255,255,0.4)"
              fontSize="10"
              fontFamily="monospace"
            >
              -
            </text>
            <rect x="50" y="71" width="38" height="5" rx="1.5" fill="rgba(255,255,255,0.12)" />

            <text
              x="40"
              y="94"
              fill="rgba(255,255,255,0.4)"
              fontSize="10"
              fontFamily="monospace"
            >
              -
            </text>
            <rect x="50" y="87" width="50" height="5" rx="1.5" fill="rgba(255,255,255,0.10)" />
          </motion.g>
        </motion.g>

        {/* --- Separator */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT }}
        >
          <rect
            x="130"
            y="62"
            width="20"
            height="16"
            rx="4"
            fill="rgba(245,158,11,0.15)"
          />
          <text
            x="140"
            y="74"
            fill="rgba(245,158,11,0.9)"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            ---
          </text>
        </motion.g>

        {/* Slide 2 */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: EASE_OUT }}
        >
          <rect
            x="160"
            y="20"
            width="90"
            height="100"
            rx="6"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* ## Subtitle */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <text
              x="170"
              y="42"
              fill="rgba(6,182,212,0.7)"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="500"
            >
              ##
            </text>
            <rect
              x="188"
              y="34"
              width="48"
              height="7"
              rx="2"
              fill="rgba(255,255,255,0.20)"
            />
          </motion.g>

          {/* Body text lines */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <rect x="170" y="52" width="65" height="4" rx="1" fill="rgba(255,255,255,0.12)" />
            <rect x="170" y="62" width="55" height="4" rx="1" fill="rgba(255,255,255,0.10)" />
            <rect x="170" y="72" width="60" height="4" rx="1" fill="rgba(255,255,255,0.08)" />
          </motion.g>

          {/* **pause** */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <rect
              x="170"
              y="86"
              width="50"
              height="14"
              rx="3"
              fill="rgba(244,63,94,0.12)"
            />
            <text
              x="195"
              y="96"
              fill="rgba(244,63,94,0.8)"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
            >
              **pause**
            </text>
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
}

export default MarkdownIllustration;
