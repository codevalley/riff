// ============================================
// VIBE SLIDES - Zustand Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Deck, ParsedDeck, ThemeConfig, SlideRenderMode, ImageStyleId } from './types';
import { countReveals } from './parser';

// Helper to get initial imageStyle from localStorage (for SSR safety)
const getInitialImageStyle = (): ImageStyleId => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vibe-slides-image-style');
    if (saved) return saved as ImageStyleId;
  }
  return 'none';
};

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
    renderMode: 'standard' as SlideRenderMode,
  },

  currentTheme: null,
  themePrompt: '',

  // Custom system prompts (hydrated from localStorage)
  customThemeSystemPrompt: null,
  customSlideSystemPrompt: null,

  imageStyle: 'none' as ImageStyleId, // Will be hydrated from localStorage
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

  setImageStyle: (style) => {
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe-slides-image-style', style);
    }
    set({ imageStyle: style });
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
  toggleRenderMode: () =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        renderMode: state.presentation.renderMode === 'standard' ? 'generated' : 'standard',
      },
    })),
  setRenderMode: (mode: SlideRenderMode) =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        renderMode: mode,
      },
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
