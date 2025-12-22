'use client';

// ============================================
// RIFF - Purchase Credits Modal
// Trust-first, editorial design
// Meaningful value representation
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { X, Coffee, Twitter, Heart, Shield, Infinity as InfinityIcon, ArrowRight } from 'lucide-react';
import {
  CREDITS_PER_DOLLAR,
  MIN_PURCHASE_DOLLARS,
  CREDIT_COSTS,
  dollarsToCredits,
} from '@/lib/credits-config';

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

// Tier icons as simple SVG components for distinctive look
const TierIcons = {
  starter: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.6" />
    </svg>
  ),
  couple: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="8" cy="12" r="3" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="12" r="3" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  several: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="3" y="6" width="7" height="5" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="3" y="13" width="7" height="5" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="14" y="6" width="7" height="12" rx="1" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  project: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="2" y="4" width="6" height="8" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="9" y="4" width="6" height="8" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="16" y="4" width="6" height="8" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="5" y="14" width="14" height="6" rx="1" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  powerUser: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  excessive: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </svg>
  ),
};

// Value tiers - what your money actually gets you
function getValueTier(dollars: number) {
  const credits = dollarsToCredits(dollars);
  const images = Math.floor(credits / CREDIT_COSTS.IMAGE_GENERATION);
  const themes = Math.floor(credits / CREDIT_COSTS.THEME_GENERATION);
  const estimatedDecks = Math.floor(images / 4);

  if (dollars >= 50) {
    return {
      tier: 'excessive' as const,
      headline: 'Whoa, big spender!',
      description: `That's ${estimatedDecks}+ presentations worth. You sure about this?`,
      color: 'amber',
      Icon: TierIcons.excessive,
    };
  }
  if (dollars >= 20) {
    return {
      tier: 'powerUser' as const,
      headline: 'Power user mode',
      description: `${estimatedDecks} full presentations? Raised series A already?`,
      color: 'emerald',
      Icon: TierIcons.powerUser,
    };
  }
  if (dollars >= 10) {
    return {
      tier: 'project' as const,
      headline: 'A whole project',
      description: `Create ${estimatedDecks} decks with ${images} images. Serious sales pitch?`,
      color: 'sky',
      Icon: TierIcons.project,
    };
  }
  if (dollars >= 5) {
    return {
      tier: 'several' as const,
      headline: 'Several presentations',
      description: `Build ${estimatedDecks} polished decks with ${images} images. Experimenting?`,
      color: 'violet',
      Icon: TierIcons.several,
    };
  }
  if (dollars >= 2) {
    return {
      tier: 'couple' as const,
      headline: 'A couple of decks',
      description: `One deck or a few. ${images} images — about ${estimatedDecks || 1} presentation${estimatedDecks > 1 ? 's' : ''}.`,
      color: 'rose',
      Icon: TierIcons.couple,
    };
  }
  return {
    tier: 'starter' as const,
    headline: 'A quick top-up',
    description: `Polish your deck. ${images} image${images > 1 ? 's' : ''} or ${themes} theme${themes > 1 ? 's' : ''}. Deadline tomorrow?`,
    color: 'zinc',
    Icon: TierIcons.starter,
  };
}

