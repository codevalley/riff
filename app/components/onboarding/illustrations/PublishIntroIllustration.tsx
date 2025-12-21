'use client';

// ============================================
// PublishIntroIllustration - Share Your Creation
// Central presentation with radiating paths to destinations
// ============================================

import { motion } from 'framer-motion';

interface PublishIntroIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function PublishIntroIllustration({ className = '' }: PublishIntroIllustrationProps) {
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
          <radialGradient id="publishIntroGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="pathGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.6)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.1)" />
          </linearGradient>
          <linearGradient id="pathGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.6)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.1)" />
          </linearGradient>
          <linearGradient id="pathGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.6)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.1)" />
          </linearGradient>
          <linearGradient id="pathGradient4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(244,63,94,0.6)" />
            <stop offset="100%" stopColor="rgba(244,63,94,0.1)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#publishIntroGlow)" />

        {/* Central presentation card */}
        <motion.g
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <rect x="110" y="45" width="60" height="50" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          {/* Slide content lines */}
          <rect x="118" y="55" width="30" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
          <rect x="118" y="63" width="44" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
          <rect x="118" y="69" width="38" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
          <rect x="118" y="75" width="42" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
          {/* Riff logo indicator */}
          <circle cx="160" cy="86" r="4" fill="rgba(59,130,246,0.4)" />
        </motion.g>

        {/* Radiating paths to destinations */}
        {/* Path 1: Top-left - Download */}
        <motion.path
          d="M110 55 Q 80 40 50 30"
          stroke="url(#pathGradient1)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        />
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <circle cx="45" cy="25" r="14" fill="rgba(59,130,246,0.15)" />
          <path d="M45 20 L45 28 M41 25 L45 29 L49 25" stroke="rgba(59,130,246,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>

        {/* Path 2: Top-right - Publish */}
        <motion.path
          d="M170 55 Q 200 40 230 30"
          stroke="url(#pathGradient2)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        />
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          <circle cx="235" cy="25" r="14" fill="rgba(16,185,129,0.15)" />
          <circle cx="235" cy="25" r="6" fill="none" stroke="rgba(16,185,129,0.8)" strokeWidth="1.5" />
          <path d="M235 21 L235 17 M239 25 L243 25" stroke="rgba(16,185,129,0.8)" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>

        {/* Path 3: Bottom-left - Embed */}
        <motion.path
          d="M110 85 Q 80 100 50 110"
          stroke="url(#pathGradient3)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        />
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.3 }}
        >
          <circle cx="45" cy="115" r="14" fill="rgba(139,92,246,0.15)" />
          <path d="M40 112 L37 115 L40 118 M50 112 L53 115 L50 118" stroke="rgba(139,92,246,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>

        {/* Path 4: Bottom-right - Social */}
        <motion.path
          d="M170 85 Q 200 100 230 110"
          stroke="url(#pathGradient4)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        />
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.3 }}
        >
          <circle cx="235" cy="115" r="14" fill="rgba(244,63,94,0.15)" />
          {/* Share/social icon */}
          <circle cx="232" cy="112" r="2" fill="rgba(244,63,94,0.8)" />
          <circle cx="240" cy="115" r="2" fill="rgba(244,63,94,0.8)" />
          <circle cx="232" cy="118" r="2" fill="rgba(244,63,94,0.8)" />
          <path d="M233 113 L238 114.5 M233 117 L238 115.5" stroke="rgba(244,63,94,0.6)" strokeWidth="1" />
        </motion.g>

        {/* Pulsing effect on center */}
        <motion.circle
          cx="140"
          cy="70"
          r="35"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}

export default PublishIntroIllustration;
