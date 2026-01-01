// ============================================
// Vercel Analytics - Custom Event Tracking
// Centralized tracking utility for user funnel and feature usage
// ============================================

import { track } from '@vercel/analytics';

/**
 * Analytics utility for tracking custom events in Vercel Analytics.
 *
 * Events are organized by category:
 * - Funnel: deck_created, deck_published
 * - Features: image_generated, theme_generated, revamp_used
 * - Monetization: credits_purchased, tip_sent
 * - Sharing: deck_exported
 * - Engagement: slide_viewed, deck_completed
 */
export const analytics = {
  // ============================================
  // Funnel Events
  // ============================================

  /** Track when a user creates a new deck */
  deckCreated: (source: 'scratch' | 'import' | 'content') => {
    track('deck_created', { source });
  },

  /** Track when a user publishes a deck */
  deckPublished: () => {
    track('deck_published');
  },

  // ============================================
  // Feature Usage Events
  // ============================================

  /** Track when a user generates an image */
  imageGenerated: (style?: string) => {
    track('image_generated', style ? { style } : undefined);
  },

  /** Track when a user generates a theme */
  themeGenerated: () => {
    track('theme_generated');
  },

  /** Track when a user uses the revamp feature */
  revampUsed: () => {
    track('revamp_used');
  },

  // ============================================
  // Monetization Events
  // ============================================

  /** Track when a user purchases credits */
  creditsPurchased: (amount: number) => {
    track('credits_purchased', { amount: String(amount) });
  },

  /** Track when a user sends a tip */
  tipSent: () => {
    track('tip_sent');
  },

  // ============================================
  // Sharing Events
  // ============================================

  /** Track when a user exports a deck */
  deckExported: (format: 'pdf' | 'pptx' | 'riff') => {
    track('deck_exported', { format });
  },

  // ============================================
  // Engagement Events (Published Deck Views)
  // ============================================

  /** Track when a viewer navigates to a slide in a published deck */
  slideViewed: (slideIndex: number, totalSlides: number) => {
    track('slide_viewed', {
      slide: String(slideIndex + 1),
      total: String(totalSlides),
    });
  },

  /** Track when a viewer reaches the last slide of a published deck */
  deckCompleted: () => {
    track('deck_completed');
  },
};
