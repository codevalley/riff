'use client';

// ============================================
// PublishSocialIllustration - Share on Social
// Social media icons with share paths and preview card
// ============================================

import { motion } from 'framer-motion';

interface PublishSocialIllustrationProps {
  className?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1];

export function PublishSocialIllustration({ className = '' }: PublishSocialIllustrationProps) {
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
          <radialGradient id="socialGlow" cx="30%" cy="50%" r="40%">
            <stop offset="0%" stopColor="rgba(244,63,94,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="280" height="140" fill="url(#socialGlow)" />

        {/* Social preview card - left */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          {/* Card frame */}
          <rect x="20" y="25" width="110" height="90" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

          {/* Preview image area */}
          <rect x="25" y="30" width="100" height="50" rx="4" fill="rgba(244,63,94,0.1)" />

          {/* Slide preview content */}
          <rect x="35" y="42" width="50" height="5" rx="2" fill="rgba(244,63,94,0.4)" />
          <rect x="35" y="52" width="70" height="3" rx="1" fill="rgba(244,63,94,0.25)" />
          <rect x="35" y="58" width="60" height="3" rx="1" fill="rgba(244,63,94,0.25)" />
          <rect x="35" y="64" width="65" height="3" rx="1" fill="rgba(244,63,94,0.25)" />

          {/* Riff badge on preview */}
          <rect x="100" y="68" width="20" height="8" rx="2" fill="rgba(244,63,94,0.3)" />
          <text x="110" y="74" fill="rgba(244,63,94,0.9)" fontSize="5" fontFamily="system-ui" textAnchor="middle">riff</text>

          {/* Meta info */}
          <text x="30" y="92" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="system-ui" fontWeight="500">My Presentation</text>
          <text x="30" y="103" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="system-ui">riff.run</text>

          {/* Like/share indicators */}
          <motion.g
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <path d="M100 97 L103 94 L106 97 L103 100 Z" fill="rgba(244,63,94,0.6)" />
          </motion.g>
          <text x="112" y="100" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="system-ui">42</text>
        </motion.g>

        {/* Share arrow path */}
        <motion.path
          d="M135 70 C 155 70 160 50 180 50"
          stroke="rgba(244,63,94,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />

        {/* Social icons - right side */}
        {/* X (Twitter) */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3, ease: EASE_OUT }}
        >
          <circle cx="195" cy="35" r="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="195" y="40" fill="rgba(255,255,255,0.7)" fontSize="14" fontFamily="system-ui" textAnchor="middle" fontWeight="bold">𝕏</text>
        </motion.g>

        {/* LinkedIn */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.3, ease: EASE_OUT }}
        >
          <circle cx="240" cy="55" r="18" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
          <text x="240" y="60" fill="rgba(59,130,246,0.8)" fontSize="12" fontFamily="system-ui" textAnchor="middle" fontWeight="bold">in</text>
        </motion.g>

        {/* More platforms indicator */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.3, ease: EASE_OUT }}
        >
          <circle cx="210" cy="90" r="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <circle cx="204" cy="90" r="2" fill="rgba(255,255,255,0.4)" />
          <circle cx="210" cy="90" r="2" fill="rgba(255,255,255,0.4)" />
          <circle cx="216" cy="90" r="2" fill="rgba(255,255,255,0.4)" />
        </motion.g>

        {/* Flying share icons animation */}
        <motion.g
          animate={{ x: [0, 20, 0], y: [0, -5, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="165" cy="40" r="4" fill="rgba(244,63,94,0.4)" />
        </motion.g>
        <motion.g
          animate={{ x: [0, 15, 0], y: [0, 5, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <circle cx="170" cy="65" r="3" fill="rgba(59,130,246,0.4)" />
        </motion.g>

        {/* "Preview cards" badge */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          <rect x="170" y="115" width="90" height="18" rx="9" fill="rgba(16,185,129,0.15)" />
          <circle cx="182" cy="124" r="4" fill="rgba(16,185,129,0.4)" />
          <path d="M180 124 L181 125 L184 122" stroke="rgba(16,185,129,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x="220" y="128" fill="rgba(16,185,129,0.8)" fontSize="7" fontFamily="system-ui" textAnchor="middle">Auto preview cards</text>
        </motion.g>

        {/* Share count indicator */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.3 }}
        >
          <rect x="20" y="118" width="50" height="14" rx="7" fill="rgba(244,63,94,0.15)" />
          <path d="M30 122 L33 119 L36 122 L36 128 L30 128 Z" fill="none" stroke="rgba(244,63,94,0.6)" strokeWidth="1" />
          <text x="55" y="128" fill="rgba(244,63,94,0.7)" fontSize="7" fontFamily="system-ui" textAnchor="middle">Share</text>
        </motion.g>
      </svg>
    </div>
  );
}

export default PublishSocialIllustration;
