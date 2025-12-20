# Credits System Implementation Guide

A complete guide to implementing Riff's credits/coins system in other Next.js projects, including DodoPayments integration for purchases.

---

## Overview

The credits system provides:
- **Pay-as-you-go model**: No subscriptions, credits never expire
- **Configurable pricing**: $1 = 20 credits (adjustable)
- **Real-time balance**: UI updates instantly on usage/purchase
- **Transaction history**: Full ledger with grouping and summaries
- **Payment processing**: DodoPayments for credit purchases

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ CreditsDisplay  │  │ PurchaseModal   │  │ LedgerModal  │ │
│  │ (balance)       │  │ (buy credits)   │  │ (history)    │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘ │
│           │                    │                   │         │
│           └────────────────────┼───────────────────┘         │
│                                ▼                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               CreditsProvider (Context)                  │ │
│  │  - balance, transactions, isLoading                      │ │
│  │  - refetch(), hasEnough()                                │ │
│  │  - showPurchaseModal, showLedgerModal                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                        API Routes                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ GET /api/credits│  │POST /api/credits│  │POST /api/    │ │
│  │ (balance +      │  │    /purchase    │  │webhooks/dodo │ │
│  │  transactions)  │  │ (checkout)      │  │ (fulfill)    │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘ │
│           │                    │                   │         │
│           └────────────────────┼───────────────────┘         │
│                                ▼                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   lib/credits.ts                         │ │
│  │  - getBalance(), deductCredits(), addCredits()           │ │
│  │  - requireCredits(), getTransactionHistory()             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│        Prisma DB          │   │     DodoPayments API      │
│  - UserCredits            │   │  - createCustomer()       │
│  - CreditTransaction      │   │  - createCheckoutSession()│
└───────────────────────────┘   └───────────────────────────┘
```

---

## Step 1: Database Schema

Add these models to your Prisma schema:

```prisma
// prisma/schema.prisma

model UserCredits {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // DodoPayments customer ID (for wallet operations)
  dodoCustomerId String @unique

  // Cached balance (source of truth is local DB, synced with Dodo on purchase)
  cachedBalance Float    @default(0)
  lastSynced    DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CreditTransaction {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Transaction details
  amount      Float   // Positive = add, Negative = deduct
  type        String  // "purchase", "usage", "bonus", "refund", "initial"
  description String? // "AI image generation", "Theme generation", etc.
  metadata    Json?   // Additional context (e.g., payment_id)

  // DodoPayments reference (optional)
  dodoLedgerId String?

  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}

// Add relation to User model
model User {
  // ... existing fields
  credits       UserCredits?
  transactions  CreditTransaction[]
}
```

Run migration:
```bash
npx prisma migrate dev --name add-credits-system
```

---

## Step 2: Configuration File

Create a client-safe configuration file:

```typescript
// lib/credits-config.ts

// Credit costs for different actions (adjust to your needs)
export const CREDIT_COSTS = {
  IMAGE_GENERATION: 5,     // ~$0.25
  IMAGE_RESTYLE: 5,        // ~$0.25
  DOCUMENT_CONVERSION: 5,  // ~$0.25
  THEME_GENERATION: 1,     // ~$0.05
  // Add your own operations here
} as const;

// Pricing Model
export const CREDITS_PER_DOLLAR = 20;        // $1 = 20 credits
export const MIN_PURCHASE_DOLLARS = 1;       // Minimum $1 purchase
export const DEFAULT_INITIAL_FREE_CREDITS = 50;  // Welcome bonus

// Helpers
export function dollarsToCredits(dollars: number): number {
  return dollars * CREDITS_PER_DOLLAR;
}

export function creditsToDollars(credits: number): number {
  return credits / CREDITS_PER_DOLLAR;
}
```

---

## Step 3: DodoPayments Client

```typescript
// lib/dodo.ts

import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
});

/**
 * Create a new customer in DodoPayments
 */
