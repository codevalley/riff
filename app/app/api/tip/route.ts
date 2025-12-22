// ============================================
// API: /api/tip
// Create checkout session for tips/donations
// Uses Dodo's "Pay What You Want" product
// ============================================

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTipCheckout } from '@/lib/dodo';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    // Get base URL for return
    const baseUrl = process.env.NEXTAUTH_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';

    // Create tip checkout session (customer picks amount on Dodo checkout, min $2)
    const { checkoutUrl, sessionId } = await createTipCheckout({
      customerEmail: session?.user?.email || 'supporter@riff.im',
      customerName: session?.user?.name || 'Riff Supporter',
      userId: session?.user?.id, // Attribute to user if logged in
      returnUrl: `${baseUrl}/editor?tip=success`,
    });

    return NextResponse.json({
      checkoutUrl,
      sessionId,
    });
  } catch (error) {
    console.error('Error creating tip checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create tip checkout', details: String(error) },
      { status: 500 }
    );
  }
}
