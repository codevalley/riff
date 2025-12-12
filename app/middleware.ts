// ============================================
// Route Protection Middleware
// Protects /editor and /api/decks routes
// ============================================

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes - always accessible
        if (
          path === '/' ||
          path.startsWith('/auth') ||
          path.startsWith('/shared/') ||
          path.startsWith('/present/') ||
          path.startsWith('/api/auth') ||
          path.startsWith('/api/share/')
        ) {
          return true;
        }

        // Protected routes - require auth
        if (
          path.startsWith('/editor') ||
          path.startsWith('/settings') ||
          path.startsWith('/api/decks') ||
          path.startsWith('/api/user')
        ) {
          return !!token;
        }

        // Everything else is public
        return true;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    // Protected pages
    '/editor/:path*',
    '/settings/:path*',
    // Protected API routes
    '/api/decks/:path*',
    '/api/user/:path*',
    // Auth routes (for custom pages)
    '/auth/:path*',
  ],
};
