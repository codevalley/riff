'use client';

// ============================================
// Auth Error Page
// Shown when authentication fails
// ============================================

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, LayoutGrid, Loader2 } from 'lucide-react';
import Link from 'next/link';

const errorMessages: Record<string, string> = {
  Configuration: 'Server configuration error. Please try again later.',
  AccessDenied: 'Access denied. You may not have permission to sign in.',
  Verification: 'The verification link has expired or already been used.',
  OAuthSignin: 'Error connecting to the sign-in provider.',
  OAuthCallback: 'Error during sign-in callback.',
  OAuthCreateAccount: 'Could not create account with this provider.',
  EmailCreateAccount: 'Could not create account with this email.',
  Callback: 'Error during authentication callback.',
  OAuthAccountNotLinked: 'This email is already associated with another account.',
  EmailSignin: 'Error sending the verification email.',
  CredentialsSignin: 'Invalid credentials.',
  SessionRequired: 'Please sign in to access this page.',
  Default: 'An unexpected error occurred. Please try again.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';

  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <LayoutGrid className="w-8 h-8 text-white" />
          <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Riff
          </span>
        </Link>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-xl font-semibold text-white mb-2">
            Authentication Error
          </h1>
          <p className="text-sm text-white/50 mb-6">
            {errorMessage}
          </p>

          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-white/90 rounded-xl text-black text-sm font-medium transition-colors"
          >
            Try again
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
