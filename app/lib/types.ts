// ============================================
// VIBE SLIDES - Type Definitions
// ============================================

// Image style presets for generation
export type ImageStyleId =
  | 'modern'
  | 'newspaper'
  | 'voxel'
  | 'retro'
  | 'mono-manga'
  | 'cyberpunk'
  | 'minimal'
  | 'none';

export interface ImageStylePreset {
  id: ImageStyleId;
  name: string;
  description: string;
  promptTemplate: string; // Template with {description} placeholder
}

export const IMAGE_STYLE_PRESETS: ImageStylePreset[] = [
  {
    id: 'none',
    name: 'Default',
    description: 'Clean, professional presentation style',
    promptTemplate: '{description}. Style: professional, high-quality, presentation-style. Create a clean, visually striking image suitable for a presentation slide. Aspect ratio 16:9.',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Mid-Century Modern UPA style with geometric abstraction',
    promptTemplate: 'Create a Mid-Century Modern UPA style cartoon depicting {description}. Use geometric abstraction, off-register color blocks, and a flat graphic design aesthetic. The perspective should be flattened using a retro palette of mustard yellow, teal, and charcoal gray in a wide 16:9 aspect ratio.',
  },
  {
    id: 'newspaper',
    name: 'Editorial',
    description: 'Satirical editorial caricature with cross-hatching',
    promptTemplate: 'Create a satirical editorial caricature style drawing of {description}. Use heavily exaggerated features and proportions. Apply cross-hatching ink style typical of political newspaper cartoons, set against a white background in a 16:9 landscape aspect ratio.',
  },
  {
    id: 'voxel',
    name: 'Voxel',
    description: '3D voxel art with isometric perspective',
    promptTemplate: 'Create a voxel art scene depicting {description}. Everything in the image must be constructed entirely out of tiny 3D cubes. The view should be isometric, with vibrant colors and a digital lego-like aesthetic in a 16:9 aspect ratio.',
  },
  {
    id: 'retro',
    name: 'Retro Anime',
    description: '90s anime style with VHS grain effect',
    promptTemplate: 'Create a retro 90s anime style screenshot depicting {description}. Include a subtle VHS film grain effect, hand-painted background textures, and distinct high-contrast white highlights on key elements, using a muted color palette in a 16:9 aspect ratio.',
  },
  {
    id: 'mono-manga',
    name: 'Manga',
    description: 'Monochrome manga panel with screen-tone',
    promptTemplate: 'Create a monochrome manga panel depicting {description}. The image should be strictly black and white ink, utilizing screen-tone dots for shading and gradients. Include dramatic speed lines or effects where appropriate to convey energy in a 16:9 aspect ratio.',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic mecha style with neon accents',
    promptTemplate: 'Create a detailed cyberpunk/mecha style illustration of {description}. Focus on intricate mechanical details, metallic textures, and technological elements. Add glowing neon accents in cyan and magenta, with lens flares to give it a futuristic, high-tech look in a 16:9 aspect ratio.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean line art with limited color palette',
    promptTemplate: 'Create a minimal, clean illustration of {description}. Use simple line art with a very limited color palette of 2-3 colors maximum. The style should be modern, geometric, and suitable for a professional presentation with lots of white space in a 16:9 aspect ratio.',
  },
];

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
  isSection?: boolean; // Section header slide with special styling
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

export type SlideRenderMode = 'standard' | 'generated';

export interface PresentationState {
  currentSlide: number;
  currentReveal: number; // Which pause we're at within the slide
  isFullscreen: boolean;
  showSpeakerNotes: boolean;
  renderMode: SlideRenderMode; // Toggle between standard parser and LLM-generated HTML
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

  // Custom system prompts (user can edit these)
  customThemeSystemPrompt: string | null; // null = use default
  customSlideSystemPrompt: string | null; // null = use default

  // Image generation
  imageStyle: ImageStyleId;
  imageCache: Record<string, string>; // description hash -> URL
  generatingImages: Set<string>;

  // Generated slide HTML cache (in-memory for fast access)
  slideHtmlCache: Record<string, string>; // "deckId-slideIndex-contentHash" -> HTML
  generatingSlides: Set<string>; // Currently generating slides

  // UI state
  isEditorOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDecks: (decks: Deck[]) => void;
  setCurrentDeck: (id: string, content: string) => void;
  setParsedDeck: (deck: ParsedDeck | null) => void;
  updateDeckContent: (content: string) => void;

  nextSlide: () => void;
  prevSlide: () => void;
  nextReveal: () => void;
  goToSlide: (index: number) => void;

  setTheme: (theme: ThemeConfig | null) => void;
  setThemePrompt: (prompt: string) => void;
  setCustomThemeSystemPrompt: (prompt: string | null) => void;
  setCustomSlideSystemPrompt: (prompt: string | null) => void;

  cacheImage: (description: string, url: string) => void;
  setGeneratingImage: (description: string, generating: boolean) => void;
  setImageStyle: (style: ImageStyleId) => void;

  // Slide HTML cache actions
  cacheSlideHtml: (key: string, html: string) => void;
  getSlideHtml: (key: string) => string | undefined;
  setGeneratingSlide: (key: string, generating: boolean) => void;
  isSlideGenerating: (key: string) => boolean;

  toggleEditor: () => void;
  toggleSpeakerNotes: () => void;
  toggleFullscreen: () => void;
  toggleRenderMode: () => void;
  setRenderMode: (mode: SlideRenderMode) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
