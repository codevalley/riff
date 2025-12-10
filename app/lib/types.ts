// ============================================
// VIBE SLIDES - Type Definitions
// ============================================

export interface Deck {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  slideCount?: number;
}

export interface Slide {
  id: number;
  elements: SlideElement[];
  speakerNotes: string;
  section?: string;
  imageDescriptions: string[];
}

export type SlideElementType =
  | 'title'
  | 'subtitle'
  | 'text'
  | 'image'
  | 'pause'
  | 'code'
  | 'quote'
  | 'highlight';

export interface SlideElement {
  type: SlideElementType;
  content: string;
  revealOrder: number; // 0 = immediate, 1+ = after N pauses
  metadata?: {
    language?: string; // for code blocks
    imageUrl?: string; // cached image URL
    imageStatus?: 'pending' | 'generating' | 'ready' | 'error';
  };
}

export interface ParsedDeck {
  slides: Slide[];
  metadata: DeckMetadata;
}

export interface DeckMetadata {
  title?: string;
  totalSlides: number;
  sections: string[];
  imageCount: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  prompt?: string; // The natural language prompt that generated this
  css: string; // Generated CSS variables
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
}

export interface ImageGenerationRequest {
  description: string;
  deckId: string;
  slideIndex: number;
  style?: string; // Image generation style prompt modifier
  forceRegenerate?: boolean;
}

export interface ImageGenerationResponse {
  url: string;
  cached: boolean;
  description: string;
}

export interface ThemeGenerationRequest {
  prompt: string;
  baseTheme?: 'dark' | 'light';
}

export interface PresentationState {
  currentSlide: number;
  currentReveal: number; // Which pause we're at within the slide
  isFullscreen: boolean;
  showSpeakerNotes: boolean;
}

// Store types for Zustand
export interface AppState {
  // Deck management
  decks: Deck[];
  currentDeckId: string | null;
  currentDeckContent: string;
  parsedDeck: ParsedDeck | null;

  // Presentation state
  presentation: PresentationState;

  // Theme
  currentTheme: ThemeConfig | null;
  themePrompt: string;

  // Image generation
  imageCache: Record<string, string>; // description hash -> URL
  generatingImages: Set<string>;

  // UI state
  isEditorOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDecks: (decks: Deck[]) => void;
  setCurrentDeck: (id: string, content: string) => void;
  setParsedDeck: (deck: ParsedDeck) => void;
  updateDeckContent: (content: string) => void;

  nextSlide: () => void;
  prevSlide: () => void;
  nextReveal: () => void;
  goToSlide: (index: number) => void;

  setTheme: (theme: ThemeConfig) => void;
  setThemePrompt: (prompt: string) => void;

  cacheImage: (description: string, url: string) => void;
  setGeneratingImage: (description: string, generating: boolean) => void;

  toggleEditor: () => void;
  toggleSpeakerNotes: () => void;
  toggleFullscreen: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
