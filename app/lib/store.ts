// ============================================
// VIBE SLIDES - Zustand Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Deck, ParsedDeck, ThemeConfig } from './types';
import { countReveals } from './parser';

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  decks: [],
  currentDeckId: null,
  currentDeckContent: '',
  parsedDeck: null,

  presentation: {
    currentSlide: 0,
    currentReveal: 0,
    isFullscreen: false,
    showSpeakerNotes: false,
  },

  currentTheme: null,
  themePrompt: '',

  // Custom system prompts (hydrated from localStorage)
  customThemeSystemPrompt: null,
  customSlideSystemPrompt: null,

  imageCache: {},
  generatingImages: new Set(),

  slideHtmlCache: {},
  generatingSlides: new Set(),

  isEditorOpen: true,
  isLoading: false,
  error: null,

  // Deck actions
  setDecks: (decks) => set({ decks }),

  setCurrentDeck: (id, content) =>
    set({
      currentDeckId: id,
      currentDeckContent: content,
      presentation: { ...get().presentation, currentSlide: 0, currentReveal: 0 },
    }),

  setParsedDeck: (deck, forceReplaceManifest = false) => {
    if (!deck) {
      set({ parsedDeck: deck });
      return;
    }

    const { presentation, parsedDeck: existingDeck } = get();
    const maxSlideIndex = deck.slides.length - 1;

    // Determine which imageManifest to use:
    // - If forceReplaceManifest is true (loading a new deck), use the provided manifest
    // - Otherwise, preserve existing manifest if the new one is empty
    //   (this handles re-parsing during editing where v3 parser returns empty manifest)
    let finalImageManifest = deck.imageManifest || {};

    if (!forceReplaceManifest) {
      const newManifestIsEmpty = Object.keys(finalImageManifest).length === 0;
      const existingManifestHasData = existingDeck?.imageManifest && Object.keys(existingDeck.imageManifest).length > 0;

      if (newManifestIsEmpty && existingManifestHasData) {
        finalImageManifest = existingDeck.imageManifest;
      }
    }

    // Clamp currentSlide if it's now out of bounds (e.g., slides were deleted)
    const newCurrentSlide = Math.min(presentation.currentSlide, Math.max(0, maxSlideIndex));

    set({
      parsedDeck: {
        ...deck,
        imageManifest: finalImageManifest,
      },
      presentation: {
        ...presentation,
        currentSlide: newCurrentSlide,
        // Also reset reveal if we changed slides
        currentReveal: newCurrentSlide !== presentation.currentSlide ? 0 : presentation.currentReveal,
      },
    });
  },

  updateDeckContent: (content) => set({ currentDeckContent: content }),

  // Navigation actions
  nextSlide: () => {
    const { parsedDeck, presentation } = get();
    if (!parsedDeck) return;

    const currentSlide = parsedDeck.slides[presentation.currentSlide];
    const maxReveals = currentSlide ? countReveals(currentSlide) - 1 : 0;

    // If there are more reveals in current slide, advance reveal
    if (presentation.currentReveal < maxReveals) {
      set({
        presentation: {
          ...presentation,
          currentReveal: presentation.currentReveal + 1,
        },
      });
    } else if (presentation.currentSlide < parsedDeck.slides.length - 1) {
      // Otherwise go to next slide
      set({
        presentation: {
          ...presentation,
          currentSlide: presentation.currentSlide + 1,
          currentReveal: 0,
        },
      });
    }
  },

  prevSlide: () => {
    const { parsedDeck, presentation } = get();
    if (!parsedDeck) return;

    // If there are reveals shown, go back one reveal
    if (presentation.currentReveal > 0) {
      set({
        presentation: {
          ...presentation,
          currentReveal: presentation.currentReveal - 1,
        },
      });
    } else if (presentation.currentSlide > 0) {
      // Go to previous slide, show all reveals
      const prevSlide = parsedDeck.slides[presentation.currentSlide - 1];
      const maxReveals = prevSlide ? countReveals(prevSlide) - 1 : 0;
      set({
        presentation: {
          ...presentation,
          currentSlide: presentation.currentSlide - 1,
          currentReveal: maxReveals,
        },
      });
    }
  },

  nextReveal: () => {
    const { parsedDeck, presentation } = get();
    if (!parsedDeck) return;

    const currentSlide = parsedDeck.slides[presentation.currentSlide];
    const maxReveals = currentSlide ? countReveals(currentSlide) - 1 : 0;

    if (presentation.currentReveal < maxReveals) {
      set({
        presentation: {
          ...presentation,
          currentReveal: presentation.currentReveal + 1,
        },
      });
    }
  },

  goToSlide: (index) => {
    const { parsedDeck } = get();
    if (!parsedDeck || index < 0 || index >= parsedDeck.slides.length) return;

    set({
      presentation: {
        ...get().presentation,
        currentSlide: index,
        currentReveal: 0,
      },
    });
  },

  // Theme actions
  setTheme: (theme) => set({ currentTheme: theme }),
  setThemePrompt: (prompt) => set({ themePrompt: prompt }),

  // Custom system prompt actions
  setCustomThemeSystemPrompt: (prompt) => {
    if (typeof window !== 'undefined') {
      if (prompt) {
        localStorage.setItem('vibe-slides-theme-system-prompt', prompt);
      } else {
        localStorage.removeItem('vibe-slides-theme-system-prompt');
      }
    }
    set({ customThemeSystemPrompt: prompt });
  },
  setCustomSlideSystemPrompt: (prompt) => {
    if (typeof window !== 'undefined') {
      if (prompt) {
        localStorage.setItem('vibe-slides-slide-system-prompt', prompt);
      } else {
        localStorage.removeItem('vibe-slides-slide-system-prompt');
      }
    }
    set({ customSlideSystemPrompt: prompt });
  },

  // Image cache actions
  cacheImage: (description, url) =>
    set((state) => ({
      imageCache: { ...state.imageCache, [description]: url },
    })),

  setGeneratingImage: (description, generating) =>
    set((state) => {
      const newSet = new Set(state.generatingImages);
      if (generating) {
        newSet.add(description);
      } else {
        newSet.delete(description);
      }
      return { generatingImages: newSet };
    }),

  // Update a single manifest entry - uses get() to avoid stale closure issues
  // This is critical for sweep generation where many images are saved in sequence
  updateManifestEntry: (description, entry) => {
    const { parsedDeck } = get();
    if (!parsedDeck) return;

    set({
      parsedDeck: {
        ...parsedDeck,
        imageManifest: {
          ...parsedDeck.imageManifest,
          [description]: entry,
        },
      },
    });
  },

  // Batch update multiple manifest entries in a SINGLE set() call
  // Critical for batch saves - avoids race conditions between multiple set() calls
  batchUpdateManifestEntries: (entries) => {
    const { parsedDeck } = get();
    if (!parsedDeck) return;

    // Merge all entries into the manifest in one operation
    const updatedManifest = { ...parsedDeck.imageManifest };
    Object.entries(entries).forEach(([description, entry]) => {
      updatedManifest[description] = entry;
    });

    set({
      parsedDeck: {
        ...parsedDeck,
        imageManifest: updatedManifest,
      },
    });
  },

  // Slide HTML cache actions
  cacheSlideHtml: (key, html) =>
    set((state) => ({
      slideHtmlCache: { ...state.slideHtmlCache, [key]: html },
    })),

  getSlideHtml: (key) => get().slideHtmlCache[key],

  setGeneratingSlide: (key, generating) =>
    set((state) => {
      const newSet = new Set(state.generatingSlides);
      if (generating) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return { generatingSlides: newSet };
    }),

  isSlideGenerating: (key) => get().generatingSlides.has(key),

  // UI actions
  toggleEditor: () => set((state) => ({ isEditorOpen: !state.isEditorOpen })),
  toggleSpeakerNotes: () =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        showSpeakerNotes: !state.presentation.showSpeakerNotes,
      },
    })),
  toggleFullscreen: () =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        isFullscreen: !state.presentation.isFullscreen,
      },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
