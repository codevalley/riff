'use client';

// ============================================
// Email Verification Pending Page
// Shown after user requests magic link
// ============================================

import { motion } from 'framer-motion';
import { Mail, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
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
          <div className="w-16 h-16 mx-auto mb-6 bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center">
            <Mail className="w-8 h-8 text-white/60" />
          </div>

          <h1 className="text-xl font-semibold text-white mb-2">
            Check your email
          </h1>
          <p className="text-sm text-white/50 mb-6">
            We sent you a magic link to sign in. Click the link in your email to continue.
          </p>

          <Link
            href="/auth/signin"
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
