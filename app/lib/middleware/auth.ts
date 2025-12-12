// ============================================
// Auth Middleware Helpers
// For protecting API routes
// ============================================

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth';
import { prisma } from '../prisma';

/**
 * Require authentication for an API route
 * Returns user info or error response
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      session: null,
      user: null,
    };
  }

  return {
    error: null,
    session,
    user: session.user,
  };
}

/**
 * Check if user has access to a deck
 * Returns deck info and permission level
 */
export async function requireDeckAccess(
  userId: string,
  deckId: string,
  requiredPermission: 'VIEW' | 'EDIT' = 'VIEW'
) {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { shares: true },
  });

  if (!deck) {
    return {
      error: 'Deck not found',
      deck: null,
      permission: null,
    };
  }

  // Owner has full access
  if (deck.ownerId === userId) {
    return {
      error: null,
      deck,
      permission: 'OWNER' as const,
    };
  }

  // Check share permissions
  const share = deck.shares.find((s) => s.userId === userId);
  if (share) {
    if (requiredPermission === 'EDIT' && share.permission !== 'EDIT') {
      return {
        error: 'Edit permission required',
        deck: null,
        permission: null,
      };
    }
    return {
      error: null,
      deck,
      permission: share.permission,
    };
  }

  return {
    error: 'Access denied',
    deck: null,
    permission: null,
  };
}

/**
 * Get current user from session (for server components)
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
