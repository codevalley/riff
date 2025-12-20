'use client';

// ============================================
// RIFF - Credits Ledger Modal
// Editorial design with accordion history
// ============================================

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import {
  X,
  Plus,
  ArrowUpCircle,
  Sparkles,
  RotateCcw,
  Coins,
  Loader2,
  ChevronDown,
  Shield,
  Infinity as InfinityIcon,
  Image,
  Palette,
  Layers,
  Wand2,
  FileText,
  PlusCircle,
  Paintbrush,
} from 'lucide-react';
import { CreditTransaction } from '@/hooks/useCredits';
import { CREDIT_COSTS } from '@/lib/credits-config';

interface CreditsLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCredits: () => void;
  balance: number | null;
  transactions: CreditTransaction[];
  isLoading: boolean;
}

// Time-based grouping with summary
interface TransactionGroup {
  label: string;
  id: string;
  transactions: CreditTransaction[];
  totalSpent: number;
  totalEarned: number;
}

function groupTransactionsByPeriod(transactions: CreditTransaction[]): TransactionGroup[] {
  const groups: TransactionGroup[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const periods = {
    today: { label: 'Today', id: 'today', transactions: [] as CreditTransaction[] },
    thisWeek: { label: 'This Week', id: 'week', transactions: [] as CreditTransaction[] },
    thisMonth: { label: 'This Month', id: 'month', transactions: [] as CreditTransaction[] },
    older: { label: 'Earlier', id: 'older', transactions: [] as CreditTransaction[] },
  };

  for (const tx of transactions) {
    const txDate = new Date(tx.createdAt);
    if (txDate >= today) {
      periods.today.transactions.push(tx);
    } else if (txDate >= weekAgo) {
      periods.thisWeek.transactions.push(tx);
    } else if (txDate >= monthAgo) {
      periods.thisMonth.transactions.push(tx);
    } else {
      periods.older.transactions.push(tx);
    }
  }

  // Only include periods with transactions
  for (const period of Object.values(periods)) {
    if (period.transactions.length > 0) {
      const totalSpent = period.transactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const totalEarned = period.transactions
        .filter(tx => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);

      groups.push({
        ...period,
        totalSpent,
        totalEarned,
      });
    }
  }

  return groups;
}

// Get icon and styling for transaction type
function getTransactionStyle(tx: CreditTransaction) {
  const isPositive = tx.amount > 0;
  const desc = (tx.description || '').toLowerCase();

  if (tx.type === 'initial') {
    return {
      Icon: Sparkles,
      color: 'text-amber-400',
      label: 'Welcome bonus',
    };
  }

  if (tx.type === 'purchase') {
    return {
      Icon: ArrowUpCircle,
      color: 'text-emerald-400',
      label: 'Credit purchase',
    };
  }

  if (tx.type === 'refund') {
    return {
      Icon: RotateCcw,
      color: isPositive ? 'text-emerald-400' : 'text-red-400',
      label: 'Refund',
    };
  }

  if (tx.type === 'bonus') {
    return {
      Icon: Sparkles,
      color: 'text-violet-400',
      label: 'Bonus',
    };
  }

  // Usage - match icon to description
  if (desc.includes('image') && desc.includes('restyle')) {
    return {
      Icon: Paintbrush,
      color: 'text-purple-400',
      label: tx.description || 'Image restyle',
    };
  }

  if (desc.includes('image') || desc.includes('generation')) {
    return {
      Icon: Image,
      color: 'text-emerald-400',
      label: tx.description || 'Image generation',
    };
  }

  if (desc.includes('theme')) {
    return {
      Icon: Palette,
      color: 'text-violet-400',
      label: tx.description || 'Theme generation',
    };
  }

  if (desc.includes('revamp') && desc.includes('deck')) {
    return {
      Icon: Wand2,
      color: 'text-amber-400',
      label: tx.description || 'Deck revamp',
    };
  }

  if (desc.includes('revamp') && desc.includes('slide')) {
    return {
      Icon: Wand2,
      color: 'text-sky-400',
      label: tx.description || 'Slide revamp',
    };
  }

  if (desc.includes('slide') || desc.includes('add slide')) {
    return {
      Icon: PlusCircle,
      color: 'text-sky-400',
      label: tx.description || 'Add slide',
    };
  }

  if (desc.includes('document') || desc.includes('conversion') || desc.includes('import')) {
    return {
      Icon: FileText,
      color: 'text-orange-400',
      label: tx.description || 'Document conversion',
    };
  }

  // Generic usage fallback
  return {
    Icon: Coins,
    color: 'text-white/40',
    label: tx.description || 'Usage',
  };
}

// Format time compactly
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Accordion group component
function TransactionGroupAccordion({
  group,
  defaultOpen = false
}: {
  group: TransactionGroup;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const netChange = group.totalEarned - group.totalSpent;

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      {/* Accordion header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 hover:bg-white/[0.02] transition-colors rounded-lg -mx-1 group"
      >
        <div className="flex items-center gap-3">
          <span
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-[13px] font-medium text-white/70"
          >
            {group.label}
          </span>
          <span className="text-[11px] text-white/30">
            {group.transactions.length} {group.transactions.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Net summary */}
          {group.totalSpent > 0 && (
            <span className="text-[12px] text-white/40 tabular-nums">
              −{Math.round(group.totalSpent)}
            </span>
          )}
          {group.totalEarned > 0 && (
            <span className="text-[12px] text-emerald-400/80 tabular-nums">
              +{Math.round(group.totalEarned)}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-white/30 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Accordion content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-0.5">
              {group.transactions.map((tx) => {
                const style = getTransactionStyle(tx);
                const Icon = style.Icon;
                const isPositive = tx.amount > 0;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Minimal icon */}
                    <Icon className={`w-3.5 h-3.5 ${style.color} flex-shrink-0`} />

                    {/* Description + time */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-[13px] text-white/60 truncate">
                        {tx.description || style.label}
                      </span>
                      <span className="text-[11px] text-white/20 flex-shrink-0">
                        {formatTime(tx.createdAt)}
                      </span>
                    </div>

                    {/* Amount */}
                    <span
                      className={`text-[13px] font-medium tabular-nums flex-shrink-0 ${
                        isPositive ? 'text-emerald-400' : 'text-white/50'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {Math.round(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CreditsLedgerModal({
  isOpen,
  onClose,
  onAddCredits,
  balance,
  transactions,
  isLoading,
}: CreditsLedgerModalProps) {
  const groupedTransactions = useMemo(
    () => groupTransactionsByPeriod(transactions),
    [transactions]
  );

  // Calculate lifetime stats
  const lifetimeStats = useMemo(() => {
    const totalSpent = transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalEarned = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { totalSpent, totalEarned };
  }, [transactions]);

  // Calculate what balance can do (mileage widget)
  const canGenerate = balance ? Math.floor(balance / CREDIT_COSTS.IMAGE_GENERATION) : 0;
  const canTheme = balance ? Math.floor(balance / CREDIT_COSTS.THEME_GENERATION) : 0;
  const canRevamp = balance ? Math.floor(balance / CREDIT_COSTS.DECK_REVAMP) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-[400px] pointer-events-auto bg-[#0c0c0c] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header - Balance Display */}
              <div className="px-6 pt-6 pb-5">
                <h2
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  className="text-[22px] font-medium text-white tracking-tight mb-3"
                >
                  Your Credits
                </h2>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Coins icon */}
                    <div className="p-2.5 rounded-full bg-amber-500/10">
                      <Coins className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <div className="text-4xl font-semibold text-white tabular-nums">
                        {balance !== null ? (
                          <NumberFlow
                            value={balance}
                            format={{ minimumFractionDigits: 0, maximumFractionDigits: 1 }}
                          />
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </div>
                      <span className="text-white/30 text-sm">credits</span>
                    </div>
                  </div>

                  {/* Compact Add Credits button - aligned with credits */}
                  <button
                    onClick={() => {
                      onClose();
                      onAddCredits();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-[13px] font-medium text-white/80 hover:text-white transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {/* Mileage widget - what you can do */}
                {balance !== null && balance > 0 && (
                  <div className="mt-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2.5">
                      That&apos;s enough for
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                          <Image className="w-3 h-3 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium tabular-nums">{canGenerate}</div>
                          <div className="text-[10px] text-white/30">images</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                          <Palette className="w-3 h-3 text-violet-400" />
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium tabular-nums">{canTheme}</div>
                          <div className="text-[10px] text-white/30">themes</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                          <Layers className="w-3 h-3 text-amber-400" />
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium tabular-nums">{canRevamp}</div>
                          <div className="text-[10px] text-white/30">revamps</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider with History label */}
              <div className="flex items-center gap-3 px-6 py-2">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  className="text-[11px] text-white/25 uppercase tracking-wider"
                >
                  History
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Transaction List with Accordion */}
              <div className="px-5 pb-4 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                  </div>
                ) : groupedTransactions.length === 0 ? (
                  <div className="text-center py-10">
                    <Coins className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-white/40 text-sm">No activity yet</p>
                    <p className="text-white/20 text-xs mt-0.5">
                      Your credit history will appear here
                    </p>
                  </div>
                ) : (
                  <div>
                    {groupedTransactions.map((group) => (
                      <TransactionGroupAccordion
                        key={group.id}
                        group={group}
                        defaultOpen={false} // All collapsed by default
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Lifetime stats + Trust footer */}
              <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
                {/* Lifetime usage */}
                {lifetimeStats.totalSpent > 0 && (
                  <>
                    <div className="flex items-center justify-center gap-4 text-[11px]">
                      <span className="text-white/25">
                        Lifetime: <span className="text-white/40 tabular-nums">{Math.round(lifetimeStats.totalSpent)}</span> used
                      </span>
                      <span className="text-white/10">•</span>
                      <span className="text-white/25">
                        <span className="text-white/40 tabular-nums">{Math.round(lifetimeStats.totalEarned)}</span> added
                      </span>
                    </div>
                    {/* Subtle separator */}
                    <div className="my-3 h-px bg-white/[0.04]" />
                  </>
                )}

                {/* Trust promises - compact with proper vertical alignment */}
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                    <span className="text-[11px] text-white/40 leading-none">No subscriptions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <InfinityIcon className="w-3.5 h-3.5 text-rose-400/60 flex-shrink-0" />
                    <span className="text-[11px] text-white/40 leading-none">Never expire</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
