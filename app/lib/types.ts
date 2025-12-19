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
  | 'vector'
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
    promptTemplate: '{description}. Style: professional, high-quality, presentation-style. Create a clean, visually striking image suitable for a presentation slide. No borders or frames. Aspect ratio 16:9.',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Mid-Century Modern UPA style with geometric abstraction',
    promptTemplate: 'Create a Mid-Century Modern UPA style cartoon depicting {description}. Use geometric abstraction, off-register color blocks, and a flat graphic design aesthetic. The perspective should be flattened using a retro palette of mustard yellow, teal, and charcoal gray. No borders or frames. 16:9 aspect ratio.',
  },
  {
    id: 'newspaper',
    name: 'Editorial',
    description: 'Satirical editorial caricature with cross-hatching',
    promptTemplate: 'Create a satirical editorial caricature style drawing of {description}. Use heavily exaggerated features and proportions. Apply cross-hatching ink style typical of political newspaper cartoons. No borders or frames. 16:9 aspect ratio.',
  },
  {
    id: 'voxel',
    name: 'Voxel',
    description: '3D voxel art with isometric perspective',
    promptTemplate: 'Create a voxel art scene depicting {description}. Everything in the image must be constructed entirely out of tiny 3D cubes. The view should be isometric, with vibrant colors and a digital lego-like aesthetic. No borders or frames. 16:9 aspect ratio.',
  },
  {
    id: 'retro',
    name: 'Retro Anime',
    description: '90s anime style with VHS grain effect',
    promptTemplate: 'Create a retro 90s anime style screenshot depicting {description}. Include a subtle VHS film grain effect, hand-painted background textures, and distinct high-contrast white highlights on key elements, using a muted color palette. No borders or frames. 16:9 aspect ratio.',
  },
  {
    id: 'mono-manga',
    name: 'Manga',
    description: 'Monochrome manga panel with screen-tone',
    promptTemplate: 'Create a monochrome manga panel depicting {description}. The image should be strictly black and white ink, utilizing screen-tone dots for shading and gradients. Include dramatic speed lines or effects where appropriate to convey energy. No borders or frames. 16:9 aspect ratio.',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic mecha style with neon accents',
    promptTemplate: 'Create a detailed cyberpunk/mecha style illustration of {description}. Focus on intricate mechanical details, metallic textures, and technological elements. Add glowing neon accents in cyan and magenta, with lens flares to give it a futuristic, high-tech look. No borders or frames. 16:9 aspect ratio.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean line art with limited color palette',
    promptTemplate: 'Create a minimal, clean illustration of {description}. Use simple line art with a very limited color palette of 2-3 colors maximum. The style should be modern, geometric, and suitable for a professional presentation with lots of white space. No borders or frames. 16:9 aspect ratio.',
  },
  {
    id: 'vector',
    name: 'Vector',
    description: 'Technical diagram with clean isometric lines',
    promptTemplate: 'Create a minimalist technical illustration in a clean, vector art style showing {description}. Use a balanced isometric or flat view with clean, precise lines and flat color fills, no gradients or complex textures. Use neutral grey for structural elements, electric blue for highlighting active paths and key components. All elements should have thin colored outlines and flat fills. The aesthetic is modern and technical, using simple geometric shapes and recognizable icons. Bright, even lighting with no harsh shadows. No borders or frames. 16:9 aspect ratio.',
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
  background?: BackgroundEffect; // Optional background effect via [bg:effect-position-color]
  alignment?: SlideAlignment; // Slide content alignment via [horizontal, vertical]
  imagePosition?: ImagePosition; // Image split position via [image: desc, position]
  footer?: string; // Optional footer text via $<footer content>
}

export type SlideElementType =
  | 'title'
  | 'subtitle'
  | 'text'
  | 'body'
  | 'image'
  | 'pause'
  | 'code'
  | 'quote'
  | 'highlight'
  | 'list'
  | 'spacer';

// Available text effects
export type TextEffect = 'anvil' | 'typewriter' | 'glow' | 'shake';

// Background effect types
export type BackgroundEffectType = 'glow' | 'grid' | 'hatch' | 'dashed' | 'retrogrid';
export type BackgroundPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
export type BackgroundColor = 'amber' | 'blue' | 'purple' | 'rose' | 'emerald' | 'cyan' | 'orange' | 'pink' | 'accent';

export interface BackgroundEffect {
  type: BackgroundEffectType;
  position: BackgroundPosition; // not used for 'retrogrid'
  color?: BackgroundColor; // defaults to 'accent' (theme color)
}

// ============================================
// Layout System v2 - Alignment & Positioning
// ============================================

// Slide alignment: [horizontal, vertical] at slide start
export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'center' | 'bottom';

export interface SlideAlignment {
  horizontal: HorizontalAlign;
  vertical: VerticalAlign;
}

// Image position for split layouts (1 image per deck)
// left/right = portrait split, top/bottom = landscape split
export type ImagePosition = 'left' | 'right' | 'top' | 'bottom';

// ============================================
// Grid Component Types
// ============================================

// Single item in a grid (parsed from list under [grid])
export interface GridItem {
  rows: GridItemRow[]; // All rows stack vertically, any type in any order
  revealOrder?: number; // For progressive reveal with **pause** between grid items
}

// A row in a grid item - can be text (h1/h2/h3/body) or visual (icon/image)
export type GridItemRow =
  | { type: 'text'; level: 'h1' | 'h2' | 'h3' | 'body'; content: string }
  | { type: 'icon'; value: string }
  | { type: 'image'; value: string };

// Image manifest entry for frontmatter storage
export type ImageSlot = 'generated' | 'uploaded' | 'restyled';

export interface ImageManifestEntry {
  generated?: string;
  uploaded?: string;
  restyled?: string;
  active: ImageSlot;
}

// Image manifest maps description to its URLs
export type ImageManifest = Record<string, ImageManifestEntry>;

// List item with optional heading style
// Use # prefix in list items: - # Title, - ## H1, - ### H2, - body (default)
export type ListItemStyle = 'title' | 'h1' | 'h2' | 'body';
export interface ListItem {
  content: string;
  style: ListItemStyle;
}

export interface SlideElement {
  type: SlideElementType;
  content: string;
  revealOrder: number; // 0 = immediate, 1+ = after N pauses
  metadata?: {
    language?: string; // for code blocks
    imageUrl?: string; // cached image URL
    imageStatus?: 'pending' | 'generating' | 'ready' | 'error';
    listType?: 'ordered' | 'unordered'; // for list elements
    listItems?: ListItem[]; // individual list items with optional styling
    effect?: TextEffect; // text animation effect e.g. [anvil]
    // Grid support
    isGrid?: boolean; // true if this list is a grid (preceded by [grid])
    gridItems?: GridItem[]; // parsed grid items with visual + rows
    // Spacer support
    spaceMultiplier?: number; // for [space:n] - multiplier for spacing (default 1)
  };
}

export interface ParsedDeck {
  slides: Slide[];
  metadata: DeckMetadata;
  imageManifest: ImageManifest; // Map of image descriptions to their URLs
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
