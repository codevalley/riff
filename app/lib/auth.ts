// ============================================
// NextAuth.js Configuration
// Supports: Google, GitHub OAuth
// ============================================

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { track } from '@vercel/analytics/server';
import { prisma } from './prisma';
import { initializeUserCredits } from './credits';
import { sendWelcomeEmail } from './email';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],

  providers: [
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // GitHub OAuth
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    // Add user ID to JWT token
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Add user ID to session from JWT
    session: async ({ session, token }) => {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  events: {
    // Create default preferences and initialize credits for new users
    createUser: async ({ user }) => {
      // Create default preferences
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
          imageStyle: 'none',
        },
      });

      // Initialize credits system (creates Dodo customer + gives 50 free credits)
      if (user.email) {
        try {
          await initializeUserCredits(user.id, user.email, user.name || undefined);
        } catch (error) {
          // Don't fail user creation if credits init fails - can be lazily initialized later
          console.error('Failed to initialize credits for new user:', error);
        }

        // Send welcome email (fire and forget - don't block on this)
        sendWelcomeEmail(user.id).catch((err) => {
          console.error('Failed to send welcome email:', err);
        });
      }

      // Track signup completion (fire and forget)
      // Determine provider from user's account - fallback to 'unknown'
      const account = await prisma.account.findFirst({
        where: { userId: user.id },
        select: { provider: true },
      });
      track('signup_completed', { provider: account?.provider || 'unknown' }).catch(() => {
        // Silently fail - analytics should not block user creation
      });
    },
  },
};

// Type augmentation for session user
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
