// ============================================
// API: /api/credits/deduct
// Deduct credits for premium features (PDF/PPTX export, etc.)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductCredits, isInsufficientCreditsError } from '@/lib/credits';

interface DeductRequest {
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DeductRequest = await request.json();
    const { amount, description, metadata } = body;

    // Validate input
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount: must be a positive number' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Invalid description: must be a non-empty string' },
        { status: 400 }
      );
    }

    // Attempt deduction
    const result = await deductCredits(
      session.user.id,
      amount,
      description,
      metadata
    );

    // Check for insufficient credits
    if (isInsufficientCreditsError(result)) {
      return NextResponse.json(result, { status: 402 }); // Payment Required
    }

    // Success
    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    return NextResponse.json(
      { error: 'Failed to deduct credits', details: String(error) },
      { status: 500 }
    );
  }
}
