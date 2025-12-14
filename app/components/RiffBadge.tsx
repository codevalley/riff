'use client';

// ============================================
// RIFF - "Made with Riff" Badge
// Refined floating branding for shared presentations
// ============================================

import { motion } from 'framer-motion';

interface RiffBadgeProps {
  className?: string;
}

export function RiffBadge({ className = '' }: RiffBadgeProps) {
  return (
    <motion.a
      href="https://www.riff.im"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`
        fixed bottom-5 right-10 z-50
        group
        ${className}
      `}
    >
      {/* Outer glow on hover */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
          filter: 'blur(12px)',
          transform: 'scale(1.5)',
        }}
      />

      {/* Main badge container */}
      <div
        className="
          relative flex items-center gap-2.5
          pl-3 pr-4 py-2
          rounded-full
          transition-all duration-300 ease-out
          group-hover:scale-[1.02]
        "
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `
            0 0 0 1px rgba(255, 255, 255, 0.06),
            0 4px 24px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.04)
          `,
        }}
      >
        {/* Animated border gradient */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, transparent 50%, rgba(245, 158, 11, 0.1) 100%)',
            padding: '1px',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMaskComposite: 'xor',
          }}
        />

        {/* Riff icon - stacked pages */}
        <div className="relative">
          <svg
            width="18"
            height="18"
            viewBox="0 0 512 512"
            fill="none"
            className="transition-all duration-300"
          >
            {/* Back page */}
            <path
              d="M451.755 105.052L415.896 377.78C413.449 396.325 396.381 409.253 377.968 406.806L358.815 404.244L323.072 132.731C320.018 109.916 300.503 92.717 277.455 92.717C275.5 92.717 273.43 92.8328 271.476 93.0789L196.951 102.836L200.975 71.9718C203.422 53.4271 220.374 40.3837 238.903 42.8156L422.597 67.0932C441.141 69.5542 454.199 86.5066 451.753 105.051L451.755 105.052Z"
              className="fill-white/20 group-hover:fill-amber-500/35 transition-colors duration-300"
              style={{ transitionDelay: '0ms' }}
            />
            {/* Front page */}
            <path
              d="M346.87 407.08L310.982 134.352C308.55 115.836 291.554 102.793 273.039 105.225L89.3715 129.386C70.8557 131.819 57.8122 148.814 60.2441 167.329L96.132 440.057C98.5641 458.573 115.56 471.616 134.075 469.184L317.743 445.023C336.258 442.591 349.302 425.595 346.87 407.08Z"
              className="fill-white/40 group-hover:fill-amber-500/60 transition-colors duration-300"
              style={{ transitionDelay: '50ms' }}
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[11px] tracking-wide text-white/40 group-hover:text-white/50 transition-colors duration-300"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            made with
          </span>
          <span
            className="text-[15px] text-white/80 group-hover:text-white transition-colors duration-300 tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
              fontWeight: 500,
            }}
          >
            Riff
          </span>
        </div>

        {/* Subtle arrow indicator on hover */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="ml-0.5 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300"
        >
          <path
            d="M1 9L9 1M9 1H3M9 1V7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          />
        </svg>
      </div>
    </motion.a>
  );
}
