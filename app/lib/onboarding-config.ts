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
  // Image tour
  | 'image-intro-generate'
  | 'image-intro-styles'
  | 'image-intro-restyle'
  | 'image-intro-library'
  | 'image-intro-credits'
  // Publishing tour
  | 'publish-intro'
  | 'publish-export'
  | 'publish-web'
  | 'publish-embed'
  | 'publish-social'
  // Credits tour
  | 'credits-intro-philosophy'
  | 'credits-intro-never-expire'
  | 'credits-intro-what-costs'
  | 'credits-intro-transparency'
  | 'credits-intro-trust'
  // Feature-triggered (standalone)
  | 'theme-customization'
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
  | 'sharing-click'      // Export or Publish button
  | 'credits-click'      // Credits display or ledger modal
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
   * Image Tour - Step 1: One-click generation
   */
  'image-intro-generate': {
    id: 'image-intro-generate',
    type: 'tour-step',
    tourId: 'image-intro',
    tourOrder: 0,
    title: 'One-Click Images',
    description: 'Click `Generate` on any image placeholder. Describe what you want and Riff creates it instantly.',
    trigger: 'first-feature-use',
    featureKey: 'image-placeholder-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Image Tour - Step 2: Styles & Scene Context
   */
  'image-intro-styles': {
    id: 'image-intro-styles',
    type: 'tour-step',
    tourId: 'image-intro',
    tourOrder: 1,
    title: 'Visual Consistency',
    description: 'Set a `Scene context` to describe your global visual elements (e.g., "trip to Turkey"). Choose a `Style` preset for the aesthetic for an individual image.',
    trigger: 'first-feature-use',
    featureKey: 'image-placeholder-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Image Tour - Step 3: Restyle & Tweak
   */
  'image-intro-restyle': {
    id: 'image-intro-restyle',
    type: 'tour-step',
    tourId: 'image-intro',
    tourOrder: 2,
    title: 'Restyle Any Image',
    description: 'Already have an image? Click `Restyle` to transform it with a new style or custom prompt.',
    trigger: 'first-feature-use',
    featureKey: 'image-placeholder-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Image Tour - Step 4: Library & Upload
   */
  'image-intro-library': {
    id: 'image-intro-library',
    type: 'tour-step',
    tourId: 'image-intro',
    tourOrder: 3,
    title: 'Upload or Reuse',
    description: 'Upload your own images or pick from your deck\'s library. Every image you create is saved for reuse.',
    trigger: 'first-feature-use',
    featureKey: 'image-placeholder-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Image Tour - Step 5: Credits & Timing
   */
  'image-intro-credits': {
    id: 'image-intro-credits',
    type: 'tour-step',
    tourId: 'image-intro',
    tourOrder: 4,
    title: 'Quality Takes Time',
    description: 'Riff uses state-of-the-art models for stunning results. Generation takes 30-60 seconds and costs credits.',
    trigger: 'first-feature-use',
    featureKey: 'image-placeholder-click',
    primaryAction: { label: 'Got it', action: 'dismiss' },
  },

  /**
   * Theme customization - First theme panel open
   */
  'theme-customization': {
    id: 'theme-customization',
    type: 'dialog',
    title: 'Design Your Theme',
    description: 'Describe any mood or aesthetic. Riff creates matching colors, fonts, and spacing automatically.',
    trigger: 'first-feature-use',
    featureKey: 'theme-panel-open',
    primaryAction: { label: 'Got it', action: 'dismiss' },
  },

  /**
   * Publishing Tour - Step 1: Introduction
   */
  'publish-intro': {
    id: 'publish-intro',
    type: 'tour-step',
    tourId: 'publishing',
    tourOrder: 0,
    title: 'Share Your Creation',
    description: 'Your presentation is ready for the world. Download it, publish online, embed anywhere, or share on social media.',
    trigger: 'first-feature-use',
    featureKey: 'sharing-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Publishing Tour - Step 2: Export Options
   */
  'publish-export': {
    id: 'publish-export',
    type: 'tour-step',
    tourId: 'publishing',
    tourOrder: 1,
    title: 'Export & Download',
    description: 'Download as `.riff` for full backup, `PDF` for universal viewing, or `PowerPoint` for editing in other tools.',
    trigger: 'first-feature-use',
    featureKey: 'sharing-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Publishing Tour - Step 3: Publish to Web
   */
  'publish-web': {
    id: 'publish-web',
    type: 'tour-step',
    tourId: 'publishing',
    tourOrder: 2,
    title: 'Publish to the Web',
    description: 'One click generates a shareable link. Works in any browser, no login required. Track `views` and engagement.',
    trigger: 'first-feature-use',
    featureKey: 'sharing-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Publishing Tour - Step 4: Embed Anywhere
   */
  'publish-embed': {
    id: 'publish-embed',
    type: 'tour-step',
    tourId: 'publishing',
    tourOrder: 3,
    title: 'Embed Anywhere',
    description: 'Copy the embed code to add your presentation to Notion, Medium, personal blogs, or any website.',
    trigger: 'first-feature-use',
    featureKey: 'sharing-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Publishing Tour - Step 5: Social Sharing
   */
  'publish-social': {
    id: 'publish-social',
    type: 'tour-step',
    tourId: 'publishing',
    tourOrder: 4,
    title: 'Share on Social',
    description: 'Share your link on Twitter, LinkedIn, or anywhere. Riff generates beautiful preview cards automatically.',
    trigger: 'first-feature-use',
    featureKey: 'sharing-click',
    primaryAction: { label: 'Got it', action: 'dismiss' },
  },

  /**
   * Credits Tour - Step 1: Philosophy
   */
  'credits-intro-philosophy': {
    id: 'credits-intro-philosophy',
    type: 'tour-step',
    tourId: 'credits-intro',
    tourOrder: 0,
    title: 'Pay for What You Use',
    description: 'No subscriptions. No monthly fees. You only pay when you use features that cost us compute—like image generation.',
    trigger: 'first-feature-use',
    featureKey: 'credits-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Credits Tour - Step 2: Never Expire
   */
  'credits-intro-never-expire': {
    id: 'credits-intro-never-expire',
    type: 'tour-step',
    tourId: 'credits-intro',
    tourOrder: 1,
    title: 'Credits Never Expire',
    description: 'Buy credits once, use them whenever. No pressure to "use it or lose it." We\'d rather you buy less and trust us more.',
    trigger: 'first-feature-use',
    featureKey: 'credits-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Credits Tour - Step 3: What Uses Credits
   */
  'credits-intro-what-costs': {
    id: 'credits-intro-what-costs',
    type: 'tour-step',
    tourId: 'credits-intro',
    tourOrder: 2,
    title: 'What Uses Credits',
    description: 'Image generation, theme creation, and deck revamps cost credits. Editing, exporting, and everything else is free.',
    trigger: 'first-feature-use',
    featureKey: 'credits-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Credits Tour - Step 4: Transparent Pricing
   */
  'credits-intro-transparency': {
    id: 'credits-intro-transparency',
    type: 'tour-step',
    tourId: 'credits-intro',
    tourOrder: 3,
    title: 'Transparent Pricing',
    description: 'We show our actual costs: model fees, infrastructure, margin. No hidden markups. `$1` gets you `4` images.',
    trigger: 'first-feature-use',
    featureKey: 'credits-click',
    primaryAction: { label: 'Next', action: 'next' },
    secondaryAction: { label: 'Skip tour', action: 'skip-all' },
  },

  /**
   * Credits Tour - Step 5: Our Promise
   */
  'credits-intro-trust': {
    id: 'credits-intro-trust',
    type: 'tour-step',
    tourId: 'credits-intro',
    tourOrder: 4,
    title: 'Our Promise',
    description: 'No countdown timers. No "limited offers." Your work exports as markdown—take it anywhere. We earn your return visits.',
    trigger: 'first-feature-use',
    featureKey: 'credits-click',
    primaryAction: { label: 'Got it', action: 'dismiss' },
  },

  /**
   * Pricing philosophy - First credit spend (standalone)
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
