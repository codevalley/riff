// ============================================
// VIBE SLIDES - Zustand Store
// ============================================

import { create } from 'zustand';
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

  imageCache: {},
  generatingImages: new Set(),

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

  setParsedDeck: (deck) => set({ parsedDeck: deck }),

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
