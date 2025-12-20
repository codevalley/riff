// ============================================
// RIFF - Credits Configuration
// Shared constants safe for client-side import
// ============================================

// Credit costs for different actions
// Pricing: $1 = 20 credits, so 5 credits = $0.25, 1 credit = $0.05
export const CREDIT_COSTS = {
  IMAGE_GENERATION: 5,     // AI image generation (~$0.25)
  IMAGE_RESTYLE: 5,        // AI image restyle (~$0.25)
  DOCUMENT_CONVERSION: 5,  // Premium model for deck generation (~$0.25)
  DECK_REVAMP: 5,          // Premium model for deck revamp (~$0.25)
  THEME_GENERATION: 1,     // Theme generation (~$0.05)
  ADD_SLIDE: 1,            // Single slide generation (~$0.05)
  SLIDE_REVAMP: 1,         // Single slide revamp (~$0.05)
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
