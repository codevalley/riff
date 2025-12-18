// ============================================
// RIFF - Credits Configuration
// Shared constants safe for client-side import
// ============================================

// Credit costs for different actions
export const CREDIT_COSTS = {
  IMAGE_GENERATION: 1,
  IMAGE_RESTYLE: 1,
  DOCUMENT_CONVERSION: 2,  // Premium model for deck generation
  DECK_REVAMP: 1,
  THEME_GENERATION: 0.2,
} as const;

// ============================================
// Pricing Model (single source of truth)
// ============================================
// - Dodo product is priced at $1 (fixed)
// - User purchases in whole dollar amounts
// - Credits received = dollars × CREDITS_PER_DOLLAR

// How many credits per $1
export const CREDITS_PER_DOLLAR = 20;

// Minimum purchase in dollars
export const MIN_PURCHASE_DOLLARS = 1;

// Initial credits for new users (server-side only reads env var)
export const DEFAULT_INITIAL_FREE_CREDITS = 50;

// Helper: Calculate credits from dollars
export function dollarsToCredits(dollars: number): number {
  return dollars * CREDITS_PER_DOLLAR;
}

// Helper: Calculate dollars from credits (for display)
export function creditsToDollars(credits: number): number {
  return credits / CREDITS_PER_DOLLAR;
}
