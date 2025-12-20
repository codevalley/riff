// ============================================
// RIFF - useCredits Hook
// Easy credits management throughout the app
// ============================================

'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

// Transaction type matching API response
export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'initial';
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string; // ISO date string from API
}

interface UseCreditsReturn {
  balance: number | null;
  transactions: CreditTransaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasEnough: (amount: number) => boolean;
}

export function useCredits(): UseCreditsReturn {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/credits');

      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in - that's okay
          setBalance(null);
          setTransactions([]);
          return;
        }
        throw new Error('Failed to fetch credits');
      }

      const data = await res.json();
      setBalance(data.balance);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const hasEnough = useCallback((amount: number) => {
    return balance !== null && balance >= amount;
  }, [balance]);

  return {
    balance,
    transactions,
    isLoading,
    error,
    refetch: fetchBalance,
    hasEnough,
  };
}

// ============================================
// Context for credits state management
// ============================================

interface CreditsContextType extends UseCreditsReturn {
  showPurchaseModal: boolean;
  setShowPurchaseModal: (show: boolean) => void;
  showLedgerModal: boolean;
  setShowLedgerModal: (show: boolean) => void;
  showInsufficientModal: boolean;
  insufficientModalProps: {
    requiredCredits: number;
    actionName: string;
  } | null;
  triggerInsufficientModal: (requiredCredits: number, actionName: string) => void;
  closeInsufficientModal: () => void;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const credits = useCredits();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [insufficientModalProps, setInsufficientModalProps] = useState<{
    requiredCredits: number;
    actionName: string;
  } | null>(null);

  const triggerInsufficientModal = useCallback((requiredCredits: number, actionName: string) => {
    setInsufficientModalProps({ requiredCredits, actionName });
    setShowInsufficientModal(true);
  }, []);

  const closeInsufficientModal = useCallback(() => {
    setShowInsufficientModal(false);
    setInsufficientModalProps(null);
  }, []);

  return (
    <CreditsContext.Provider
      value={{
        ...credits,
        showPurchaseModal,
        setShowPurchaseModal,
        showLedgerModal,
        setShowLedgerModal,
        showInsufficientModal,
        insufficientModalProps,
        triggerInsufficientModal,
        closeInsufficientModal,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCreditsContext() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCreditsContext must be used within a CreditsProvider');
  }
  return context;
}
