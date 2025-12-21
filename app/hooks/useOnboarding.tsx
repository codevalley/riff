// ============================================
// RIFF - useOnboarding Hook
// Onboarding state management with backend sync
// ============================================

'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  useRef,
} from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  OnboardingStep,
  OnboardingStepId,
  FeatureKey,
  ONBOARDING_STEPS,
  getFirstVisitSteps,
  getFeatureStep,
  getTourSteps,
} from '@/lib/onboarding-config';

// ============================================
// Types
// ============================================

interface OnboardingState {
  completedSteps: string[];
  skippedAll: boolean;
  lastCompletedAt?: string;
}

interface ActiveTour {
  id: string;
  currentIndex: number;
  steps: OnboardingStep[];
}

interface OnboardingContextType {
  // State
  completedSteps: Set<OnboardingStepId>;
  skippedAll: boolean;
  isLoading: boolean;
  activeStep: OnboardingStep | null;
  activeTour: ActiveTour | null;

  // Actions
  triggerStep: (stepId: OnboardingStepId) => void;
  completeStep: (stepId: OnboardingStepId) => void;
  skipAll: () => void;
  resetOnboarding: () => void;
  recordFeatureUse: (featureKey: FeatureKey) => void;
  dismissActiveStep: () => void;

  // Tour navigation
  nextTourStep: () => void;
  exitTour: () => void;

  // Computed
  isStepCompleted: (stepId: OnboardingStepId) => boolean;
  shouldShowStep: (stepId: OnboardingStepId) => boolean;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'riff-onboarding-state';

const DEFAULT_STATE: OnboardingState = {
  completedSteps: [],
  skippedAll: false,
};

// ============================================
// Context
// ============================================

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// ============================================
// Provider
// ============================================

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Core state
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStepId>>(new Set());
  const [skippedAll, setSkippedAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<OnboardingStep | null>(null);
  const [activeTour, setActiveTour] = useState<ActiveTour | null>(null);

  // Track recorded features to prevent duplicate triggers
  const recordedFeatures = useRef<Set<string>>(new Set());

  // Track visited routes for first-visit triggers
  const visitedRoutes = useRef<Set<string>>(new Set());

  // ============================================
  // State Loading & Syncing
  // ============================================

  /**
   * Load state from localStorage (guest fallback)
   */
  const loadFromLocalStorage = useCallback((): OnboardingState => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as OnboardingState;
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_STATE;
  }, []);

  /**
   * Save state to localStorage
   */
  const saveToLocalStorage = useCallback((state: OnboardingState) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, []);

  /**
   * Fetch state from API (authenticated users)
   */
  const fetchFromAPI = useCallback(async (): Promise<OnboardingState | null> => {
    try {
      const res = await fetch('/api/user/onboarding');
      if (!res.ok) return null;
      const data = await res.json();
      return data.state as OnboardingState;
    } catch {
      return null;
    }
  }, []);