export async function createCustomer(params: {
  email: string;
  name?: string;
}): Promise<{ customerId: string }> {
  try {
    const customer = await dodo.customers.create({
      email: params.email,
      name: params.name || params.email.split('@')[0],
    });
    return { customerId: customer.customer_id };
  } catch (error) {
    console.error('Error creating Dodo customer:', error);
    // Fallback ID if Dodo fails (can sync later)
    return { customerId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}` };
  }
}

/**
 * Create checkout session for credit purchase
 *
 * Pricing model: Dodo product is $1, quantity = dollar amount
 */
export async function createCheckoutSession(params: {
  customerId: string;
  customerEmail: string;
  customerName?: string;
  dollarAmount: number;
  creditAmount: number;
  successUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const session = await dodo.checkoutSessions.create({
    product_cart: [
      {
        product_id: process.env.DODO_CREDITS_PRODUCT_ID!,
        quantity: params.dollarAmount,
      },
    ],
    customer: params.customerId.startsWith('local_')
      ? { email: params.customerEmail, name: params.customerName }
      : { customer_id: params.customerId },
    return_url: params.successUrl,
    metadata: {
      type: 'credit_purchase',
      credit_amount: params.creditAmount.toString(),
      dollar_amount: params.dollarAmount.toString(),
      user_id: params.metadata?.userId || '',
    },
    customization: { theme: 'dark' },
  });

  return {
    checkoutUrl: session.checkout_url,
    sessionId: session.session_id,
  };
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return (
    signature === expectedHmac ||
    signature === `sha256=${expectedHmac}` ||
    signature === `v1=${expectedHmac}`
  );
}

export function parseWebhookPayload(body: string) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export { dodo };
```

---

## Step 4: Credits Library (Server-Side)

```typescript
// lib/credits.ts

import { prisma } from './prisma';
import * as dodo from './dodo';
import {
  CREDIT_COSTS,
  CREDITS_PER_DOLLAR,
  MIN_PURCHASE_DOLLARS,
  DEFAULT_INITIAL_FREE_CREDITS,
  dollarsToCredits,
} from './credits-config';

export { CREDIT_COSTS, CREDITS_PER_DOLLAR, MIN_PURCHASE_DOLLARS, dollarsToCredits };

const INITIAL_FREE_CREDITS = Number(process.env.INITIAL_FREE_CREDITS) || DEFAULT_INITIAL_FREE_CREDITS;

// ========== User Setup ==========

export async function initializeUserCredits(
  userId: string,
  email: string,
  name?: string
) {
  const existing = await prisma.userCredits.findUnique({ where: { userId } });
  if (existing) {
    return { balance: existing.cachedBalance, dodoCustomerId: existing.dodoCustomerId };
  }

  // Create Dodo customer
  const { customerId } = await dodo.createCustomer({ email, name });

  // Create local record with initial credits
  const credits = await prisma.userCredits.create({
    data: {
      userId,
      dodoCustomerId: customerId,
      cachedBalance: INITIAL_FREE_CREDITS,
      lastSynced: new Date(),
    },
  });

  // Log welcome bonus transaction
  await prisma.creditTransaction.create({
    data: {
      userId,
      amount: INITIAL_FREE_CREDITS,
      type: 'initial',
      description: 'Welcome credits for new user',
    },
  });

  return { balance: INITIAL_FREE_CREDITS, dodoCustomerId: customerId };
}

export async function ensureUserCredits(userId: string) {
  const credits = await prisma.userCredits.findUnique({ where: { userId } });
  if (credits) {
    return { dodoCustomerId: credits.dodoCustomerId, balance: credits.cachedBalance };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) throw new Error('User not found or has no email');

  return initializeUserCredits(userId, user.email, user.name || undefined);
}

// ========== Balance Operations ==========

export async function getBalance(userId: string) {
  const { dodoCustomerId, balance } = await ensureUserCredits(userId);
  return { balance, dodoCustomerId };
}

export async function hasEnoughCredits(userId: string, requiredAmount: number) {
  const { balance } = await getBalance(userId);
  return { hasEnough: balance >= requiredAmount, balance };
}

// ========== Deduction ==========

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
) {
  const { balance } = await ensureUserCredits(userId);

  if (balance < amount) {
    return {
      error: 'insufficient_credits' as const,
      required: amount,
      balance,
      message: `You need ${amount} credits but have ${balance.toFixed(1)}`,
    };
  }

  const newBalance = balance - amount;

  await prisma.userCredits.update({
    where: { userId },
    data: { cachedBalance: newBalance, lastSynced: new Date() },
  });

  const transaction = await prisma.creditTransaction.create({
    data: {
      userId,
      amount: -amount,
      type: 'usage',
      description,
      metadata: metadata as object,
    },
  });

  return { success: true as const, newBalance, transactionId: transaction.id };
}

// ========== Addition ==========

export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'bonus' | 'refund',
  description?: string,
  metadata?: Record<string, unknown>
) {
  const { balance } = await ensureUserCredits(userId);
  const newBalance = balance + amount;

  await prisma.userCredits.update({
    where: { userId },
    data: { cachedBalance: newBalance, lastSynced: new Date() },
  });

  const transaction = await prisma.creditTransaction.create({
    data: {
      userId,
      amount,
      type,
      description: description || `${type}: ${amount} credits`,
      metadata: metadata as object,
    },
  });

  return { success: true, newBalance, transactionId: transaction.id };
}

// ========== Pre-check Helper ==========

export async function requireCredits(userId: string, cost: number) {
  const { hasEnough, balance } = await hasEnoughCredits(userId, cost);

  if (!hasEnough) {
    return {
      allowed: false as const,
      error: {
        error: 'insufficient_credits' as const,
        required: cost,
        balance,
        message: `You need ${cost} credits but have ${balance.toFixed(1)}`,
      },
    };
  }

  return { allowed: true as const, balance };
}

// ========== Transaction History ==========

export async function getTransactionHistory(userId: string, limit = 50) {
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

  return transactions.map((t) => ({
    ...t,
    metadata: t.metadata as Record<string, unknown> | null,
  }));
}

// ========== Type Guard ==========

export function isInsufficientCreditsError(result: any): result is { error: 'insufficient_credits' } {
  return 'error' in result && result.error === 'insufficient_credits';
}
```

---

## Step 5: API Routes

### GET /api/credits (Balance + History)

```typescript
// app/api/credits/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBalance, getTransactionHistory } from '@/lib/credits';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { balance } = await getBalance(session.user.id);
    const transactions = await getTransactionHistory(session.user.id);

    return NextResponse.json({ balance, transactions });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}
```

### POST /api/credits/purchase (Checkout)

```typescript
// app/api/credits/purchase/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureUserCredits, MIN_PURCHASE_DOLLARS, dollarsToCredits } from '@/lib/credits';
import { createCheckoutSession } from '@/lib/dodo';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dollarAmount } = await request.json();

    if (!dollarAmount || dollarAmount < MIN_PURCHASE_DOLLARS) {
      return NextResponse.json(
        { error: `Minimum purchase is $${MIN_PURCHASE_DOLLARS}` },
        { status: 400 }
      );
    }

    const { dodoCustomerId } = await ensureUserCredits(session.user.id);
    const creditAmount = dollarsToCredits(dollarAmount);

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const { checkoutUrl, sessionId } = await createCheckoutSession({
      customerId: dodoCustomerId,
      customerEmail: session.user.email,
      customerName: session.user.name || undefined,
      dollarAmount,
      creditAmount,
      successUrl: `${baseUrl}/credits/success`,
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ checkoutUrl, sessionId, dollarAmount, creditAmount });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
```

### POST /api/webhooks/dodo (Fulfillment)

```typescript
// app/api/webhooks/dodo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, parseWebhookPayload } from '@/lib/dodo';
import { addCredits } from '@/lib/credits';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('dodo-signature') || '';

    // Verify signature
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = parseWebhookPayload(rawBody);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Handle payment success
    if (payload.type === 'payment.succeeded' || payload.type === 'payment.completed') {
      const { payment_id, metadata } = payload.data;

      if (metadata?.type !== 'credit_purchase') {
        return NextResponse.json({ received: true });
      }

      const userId = metadata?.user_id;
      const creditAmount = parseInt(metadata?.credit_amount || '0', 10);

      if (!userId || !creditAmount) {
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Idempotency check
      const existing = await prisma.creditTransaction.findFirst({
        where: {
          userId,
          type: 'purchase',
          metadata: { path: ['payment_id'], equals: payment_id },
        },
      });

      if (existing) {
        return NextResponse.json({ received: true, status: 'already_processed' });
      }

      // Add credits
      const result = await addCredits(
        userId,
        creditAmount,
        'purchase',
        `Purchased ${creditAmount} credits`,
        { payment_id }
      );

      return NextResponse.json({
        received: true,
        status: 'credits_added',
        creditAmount,
        transactionId: result.transactionId,
      });
    }

    // Handle refunds
    if (payload.type === 'refund.succeeded') {
      const { metadata } = payload.data;
      const userId = metadata?.user_id;
      const creditAmount = parseInt(metadata?.credit_amount || '0', 10);

      if (userId && creditAmount) {
        await addCredits(userId, -creditAmount, 'refund', `Refund: ${creditAmount} credits`);
      }

      return NextResponse.json({ received: true, status: 'refund_processed' });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

---

## Step 6: React Hook & Context

```typescript
// hooks/useCredits.tsx

'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'initial';
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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

  const hasEnough = useCallback(
    (amount: number) => balance !== null && balance >= amount,
    [balance]
  );

  return { balance, transactions, isLoading, error, refetch: fetchBalance, hasEnough };
}

// ========== Context Provider ==========

interface CreditsContextType extends UseCreditsReturn {
  showPurchaseModal: boolean;
  setShowPurchaseModal: (show: boolean) => void;
  showLedgerModal: boolean;
  setShowLedgerModal: (show: boolean) => void;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const credits = useCredits();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  return (
    <CreditsContext.Provider
      value={{
        ...credits,
        showPurchaseModal,
        setShowPurchaseModal,
        showLedgerModal,
        setShowLedgerModal,
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
```

---

## Step 7: Environment Variables

```env
# .env.local

# DodoPayments
DODO_PAYMENTS_API_KEY=your_api_key
DODO_CREDITS_PRODUCT_ID=your_product_id  # Create a $1 product in Dodo dashboard
DODO_WEBHOOK_SECRET=your_webhook_secret
DODO_PAYMENTS_ENVIRONMENT=test_mode      # or live_mode

# Credits
INITIAL_FREE_CREDITS=50                  # Welcome bonus
```

---

## Step 8: DodoPayments Setup

1. **Create Account**: https://dodopayments.com
2. **Create Product**:
   - Name: "Credits" (or your app name)
   - Price: $1.00 (fixed - quantity controls total)
   - Type: One-time purchase
3. **Get Product ID**: Copy product ID → `DODO_CREDITS_PRODUCT_ID`
4. **API Key**: Settings → API Keys → `DODO_PAYMENTS_API_KEY`
5. **Webhook**:
   - URL: `https://yourapp.com/api/webhooks/dodo`
   - Events: `payment.succeeded`, `payment.completed`, `refund.succeeded`
   - Copy secret → `DODO_WEBHOOK_SECRET`

---

## Step 9: Using Credits in API Routes

```typescript
// Example: app/api/generate-image/route.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCredits, deductCredits, CREDIT_COSTS, isInsufficientCreditsError } from '@/lib/credits';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has enough credits BEFORE expensive operation
  const check = await requireCredits(session.user.id, CREDIT_COSTS.IMAGE_GENERATION);
  if (!check.allowed) {
    return NextResponse.json(check.error, { status: 402 }); // Payment Required
  }

  // Do the expensive operation
  const result = await generateImage(/* ... */);

  // Deduct credits AFTER success
  const deduction = await deductCredits(
    session.user.id,
    CREDIT_COSTS.IMAGE_GENERATION,
    'AI image generation',
    { imageId: result.id }
  );

  if (isInsufficientCreditsError(deduction)) {
    // Race condition - someone else used credits
    return NextResponse.json(deduction, { status: 402 });
  }

  return NextResponse.json({
    ...result,
    creditsRemaining: deduction.newBalance
  });
}
```

---

## UI Components (Reference)

The Riff codebase includes these ready-to-use components:

| Component | Purpose |
|-----------|---------|
| `CreditsDisplay.tsx` | Toolbar balance display (clickable → opens ledger) |
| `PurchaseCreditsModal.tsx` | Slider-based purchase flow with tier descriptions |
| `CreditsLedgerModal.tsx` | Transaction history with accordion grouping |
| `InsufficientCreditsModal.tsx` | Error modal when credits are low |

Copy and adapt these from `app/components/` for your project.

---

## Pricing Math

| Credits | Cost | Operations |
|---------|------|------------|
| 20 | $1 | 4 images OR 20 themes |
| 100 | $5 | 20 images OR 100 themes |
| 200 | $10 | 40 images OR 200 themes |

Adjust `CREDITS_PER_DOLLAR` and `CREDIT_COSTS` to match your cost structure.

---

## Checklist

- [ ] Prisma schema migrated
- [ ] `lib/credits-config.ts` created
- [ ] `lib/dodo.ts` created
- [ ] `lib/credits.ts` created
- [ ] `/api/credits` route created
- [ ] `/api/credits/purchase` route created
- [ ] `/api/webhooks/dodo` route created
- [ ] `useCredits` hook created
- [ ] `CreditsProvider` added to layout
- [ ] Dodo product created ($1)
- [ ] Dodo webhook configured
- [ ] Environment variables set
- [ ] UI components copied/adapted
