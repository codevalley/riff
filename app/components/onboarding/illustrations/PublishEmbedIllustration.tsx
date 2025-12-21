'use client';

// ============================================
// PublishEmbedIllustration - Embed Anywhere
// Browser window with embedded slide, platform logos
// ============================================

import { motion } from 'framer-motion';

interface PublishEmbedIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function PublishEmbedIllustration({ className = '' }: PublishEmbedIllustrationProps) {
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
          <radialGradient id="embedGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#embedGlow)" />

        {/* Browser window */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Window frame */}
          <rect x="45" y="15" width="190" height="95" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

          {/* Browser chrome */}
          <rect x="45" y="15" width="190" height="18" rx="6" fill="rgba(255,255,255,0.05)" />
          <rect x="45" y="27" width="190" height="6" fill="rgba(255,255,255,0.05)" />

          {/* Traffic lights */}
          <circle cx="56" cy="24" r="3" fill="rgba(244,63,94,0.5)" />
          <circle cx="66" cy="24" r="3" fill="rgba(245,158,11,0.5)" />
          <circle cx="76" cy="24" r="3" fill="rgba(16,185,129,0.5)" />

          {/* URL bar */}
          <rect x="90" y="19" width="100" height="10" rx="3" fill="rgba(255,255,255,0.05)" />
          <text x="100" y="26" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">notion.so/my-page</text>

          {/* Page content - text blocks */}
          <rect x="55" y="40" width="60" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
          <rect x="55" y="48" width="80" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
          <rect x="55" y="54" width="70" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
        </motion.g>

        {/* Embedded Riff presentation */}
        <motion.g
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASE_OUT }}
        >
          <rect x="55" y="62" width="170" height="42" rx="4" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />

          {/* Slide content */}
          <rect x="65" y="70" width="45" height="4" rx="2" fill="rgba(139,92,246,0.5)" />
          <rect x="65" y="78" width="90" height="2" rx="1" fill="rgba(139,92,246,0.25)" />
          <rect x="65" y="84" width="80" height="2" rx="1" fill="rgba(139,92,246,0.25)" />
          <rect x="65" y="90" width="85" height="2" rx="1" fill="rgba(139,92,246,0.25)" />

          {/* Play indicator */}
          <motion.circle
            cx="200"
            cy="83"
            r="10"
            fill="rgba(139,92,246,0.2)"
            stroke="rgba(139,92,246,0.6)"
            strokeWidth="1"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <path d="M197 79 L205 83 L197 87 Z" fill="rgba(139,92,246,0.8)" />
        </motion.g>

        {/* Code snippet */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
        >
          <rect x="20" y="115" width="100" height="20" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
          <text x="28" y="128" fill="rgba(139,92,246,0.7)" fontSize="7" fontFamily="monospace">&lt;iframe src="..."&gt;</text>
        </motion.g>

        {/* Platform logos - right side */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.4, ease: EASE_OUT }}
        >
          {/* Notion */}
          <rect x="140" y="115" width="36" height="20" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="148" y="121" width="8" height="8" rx="1" fill="rgba(255,255,255,0.4)" />
          <text x="175" y="128" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="system-ui" textAnchor="end">Notion</text>

          {/* Medium */}
          <rect x="182" y="115" width="36" height="20" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <text x="190" y="128" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="serif" fontWeight="bold">M</text>
          <text x="217" y="128" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="system-ui" textAnchor="end">Medium</text>

          {/* Any site */}
          <rect x="224" y="115" width="36" height="20" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <circle cx="235" cy="125" r="5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <text x="259" y="128" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="system-ui" textAnchor="end">Blog</text>
        </motion.g>

        {/* Responsive sizing indicator */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          <rect x="242" y="22" width="6" height="10" rx="1" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <rect x="250" y="20" width="8" height="12" rx="1" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <rect x="260" y="18" width="10" height="14" rx="1" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        </motion.g>
      </svg>
    </div>
  );
}

export default PublishEmbedIllustration;