  /**
   * Sync state to API (authenticated users)
   */
  const syncToAPI = useCallback(async (updates: Partial<OnboardingState>) => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // Silently fail - localStorage is our fallback
    }
  }, []);

  /**
   * Apply state from loaded data
   */
  const applyState = useCallback((state: OnboardingState) => {
    setCompletedSteps(new Set(state.completedSteps as OnboardingStepId[]));
    setSkippedAll(state.skippedAll);
  }, []);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    async function loadState() {
      // Wait for session to be determined
      if (status === 'loading') return;

      setIsLoading(true);

      if (session?.user) {
        // Authenticated: try API first, fall back to localStorage
        const apiState = await fetchFromAPI();
        if (apiState) {
          applyState(apiState);
          // Also sync to localStorage for offline access
          saveToLocalStorage(apiState);
        } else {
          // Fall back to localStorage
          const localState = loadFromLocalStorage();
          applyState(localState);
        }
      } else {
        // Guest: use localStorage only
        const localState = loadFromLocalStorage();
        applyState(localState);
      }

      setIsLoading(false);
    }

    loadState();
  }, [session, status, fetchFromAPI, loadFromLocalStorage, saveToLocalStorage, applyState]);

  /**
   * Persist state changes
   */
  const persistState = useCallback(
    async (newCompletedSteps: Set<OnboardingStepId>, newSkippedAll: boolean) => {
      const state: OnboardingState = {
        completedSteps: Array.from(newCompletedSteps),
        skippedAll: newSkippedAll,
        lastCompletedAt: new Date().toISOString(),
      };

      // Always save to localStorage
      saveToLocalStorage(state);

      // Sync to API if authenticated
      if (session?.user) {
        await syncToAPI(state);
      }
    },
    [session, saveToLocalStorage, syncToAPI]
  );

  // ============================================
  // Actions
  // ============================================

  /**
   * Trigger a specific step to show
   */
  const triggerStep = useCallback(
    (stepId: OnboardingStepId) => {
      if (skippedAll) return;
      if (completedSteps.has(stepId)) return;

      const step = ONBOARDING_STEPS[stepId];
      if (!step) return;

      // If it's a tour step, start the tour
      if (step.tourId) {
        const tourSteps = getTourSteps(step.tourId);
        if (tourSteps.length > 0) {
          setActiveTour({
            id: step.tourId,
            currentIndex: 0,
            steps: tourSteps,
          });
          setActiveStep(tourSteps[0]);
        }
      } else {
        setActiveStep(step);
      }
    },
    [skippedAll, completedSteps]
  );

  /**
   * Complete a step (mark as done)
   */
  const completeStep = useCallback(
    async (stepId: OnboardingStepId) => {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(stepId);
      setCompletedSteps(newCompleted);
      await persistState(newCompleted, skippedAll);
    },
    [completedSteps, skippedAll, persistState]
  );

  /**
   * Dismiss the active step (complete it and close)
   */
  const dismissActiveStep = useCallback(async () => {
    if (activeStep) {
      await completeStep(activeStep.id);
    }
    setActiveStep(null);
    setActiveTour(null);
  }, [activeStep, completeStep]);

  /**
   * Skip all tutorials
   */
  const skipAll = useCallback(async () => {
    setSkippedAll(true);
    setActiveStep(null);
    setActiveTour(null);
    await persistState(completedSteps, true);
  }, [completedSteps, persistState]);

  /**
   * Reset onboarding (show tutorials again)
   */
  const resetOnboarding = useCallback(async () => {
    setCompletedSteps(new Set());
    setSkippedAll(false);
    visitedRoutes.current.clear();
    recordedFeatures.current.clear();

    const state = DEFAULT_STATE;
    saveToLocalStorage(state);

    if (session?.user) {
      try {
        await fetch('/api/user/onboarding', { method: 'DELETE' });
      } catch {
        // Silently fail
      }
    }

    // Immediately start the editor intro tour after reset
    const welcomeStep = ONBOARDING_STEPS['welcome-editor'];
    if (welcomeStep && welcomeStep.tourId) {
      const tourSteps = getTourSteps(welcomeStep.tourId);
      if (tourSteps.length > 0) {
        setActiveTour({
          id: welcomeStep.tourId,
          currentIndex: 0,
          steps: tourSteps,
        });
        setActiveStep(tourSteps[0]);
      }
    } else if (welcomeStep) {
      setActiveStep(welcomeStep);
    }
  }, [session, saveToLocalStorage]);

  /**
   * Record first use of a feature (triggers feature-based onboarding)
   */
  const recordFeatureUse = useCallback(
    (featureKey: FeatureKey) => {
      if (skippedAll) return;
      if (recordedFeatures.current.has(featureKey)) return;

      recordedFeatures.current.add(featureKey);

      const step = getFeatureStep(featureKey);
      if (step && !completedSteps.has(step.id)) {
        triggerStep(step.id);
      }
    },
    [skippedAll, completedSteps, triggerStep]
  );

  // ============================================
  // Tour Navigation
  // ============================================

  /**
   * Move to next step in tour
   */
  const nextTourStep = useCallback(async () => {
    if (!activeTour || !activeStep) return;

    // Complete current step
    await completeStep(activeStep.id);

    const nextIndex = activeTour.currentIndex + 1;

    if (nextIndex < activeTour.steps.length) {
      // Move to next step
      setActiveTour({
        ...activeTour,
        currentIndex: nextIndex,
      });
      setActiveStep(activeTour.steps[nextIndex]);
    } else {
      // Tour complete
      setActiveTour(null);
      setActiveStep(null);
    }
  }, [activeTour, activeStep, completeStep]);

  /**
   * Exit tour early (skip remaining steps)
   */
  const exitTour = useCallback(async () => {
    if (!activeTour) return;

    // Complete current step before exiting
    if (activeStep) {
      await completeStep(activeStep.id);
    }

    setActiveTour(null);
    setActiveStep(null);
  }, [activeTour, activeStep, completeStep]);

  // ============================================
  // First-Visit Triggers
  // ============================================

  useEffect(() => {
    if (isLoading || skippedAll) return;
    if (!pathname) return;

    // Check if this is first visit to this route
    if (visitedRoutes.current.has(pathname)) return;
    visitedRoutes.current.add(pathname);

    // Find steps that trigger on first visit to this route
    const stepsForRoute = getFirstVisitSteps(pathname);
    const uncompletedSteps = stepsForRoute.filter(
      (step) => !completedSteps.has(step.id)
    );

    if (uncompletedSteps.length > 0) {
      // Prioritize standalone dialogs over tour steps
      const standaloneDialog = uncompletedSteps.find(
        (s) => s.type === 'dialog' && !s.tourId
      );

      if (standaloneDialog) {
        triggerStep(standaloneDialog.id);
      } else {
        // Start with first uncompleted step
        triggerStep(uncompletedSteps[0].id);
      }
    }
  }, [pathname, isLoading, skippedAll, completedSteps, triggerStep]);

  // ============================================
  // Computed Values
  // ============================================

  const isStepCompleted = useCallback(
    (stepId: OnboardingStepId) => completedSteps.has(stepId),
    [completedSteps]
  );

  const shouldShowStep = useCallback(
    (stepId: OnboardingStepId) => !skippedAll && !completedSteps.has(stepId),
    [skippedAll, completedSteps]
  );

  // ============================================
  // Context Value
  // ============================================

  const value: OnboardingContextType = {
    // State
    completedSteps,
    skippedAll,
    isLoading,
    activeStep,
    activeTour,

    // Actions
    triggerStep,
    completeStep,
    skipAll,
    resetOnboarding,
    recordFeatureUse,
    dismissActiveStep,

    // Tour navigation
    nextTourStep,
    exitTour,

    // Computed
    isStepCompleted,
    shouldShowStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
