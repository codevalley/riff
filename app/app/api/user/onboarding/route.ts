// ============================================
// API: /api/user/onboarding
// Get and update user's onboarding state
// ============================================

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Shape of onboarding state stored in the database
 */
export interface OnboardingState {
  completedSteps: string[];
  skippedAll: boolean;
  lastCompletedAt?: string;
}

const DEFAULT_STATE: OnboardingState = {
  completedSteps: [],
  skippedAll: false,
};

/**
 * Check if error is due to missing column (migration not yet applied)
 */
function isColumnNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2022'
  );
}

/**
 * GET /api/user/onboarding
 * Returns the user's current onboarding state
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingState: true },
    });

    // Return stored state or default
    const state = (user?.onboardingState as OnboardingState | null) ?? DEFAULT_STATE;

    return NextResponse.json({ state });
  } catch (error) {
    // If column doesn't exist yet (migration pending), return default state
    if (isColumnNotFoundError(error)) {
      console.warn('onboardingState column not found - migration pending, using default state');
      return NextResponse.json({ state: DEFAULT_STATE });
    }

    console.error('Error fetching onboarding state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding state' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/onboarding
 * Updates the user's onboarding state (merges with existing)
 *
 * Body: Partial<OnboardingState>
 * - completedSteps?: string[] - Steps to mark as completed (merged with existing)
 * - skippedAll?: boolean - Whether user skipped all tutorials
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { completedSteps, skippedAll } = body as Partial<OnboardingState>;

    // Fetch current state
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingState: true },
    });

    const currentState = (user?.onboardingState as OnboardingState | null) ?? DEFAULT_STATE;

    // Merge new completedSteps with existing (no duplicates)
    const existingSteps = currentState.completedSteps || [];
    const newSteps = completedSteps || [];
    const allSteps = [...existingSteps, ...newSteps];
    const uniqueSteps = allSteps.filter((step, index) => allSteps.indexOf(step) === index);

    // Build updated state
    const newState: OnboardingState = {
      completedSteps: uniqueSteps,
      skippedAll: skippedAll ?? currentState.skippedAll,
      lastCompletedAt: new Date().toISOString(),
    };

    // Update in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingState: newState as unknown as Prisma.JsonObject },
    });

    return NextResponse.json({ state: newState });
  } catch (error) {
    // If column doesn't exist yet, silently succeed (state stored in localStorage)
    if (isColumnNotFoundError(error)) {
      console.warn('onboardingState column not found - migration pending, skipping DB update');
      return NextResponse.json({ state: DEFAULT_STATE });
    }

    console.error('Error updating onboarding state:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding state' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/onboarding
 * Resets the user's onboarding state (for "show tutorials again")
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset to default state
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingState: DEFAULT_STATE as unknown as Prisma.JsonObject },
    });

    return NextResponse.json({ state: DEFAULT_STATE });
  } catch (error) {
    // If column doesn't exist yet, silently succeed
    if (isColumnNotFoundError(error)) {
      console.warn('onboardingState column not found - migration pending, skipping DB update');
      return NextResponse.json({ state: DEFAULT_STATE });
    }

    console.error('Error resetting onboarding state:', error);
    return NextResponse.json(
      { error: 'Failed to reset onboarding state' },
      { status: 500 }
    );
  }
}
