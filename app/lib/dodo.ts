// ============================================
// RIFF - DodoPayments Client
// Handles payment processing for credit purchases
// ============================================

import DodoPayments from 'dodopayments';

// Initialize DodoPayments client
// Uses DODO_PAYMENTS_API_KEY env var by default
// Environment: test_mode for development, live_mode for production
const dodo = new DodoPayments({
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') ||
    (process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode'),
});

// ============================================
// Customer Operations
// ============================================

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
      name: params.name || params.email.split('@')[0], // Name is required, use email prefix as fallback
    });

    return { customerId: customer.customer_id };
  } catch (error) {
    console.error('Error creating Dodo customer:', error);
    // Generate a fallback ID if Dodo fails (we can sync later)
    return { customerId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}` };
  }
}

/**
 * Get customer details
 */
export async function getCustomer(customerId: string) {
  if (customerId.startsWith('local_')) {
    return null; // Local customer, not in Dodo
  }
  return await dodo.customers.retrieve(customerId);
}

// ============================================
// Checkout Operations
// ============================================

/**
 * Create a checkout session for purchasing credits
 * Uses checkoutSessions API (not deprecated payments.create)
 *
 * Pricing model:
 * - Dodo product is priced at $1
 * - quantity = dollarAmount (number of $1 units)
 * - creditAmount is stored in metadata for webhook processing
 */
export async function createCheckoutSession(params: {
  customerId: string;
  customerEmail: string;
  customerName?: string;
  dollarAmount: number;  // Becomes Dodo quantity (product is $1)
  creditAmount: number;  // For metadata - credits to add on success
  successUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const creditsProductId = process.env.DODO_CREDITS_PRODUCT_ID;
  if (!creditsProductId) {
    throw new Error('DODO_CREDITS_PRODUCT_ID environment variable is not configured');
  }

  try {
    // Use checkoutSessions.create (payments.create is deprecated)
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: creditsProductId,
          quantity: params.dollarAmount, // $1 × dollarAmount = total
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
        ...params.metadata,
      },
      customization: {
        theme: 'dark', // Match Riff's dark theme
      },
    });

    return {
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// ============================================
// Webhook Helpers
// ============================================

/**
 * Verify webhook signature
 * Note: Implementation depends on Dodo's specific signature scheme
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');

  // Try different signature formats
  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Check various formats that payment providers use
  if (signature === expectedHmac) return true;
  if (signature === `sha256=${expectedHmac}`) return true;
  if (signature === `v1=${expectedHmac}`) return true;

  return false;
}

/**
 * Parse webhook payload
 */
export interface WebhookPayload {
  type: string;
  data: {
    payment_id?: string;
    status?: string;
    amount?: number;
    metadata?: Record<string, string>;
  };
}

export function parseWebhookPayload(body: string): WebhookPayload | null {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

// ============================================
// Tip/Donation Checkout
// ============================================

/**
 * Create a tip/donation checkout session
 * Uses a special "pay what you want" product for tips
 */
export async function createTipCheckout(params: {
  customerEmail: string;
  customerName?: string;
  userId?: string; // Optional - for attribution if logged in
  returnUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const tipProductId = process.env.DODO_TIP_PRODUCT_ID;
  if (!tipProductId) {
    throw new Error('DODO_TIP_PRODUCT_ID environment variable is not configured');
  }

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: tipProductId,
          quantity: 1,
          // No amount - customer chooses on Dodo's PWYW checkout (min $2)
        },
      ],
      customer: { email: params.customerEmail, name: params.customerName },
      return_url: params.returnUrl,
      metadata: {
        type: 'tip',
        user_id: params.userId || '', // Empty string if anonymous
      },
      customization: {
        theme: 'dark',
      },
    });

    return {
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    };
  } catch (error) {
    console.error('Error creating tip checkout:', error);
    throw new Error('Failed to create tip checkout');
  }
}

// Export the raw client for advanced operations
export { dodo };
