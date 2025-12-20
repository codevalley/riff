// ============================================
// RIFF - Credits System Library
// Manages user credits with database as source of truth
// SERVER-SIDE ONLY - Do not import in client components
// ============================================

import { prisma } from './prisma';
import * as dodo from './dodo';
import {
  CREDIT_COSTS,
  CREDITS_PER_DOLLAR,
  MIN_PURCHASE_DOLLARS,
  DEFAULT_INITIAL_FREE_CREDITS,
  dollarsToCredits,
} from './credits-config';

// Re-export constants for server-side consumers
export { CREDIT_COSTS, CREDITS_PER_DOLLAR, MIN_PURCHASE_DOLLARS, dollarsToCredits };

// Initial credits - reads from env on server
export const INITIAL_FREE_CREDITS = Number(process.env.INITIAL_FREE_CREDITS) || DEFAULT_INITIAL_FREE_CREDITS;

// ============================================
// Types
// ============================================

export interface CreditBalance {
  balance: number;
  dodoCustomerId: string;
}

export interface CreditDeductionResult {
  success: true;
  newBalance: number;
  transactionId: string;
}

export interface InsufficientCreditsError {
  error: 'insufficient_credits';
  required: number;
  balance: number;
  message: string;
}

// ============================================
// User Credits Setup
// ============================================

/**
 * Initialize credits for a new user
 * Creates Dodo customer and initializes credits
 */
export async function initializeUserCredits(
  userId: string,
  email: string,
  name?: string
): Promise<CreditBalance> {
  // Check if user already has credits record
  const existing = await prisma.userCredits.findUnique({
    where: { userId },
  });

  if (existing) {
    return {
      balance: existing.cachedBalance,
      dodoCustomerId: existing.dodoCustomerId,
    };
  }

  // Create Dodo customer (for future payments)
  const { customerId } = await dodo.createCustomer({ email, name });

  // Create local credits record with initial balance
  const credits = await prisma.userCredits.create({
    data: {
      userId,
      dodoCustomerId: customerId,
      cachedBalance: INITIAL_FREE_CREDITS,
      lastSynced: new Date(),
    },
  });

  // Log initial credits transaction
  await prisma.creditTransaction.create({
    data: {
      userId,
      amount: INITIAL_FREE_CREDITS,
      type: 'initial',
      description: 'Welcome credits for new user',
    },
  });

  return {
    balance: INITIAL_FREE_CREDITS,
    dodoCustomerId: customerId,
  };
}

/**
 * Ensure user has credits record (lazy initialization)
 * Call this before any credit operation
 */
export async function ensureUserCredits(userId: string): Promise<{
  dodoCustomerId: string;
  balance: number;
}> {
  const credits = await prisma.userCredits.findUnique({
    where: { userId },
  });

  if (credits) {
    return {
      dodoCustomerId: credits.dodoCustomerId,
      balance: credits.cachedBalance,
    };
  }

  // Get user info for initialization
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.email) {
    throw new Error('User not found or has no email');
  }

  // Initialize credits
  const result = await initializeUserCredits(userId, user.email, user.name || undefined);
  return {
    dodoCustomerId: result.dodoCustomerId,
    balance: result.balance,
  };
}

// ============================================
// Balance Operations
// ============================================

/**
 * Get user's credit balance
 */
export async function getBalance(userId: string): Promise<CreditBalance> {
  const { dodoCustomerId, balance } = await ensureUserCredits(userId);

  return {
    balance,
    dodoCustomerId,
  };
}

/**
 * Check if user has enough credits for an action
 */
export async function hasEnoughCredits(
  userId: string,
  requiredAmount: number
): Promise<{ hasEnough: boolean; balance: number }> {
  const { balance } = await getBalance(userId);
  return {
    hasEnough: balance >= requiredAmount,
    balance,
  };
}

// ============================================
// Credit Deduction
// ============================================

/**
 * Deduct credits for an action
 * Returns error object if insufficient credits
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
): Promise<CreditDeductionResult | InsufficientCreditsError> {
  const { balance } = await ensureUserCredits(userId);

  // Check if user has enough credits
  if (balance < amount) {
    return {
      error: 'insufficient_credits',
      required: amount,
      balance,
      message: `You need ${amount} credit${amount !== 1 ? 's' : ''} but have ${balance.toFixed(1)}`,
    };
  }

  // Deduct credits using atomic update
  const newBalance = balance - amount;

  await prisma.userCredits.update({
    where: { userId },
    data: {
      cachedBalance: newBalance,
      lastSynced: new Date(),
    },
  });

  // Log transaction
  const transaction = await prisma.creditTransaction.create({
    data: {
      userId,
      amount: -amount,
      type: 'usage',
      description,
      metadata: metadata as object,
    },
  });

  return {
    success: true,
    newBalance,
    transactionId: transaction.id,
  };
}

// ============================================
// Credit Addition
// ============================================

/**
 * Add credits to user's balance (for purchases, bonuses, refunds)
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'bonus' | 'refund',
  description?: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  const { balance } = await ensureUserCredits(userId);

  const newBalance = balance + amount;

  // Update balance
  await prisma.userCredits.update({
    where: { userId },
    data: {
      cachedBalance: newBalance,
      lastSynced: new Date(),
    },
  });

  // Log transaction
  const transaction = await prisma.creditTransaction.create({
    data: {
      userId,
      amount,
      type,
      description: description || `${type}: ${amount} credits`,
      metadata: metadata as object,
    },
  });

  return {
    success: true,
    newBalance,
    transactionId: transaction.id,
  };
}

// ============================================
// Helper: Check credits before action
// ============================================

/**
 * Check if user has enough credits for an action
 * Use in API routes before expensive operations
 */
export async function requireCredits(
  userId: string,
  cost: number
): Promise<
  | { allowed: true; balance: number }
  | { allowed: false; error: InsufficientCreditsError }
> {
  const { hasEnough, balance } = await hasEnoughCredits(userId, cost);

  if (!hasEnough) {
    return {
      allowed: false,
      error: {
        error: 'insufficient_credits',
        required: cost,
        balance,
        message: `You need ${cost} credit${cost !== 1 ? 's' : ''} but have ${balance.toFixed(1)}`,
      },
    };
  }

  return { allowed: true, balance };
}

// ============================================
// Transaction History
// ============================================

/**
 * Get user's credit transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit = 50
): Promise<
  Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
  }>
> {
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      amount: true,
      type: true,
      description: true,
      metadata: true,
      createdAt: true,
    },
  });

  // Cast Prisma's JsonValue to our expected type
  return transactions.map((t) => ({
    ...t,
    metadata: t.metadata as Record<string, unknown> | null,
  }));
}

// ============================================
// Type guard for insufficient credits
// ============================================

export function isInsufficientCreditsError(
  result: CreditDeductionResult | InsufficientCreditsError
): result is InsufficientCreditsError {
  return 'error' in result && result.error === 'insufficient_credits';
}