const tierColors = {
  starter: { bg: 'bg-white/[0.04]', text: 'text-white/70', icon: 'text-white/40' },
  couple: { bg: 'bg-rose-500/[0.08]', text: 'text-rose-200', icon: 'text-rose-400' },
  several: { bg: 'bg-violet-500/[0.08]', text: 'text-violet-200', icon: 'text-violet-400' },
  project: { bg: 'bg-sky-500/[0.08]', text: 'text-sky-200', icon: 'text-sky-400' },
  powerUser: { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-200', icon: 'text-emerald-400' },
  excessive: { bg: 'bg-amber-500/[0.08]', text: 'text-amber-200', icon: 'text-amber-400' },
};

// Threshold for showing "you have enough" pre-screen
const PLENTY_THRESHOLD = 50;

export function PurchaseCreditsModal({ isOpen, onClose, currentBalance: propBalance }: PurchaseCreditsModalProps) {
  const [dollarAmount, setDollarAmount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedBalance, setFetchedBalance] = useState<number | null>(null);
  const [bypassed, setBypassed] = useState(false);

  const currentBalance = propBalance ?? fetchedBalance ?? 0;
  const hasPlenty = currentBalance >= PLENTY_THRESHOLD;
  const showPreScreen = hasPlenty && !bypassed;

  const creditAmount = dollarsToCredits(dollarAmount);
  const valueTier = useMemo(() => getValueTier(dollarAmount), [dollarAmount]);
  const colors = tierColors[valueTier.tier];

  // Calculate what they can still do with current balance
  const canStillGenerate = Math.floor(currentBalance / CREDIT_COSTS.IMAGE_GENERATION);
  const canStillTheme = Math.floor(currentBalance / CREDIT_COSTS.THEME_GENERATION);

  const handlePurchase = async () => {
    if (dollarAmount < MIN_PURCHASE_DOLLARS) {
      setError(`Minimum purchase is $${MIN_PURCHASE_DOLLARS}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dollarAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleTip = async () => {
    setIsTipLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tip', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tip checkout');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsTipLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDollarAmount(3);
      setError(null);
      setBypassed(false);

      if (propBalance === undefined) {
        fetch('/api/credits')
          .then(res => res.json())
          .then(data => {
            if (data.balance !== undefined) {
              setFetchedBalance(data.balance);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, propBalance]);

  const sliderMarks = [1, 5, 10, 20, 50];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="
              relative w-full max-w-[380px] pointer-events-auto
              bg-[#0c0c0c] border border-white/[0.08] rounded-2xl
              shadow-2xl shadow-black/60 overflow-hidden
            ">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <AnimatePresence mode="wait">
                {showPreScreen ? (
                  /* Pre-screen for users with plenty of credits */
                  <motion.div
                    key="prescreen"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 py-8"
                  >
                    {/* Big balance display */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 mb-4">
                        {/* Stacked coins icon */}
                        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                          <ellipse cx="16" cy="22" rx="10" ry="4" className="fill-emerald-400/30" />
                          <ellipse cx="16" cy="18" rx="10" ry="4" className="fill-emerald-400/50" />
                          <ellipse cx="16" cy="14" rx="10" ry="4" className="fill-emerald-400/70" />
                          <ellipse cx="16" cy="10" rx="10" ry="4" className="fill-emerald-400" />
                        </svg>
                      </div>
                      <h2
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        className="text-2xl font-medium text-white tracking-tight mb-2"
                      >
                        You're loaded!
                      </h2>
                      <p className="text-white/40 text-sm">
                        You already have{' '}
                        <span className="text-emerald-400 font-semibold tabular-nums">{Math.round(currentBalance)}</span>
                        {' '}credits
                      </p>
                    </div>

                    {/* What you can do */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-6">
                      <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3">That's enough for</div>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">AI Images</span>
                          <span className="text-sm text-white font-medium tabular-nums">{canStillGenerate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">Theme generations</span>
                          <span className="text-sm text-white font-medium tabular-nums">{canStillTheme}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">Estimated presentations</span>
                          <span className="text-sm text-white font-medium tabular-nums">~{Math.floor(canStillGenerate / 4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quirky CTAs */}
                    <div className="space-y-3">
                      <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl font-medium text-[15px] bg-white text-black hover:bg-white/90 transition-colors"
                      >
                        🎨 Sweet, back to creating
                      </button>
                      <button
                        onClick={() => setBypassed(true)}
                        className="w-full py-3 rounded-xl font-medium text-[13px] text-white/60 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors"
                      >
                        💸 I want to buy more
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Main purchase flow */
                  <motion.div
                    key="purchase"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Header */}
                    <div className="px-6 pt-6 pb-2">
                      <h2
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        className="text-[22px] font-medium text-white tracking-tight"
                      >
                        Add Credits
                      </h2>
                      <p className="text-[13px] text-white/40 mt-1">
                        You have <span className="text-white/60 tabular-nums">{Math.round(currentBalance)}</span> credits
                      </p>
                    </div>

              {/* Amount display with NumberFlow */}
              <div className="px-6 py-5">
                <div className="text-center mb-6">
                  <div className="inline-flex items-baseline">
                    <span className="text-2xl text-white/40 font-light mr-0.5">$</span>
                    <NumberFlow
                      value={dollarAmount}
                      className="text-5xl font-semibold text-white tabular-nums tracking-tight"
                      transformTiming={{ duration: 400, easing: 'ease-out' }}
                      spinTiming={{ duration: 400, easing: 'ease-out' }}
                    />
                  </div>
                  <div className="text-sm text-white/30 mt-1.5 tabular-nums flex items-center justify-center gap-1">
                    <NumberFlow
                      value={creditAmount}
                      className="tabular-nums"
                      transformTiming={{ duration: 300, easing: 'ease-out' }}
                    />
                    <span>credits</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative px-1">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={dollarAmount}
                    onChange={(e) => setDollarAmount(parseInt(e.target.value))}
                    className="
                      w-full h-1.5 rounded-full appearance-none cursor-pointer
                      bg-white/[0.08]
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:shadow-black/30
                      [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-white/20
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-moz-range-thumb]:w-5
                      [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-white
                      [&::-moz-range-thumb]:border-2
                      [&::-moz-range-thumb]:border-white/20
                      [&::-moz-range-thumb]:shadow-lg
                    "
                    style={{
                      background: `linear-gradient(to right, rgba(251, 191, 36, 0.6) 0%, rgba(251, 191, 36, 0.6) ${((dollarAmount - 1) / 49) * 100}%, rgba(255,255,255,0.08) ${((dollarAmount - 1) / 49) * 100}%, rgba(255,255,255,0.08) 100%)`
                    }}
                  />

                  <div className="flex justify-between mt-2 px-0.5">
                    {sliderMarks.map((mark) => (
                      <button
                        key={mark}
                        onClick={() => setDollarAmount(mark)}
                        className={`
                          text-[11px] tabular-nums transition-colors
                          ${dollarAmount === mark
                            ? 'text-amber-400'
                            : 'text-white/25 hover:text-white/50'
                          }
                        `}
                      >
                        ${mark}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Value card with smooth transitions - fixed height to prevent layout shift */}
              <div className="mx-6 mb-5 min-h-[88px]">
                <motion.div
                  layout
                  className={`p-4 rounded-xl border border-white/[0.06] ${colors.bg} transition-colors duration-300`}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      key={valueTier.tier}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon} transition-colors duration-300`}
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                    >
                      <valueTier.Icon />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <motion.div
                        key={`headline-${valueTier.tier}`}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`text-sm font-medium ${colors.text} transition-colors duration-300`}
                      >
                        {valueTier.headline}
                      </motion.div>
                      <motion.div
                        key={`desc-${valueTier.tier}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.05 }}
                        className="text-[13px] text-white/40 mt-0.5 leading-relaxed"
                      >
                        {valueTier.description}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Quirky $50+ bonus section */}
              <AnimatePresence>
                {dollarAmount >= 50 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mx-6 mb-5 p-4 rounded-xl bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span className="text-sm font-medium text-white/80">Love Riff this much?</span>
                      </div>
                      <p className="text-[13px] text-white/40 mb-3 leading-relaxed">
                        Seriously, this is more credits than most people need in a year. But if you insist...
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleTip}
                          disabled={isTipLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <Coffee className="w-3.5 h-3.5" />
                          {isTipLoading ? 'Loading...' : 'Buy us a coffee instead?'}
                        </button>
                        <a
                          href="https://twitter.com/intent/tweet?text=Just%20discovered%20riff.im%20%E2%80%94%20turn%20your%20notes%20into%20stunning%20presentations%20with%20markdown.%20No%20subscriptions%2C%20credits%20never%20expire.%20Love%20the%20philosophy!&url=https%3A%2F%2Friff.im"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-medium transition-colors"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                          Share the love
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {/* CTA */}
              <div className="px-6 pb-5">
                <button
                  onClick={handlePurchase}
                  disabled={isLoading || dollarAmount < MIN_PURCHASE_DOLLARS}
                  className="
                    w-full py-3.5 rounded-xl font-medium text-[15px]
                    bg-white text-black
                    hover:bg-white/90
                    disabled:bg-white/10 disabled:text-white/30
                    transition-colors
                    disabled:cursor-not-allowed
                  "
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      Continue
                      <span className="text-black/50 mx-1">—</span>
                      <span className="tabular-nums">${dollarAmount}</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Trust promises */}
              <div className="px-6 pb-6 pt-4 border-t border-white/[0.06]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-white/70">No subscriptions</div>
                      <div className="text-[11px] text-white/30">Pay only when needed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                      <InfinityIcon className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-white/70">Never expire</div>
                      <div className="text-[11px] text-white/30">Yours forever</div>
                    </div>
                  </div>
                </div>
              </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
