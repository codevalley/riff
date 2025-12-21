'use client';

// ============================================
// SlashCommandsIllustration - Command Palette Visual
// Shows / triggering a dropdown with command options
// ============================================

import { motion } from 'framer-motion';

interface SlashCommandsIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function SlashCommandsIllustration({ className = '' }: SlashCommandsIllustrationProps) {
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
          <radialGradient id="slashAmbientGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="dropdownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#slashAmbientGlow)" />

        {/* Editor background */}
        <motion.rect
          x="40"
          y="15"
          width="200"
          height="110"
          rx="8"
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Text lines before cursor */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <rect x="55" y="28" width="60" height="5" rx="1.5" fill="rgba(255,255,255,0.15)" />
          <rect x="55" y="40" width="80" height="4" rx="1" fill="rgba(255,255,255,0.10)" />
        </motion.g>

        {/* The "/" character - highlighted */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASE_OUT }}
        >
          <rect
            x="55"
            y="52"
            width="18"
            height="18"
            rx="4"
            fill="rgba(6,182,212,0.2)"
          />
          <text
            x="64"
            y="65"
            fill="rgba(6,182,212,1)"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            /
          </text>
          {/* Blinking cursor after / */}
          <motion.rect
            x="71"
            y="54"
            width="2"
            height="14"
            fill="rgba(6,182,212,0.8)"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.g>

        {/* Command dropdown */}
        <motion.g
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
        >
          {/* Dropdown container */}
          <rect
            x="55"
            y="74"
            width="130"
            height="46"
            rx="6"
            fill="url(#dropdownGradient)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />

          {/* Command options */}
          <motion.g
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } }
            }}
          >
            {/* /image - selected */}
            <motion.g
              variants={{
                hidden: { opacity: 0, x: -5 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <rect
                x="59"
                y="78"
                width="122"
                height="18"
                rx="4"
                fill="rgba(6,182,212,0.15)"
              />
              <circle cx="70" cy="87" r="4" fill="rgba(16,185,129,0.6)" />
              <text
                x="80"
                y="91"
                fill="rgba(255,255,255,0.9)"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
              >
                /image
              </text>
              <text
                x="120"
                y="91"
                fill="rgba(255,255,255,0.4)"
                fontSize="8"
                fontFamily="system-ui, sans-serif"
              >
                Generate image
              </text>
            </motion.g>

            {/* /pause */}
            <motion.g
              variants={{
                hidden: { opacity: 0, x: -5 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <circle cx="70" cy="105" r="4" fill="rgba(244,63,94,0.5)" />
              <text
                x="80"
                y="109"
                fill="rgba(255,255,255,0.6)"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
              >
                /pause
              </text>
              <text
                x="120"
                y="109"
                fill="rgba(255,255,255,0.3)"
                fontSize="8"
                fontFamily="system-ui, sans-serif"
              >
                Reveal step
              </text>
            </motion.g>
          </motion.g>
        </motion.g>

        {/* Hint arrow */}
        <motion.path
          d="M78 52 L78 74"
          stroke="rgba(6,182,212,0.3)"
          strokeWidth="1"
          strokeDasharray="3 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        />
      </svg>
    </div>
  );
}

export default SlashCommandsIllustration;
