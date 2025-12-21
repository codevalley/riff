'use client';

// ============================================
// SnowfallEffect - Christmas Easter Egg
// Falling snowflakes animation triggered on demand
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake as SnowflakeIcon } from 'lucide-react';

/**
 * Individual snowflake component
 */
function Snowflake({ delay, duration, left, size }: { delay: number; duration: number; left: number; size: number }) {
  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 0 }}
      animate={{
        y: '100vh',
        x: [0, 15, -15, 10, -10, 0],
        opacity: [0, 1, 1, 1, 0.5, 0]
      }}
      transition={{
        duration,
        delay,
        ease: 'linear',
        x: { duration: duration * 0.8, ease: 'easeInOut', repeat: Infinity }
      }}
      className="fixed pointer-events-none z-[100]"
      style={{ left: `${left}%`, top: 0 }}
    >
      <span style={{ fontSize: size }} className="text-white/60">❄</span>
    </motion.div>
  );
}

interface SnowfallEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

/**
 * Snowfall effect - renders multiple animated snowflakes
 */
export function SnowfallEffect({ isActive, onComplete }: SnowfallEffectProps) {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; delay: number; duration: number; left: number; size: number }>>([]);

  useEffect(() => {
    if (isActive) {
      // Generate 30 snowflakes with random properties
      const flakes = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 3,
        left: Math.random() * 100,
        size: 10 + Math.random() * 14,
      }));
      setSnowflakes(flakes);

      // Clear after animation completes
      const timeout = setTimeout(() => {
        setSnowflakes([]);
        onComplete();
      }, 8000);

      return () => clearTimeout(timeout);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {snowflakes.map((flake) => (
        <Snowflake key={flake.id} {...flake} />
      ))}
    </AnimatePresence>
  );
}

interface SnowTriggerProps {
  className?: string;
}

/**
 * Snowflake trigger button with tooltip
 * Add this next to logos/headers for the Christmas easter egg
 * Features playful animations to catch attention
 */
export function SnowTrigger({ className = '' }: SnowTriggerProps) {
  const [isSnowing, setIsSnowing] = useState(false);

  const handleComplete = useCallback(() => {
    setIsSnowing(false);
  }, []);

  return (
    <>
      <SnowfallEffect isActive={isSnowing} onComplete={handleComplete} />
      <motion.button
        onClick={() => setIsSnowing(true)}
        disabled={isSnowing}
        className={`group relative disabled:opacity-20 ${className}`}
        title="Let it snow!"
        initial={{ opacity: 0.25 }}
        animate={{
          opacity: [0.25, 0.5, 0.25],
          y: [0, -1.5, 0, 1, 0],
          rotate: [0, -8, 0, 8, 0],
        }}
        whileHover={{
          opacity: 0.9,
          scale: 1.2,
          rotate: [0, -15, 15, -10, 10, 0],
          transition: { rotate: { duration: 0.5 } }
        }}
        whileTap={{ scale: 0.9 }}
        transition={{
          opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <SnowflakeIcon className="w-3.5 h-3.5 text-sky-200/80" />
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white/70 text-[10px] rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Let it snow!
        </span>
      </motion.button>
    </>
  );
}

export default SnowfallEffect;
