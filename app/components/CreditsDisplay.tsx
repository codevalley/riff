'use client';

// ============================================
// RIFF - Credits Display Component
// Elegant balance indicator for the editor toolbar
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingDown, Sparkles } from 'lucide-react';

interface CreditsDisplayProps {
  onPurchaseClick?: () => void;
  className?: string;
}

export function CreditsDisplay({ onPurchaseClick, className = '' }: CreditsDisplayProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [lastBalance, setLastBalance] = useState<number | null>(null);

  // Fetch balance on mount and periodically
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/credits');
        if (res.ok) {
          const data = await res.json();
          setBalance((prev) => {
            setLastBalance(prev);
            return data.balance;
          });
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []); // Empty deps - only run on mount

  // Determine visual state
  const isLow = balance !== null && balance < 5;
  const isEmpty = balance !== null && balance <= 0;
  const justDecreased = lastBalance !== null && balance !== null && balance < lastBalance;

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-white/5 animate-pulse" />
        <div className="w-8 h-3 rounded bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (balance === null) {
    return null;
  }

  return (
    <motion.button
      onClick={onPurchaseClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative flex items-center gap-2 px-3 py-1.5
        rounded-lg border transition-all duration-200
        ${isEmpty
          ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15'
          : isLow
            ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
            : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12]'
        }
        group cursor-pointer
        ${className}
      `}
      initial={false}
      animate={justDecreased ? { scale: [1, 0.95, 1] } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Coin icon with subtle animation */}
      <motion.div
        className={`
          relative w-5 h-5 rounded-full flex items-center justify-center
          ${isEmpty
            ? 'bg-red-500/20 text-red-400'
            : isLow
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-300'
          }
        `}
        animate={isHovered ? { rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Coins className="w-3 h-3" />

        {/* Subtle shine effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent"
          initial={{ opacity: 0, rotate: -45 }}
          animate={isHovered ? { opacity: [0, 0.5, 0], rotate: 45 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </motion.div>

      {/* Balance display */}
      <div className="flex items-center gap-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={balance}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`
              text-sm font-medium tabular-nums
              ${isEmpty
                ? 'text-red-400'
                : isLow
                  ? 'text-amber-400'
                  : 'text-white/80'
              }
            `}
          >
            {Math.round(balance)}
          </motion.span>
        </AnimatePresence>

        {/* Low balance indicator */}
        {isLow && !isEmpty && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center"
          >
            <TrendingDown className="w-3 h-3 text-amber-400" />
          </motion.div>
        )}
      </div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="
              absolute right-0 bottom-full mb-2
              px-3 py-2 bg-[#1a1a1a] rounded-lg
              shadow-xl shadow-black/50
              whitespace-nowrap z-50 pointer-events-none
            "
          >
            <div className="text-xs text-white/70">
              {isEmpty ? (
                <span className="text-red-400">No credits remaining</span>
              ) : isLow ? (
                <span className="text-amber-400">Low balance</span>
              ) : (
                <span>Add credits</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse ring for empty state */}
      {isEmpty && (
        <motion.div
          className="absolute inset-0 rounded-lg border border-red-500/50"
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

// Compact version for tight spaces
export function CreditsDisplayCompact({
  balance,
  onClick
}: {
  balance: number | null;
  onClick?: () => void;
}) {
  if (balance === null) return null;

  const isLow = balance < 5;
  const isEmpty = balance <= 0;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs
        transition-colors
        ${isEmpty
          ? 'text-red-400 hover:bg-red-500/10'
          : isLow
            ? 'text-amber-400 hover:bg-amber-500/10'
            : 'text-white/50 hover:text-white/70 hover:bg-white/5'
        }
      `}
    >
      <Sparkles className="w-3 h-3" />
      <span className="tabular-nums">{Math.round(balance)}</span>
    </button>
  );
}
