// ============================================
// Onboarding Configuration
// Type-safe definitions for all onboarding steps
// ============================================

import { ComponentType } from 'react';

// ============================================
// Types
// ============================================

/**
 * Unique identifier for each onboarding step
 */
export type OnboardingStepId =
  | 'welcome-editor'
  | 'markdown-intro'
  | 'slash-commands'
  | 'image-generation'
  | 'theme-customization'
  | 'publishing'
  | 'pricing-philosophy';

/**
 * How the step is triggered
 */
export type OnboardingTrigger =
  | 'first-visit'       // First time on route
  | 'first-feature-use' // First interaction with feature
  | 'manual';           // Help menu only

/**
 * Display type for the step
 */
export type OnboardingType =
  | 'dialog'     // Full modal dialog
  | 'tooltip'    // Small contextual hint
  | 'tour-step'; // Part of multi-step tour

/**
 * Action button configuration
 */
export interface OnboardingAction {
  label: string;
  action: 'dismiss' | 'next' | 'skip-all';
}

/**
 * Full step configuration
 */
export interface OnboardingStep {
  id: OnboardingStepId;
  type: OnboardingType;
  title: string;
  description: string;
  illustration?: ComponentType;
  trigger: OnboardingTrigger;
  route?: string;         // For 'first-visit' trigger
  featureKey?: string;    // For 'first-feature-use' trigger
  tourId?: string;        // Group steps into tours
  tourOrder?: number;     // Order within tour
  primaryAction: OnboardingAction;
  secondaryAction?: OnboardingAction;
}

/**
 * Feature keys for 'first-feature-use' triggers
 */
export type FeatureKey =
  | 'image-placeholder-click'
  | 'theme-panel-open'
  | 'publish-click'
  | 'first-credit-spend';

// ============================================
// Step Definitions
// ============================================

export const ONBOARDING_STEPS: Record<OnboardingStepId, OnboardingStep> = {
  /**
   * Welcome - First step of editor intro tour
   */
  'welcome-editor': {
    id: 'welcome-editor',
    type: 'tour-step',
    title: 'Welcome to Riff',
    description: 'Create beautiful presentations from markdown. Write on the left, see your slides come to life on the right.',
    trigger: 'first-visit',
    route: '/editor',
    tourId: 'editor-intro',
    tourOrder: 0,
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip all tutorials', action: 'skip-all' },
  },

  /**
   * Markdown syntax - Second step of tour
   */
  'markdown-intro': {
    id: 'markdown-intro',
    type: 'tour-step',
    title: 'Write in Markdown',
    description: 'Use `---` to separate slides, `#` for headings, and standard markdown for formatting. Simple text becomes beautiful slides.',
    trigger: 'first-visit',
    route: '/editor',
    tourId: 'editor-intro',
    tourOrder: 1,
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Slash commands - Final step of tour
   */
  'slash-commands': {
    id: 'slash-commands',
    type: 'tour-step',
    title: 'Quick Commands',
    description: 'Type `/` anywhere to insert layouts, images, effects, and more. No syntax to memorize.',
    trigger: 'first-visit',
    route: '/editor',
    tourId: 'editor-intro',
    tourOrder: 2,
    primaryAction: { label: 'Done', action: 'dismiss' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Image generation - First image placeholder click
   */
  'image-generation': {
    id: 'image-generation',
    type: 'tooltip',
    title: 'Generate Any Image',
    description: 'Describe what you want to see. Choose a style for visual consistency across your entire deck.',
    trigger: 'first-feature-use',
    featureKey: 'image-placeholder-click',
    primaryAction: { label: 'Got it', action: 'dismiss' },
  },

  /**
   * Theme customization - First theme panel open
   */
  'theme-customization': {
    id: 'theme-customization',
    type: 'tooltip',
    title: 'Design Your Theme',
    description: 'Describe any mood or aesthetic. Riff creates matching colors, fonts, and spacing automatically.',
    trigger: 'first-feature-use',
    featureKey: 'theme-panel-open',
    primaryAction: { label: 'Got it', action: 'dismiss' },
  },

  /**
   * Publishing - First publish click
   */
  'publishing': {
    id: 'publishing',
    type: 'dialog',
    title: 'Share Your Work',
    description: 'Get a public link, embed on any website, or export as PDF. Your presentation, your way.',
    trigger: 'first-feature-use',
    featureKey: 'publish-click',
    primaryAction: { label: 'Got it', action: 'dismiss' },
  },

  /**
   * Pricing philosophy - First credit spend
   */
  'pricing-philosophy': {
    id: 'pricing-philosophy',
    type: 'dialog',
    title: 'Pay Only for What You Use',
    description: 'No subscriptions, no monthly fees. Credits cover compute costs for image and theme generation. They never expire.',
    trigger: 'first-feature-use',
    featureKey: 'first-credit-spend',
    primaryAction: { label: 'Understood', action: 'dismiss' },
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get all steps for a specific tour
 */
export function getTourSteps(tourId: string): OnboardingStep[] {
  return Object.values(ONBOARDING_STEPS)
    .filter((step) => step.tourId === tourId)
    .sort((a, b) => (a.tourOrder ?? 0) - (b.tourOrder ?? 0));
}

/**
 * Get steps triggered by first visit to a route
 */
export function getFirstVisitSteps(route: string): OnboardingStep[] {
  return Object.values(ONBOARDING_STEPS).filter(
    (step) => step.trigger === 'first-visit' && step.route === route
  );
}

/**
 * Get step triggered by first use of a feature
 */
export function getFeatureStep(featureKey: FeatureKey): OnboardingStep | undefined {
  return Object.values(ONBOARDING_STEPS).find(
    (step) => step.trigger === 'first-feature-use' && step.featureKey === featureKey
  );
}

/**
 * Check if a step should show as a standalone dialog (not part of tour)
 */
export function isStandaloneDialog(step: OnboardingStep): boolean {
  return step.type === 'dialog' && !step.tourId;
}

/**
 * Get the first dialog to show on first editor visit
 */
export function getWelcomeStep(): OnboardingStep {
  return ONBOARDING_STEPS['welcome-editor'];
}

/**
 * All step IDs for type checking
 */
export const ALL_STEP_IDS = Object.keys(ONBOARDING_STEPS) as OnboardingStepId[];
