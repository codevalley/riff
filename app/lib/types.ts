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

// Image position for split layouts (1 image per slide)
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

// ============================================
// Deck Metadata v3 - Unified JSON storage
// Stored at: users/{userId}/themes/{deckId}.json
// ============================================

/**
 * Theme data - stored in metadata and theme history
 */
export interface ThemeData {
  css: string;
  prompt: string;
  generatedAt?: string;
}

/**
 * Deck settings - future expansion
 */
export interface DeckSettings {
  aspectRatio?: '16:9' | '4:3';
  // Future: transition, exportFormat, etc.
}

// ============================================
// Image Generation Queue - Sweep Generation
// ============================================

/**
 * Individual image in a generation queue
 */
export interface ImageQueueItem {
  id: string;
  description: string;        // Original from markdown
  modifiedPrompt?: string;    // User-edited version (if different)
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'skipped';
  error?: string;
  resultUrl?: string;
  slideIndex: number;         // Which slide this belongs to
}

/**
 * Batch image generation queue
 * Stored in metadata for persistence across page refresh
 */
export interface ImageGenerationQueue {
  id: string;
  deckId: string;
  items: ImageQueueItem[];
  contextUsed: string;        // Snapshot of imageContext when queue started
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;           // 0-100
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}

/**
 * Unified deck metadata (v3 format)
 * - Replaces embedded YAML frontmatter
 * - Includes theme history for quantization
 * - Stored as JSON in blob storage
 */
export interface DeckMetadataV3 {
  v: 3;
  images?: ImageManifest;
  theme?: ThemeData;
  themeHistory?: ThemeData[]; // Previous themes for quantization
  settings?: DeckSettings;
  // Image generation context (includes BOTH style and scene)
  imageContext?: string;      // Comprehensive image context: artistic style + scene elements
  imageQueue?: ImageGenerationQueue; // Batch generation queue (persists across refresh)
  // Deck description for OG metadata (generated from content)
  description?: string;
}

/**
 * Legacy theme format (pre-v3)
 * Used for backward compatibility detection
 */
export interface LegacyThemeData {
  css: string;
  prompt: string;
  generatedAt?: string;
}

// ============================================
// Riff Export Format (.riff)
// Portable bundle for sharing decks with all metadata
// ============================================

/**
 * Riff export format - a JSON file with .riff extension
 * Contains everything needed to recreate a deck
 */
export interface RiffExport {
  format: 'riff-v1';
  name: string;
  content: string; // Markdown slides (no frontmatter)
  metadata: DeckMetadataV3;
  exportedAt: string; // ISO timestamp
}

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

  // Custom system prompts (user can edit these)
  customThemeSystemPrompt: string | null; // null = use default
  customSlideSystemPrompt: string | null; // null = use default

  // Image generation
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
  setParsedDeck: (deck: ParsedDeck | null, forceReplaceManifest?: boolean) => void;
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

  // Image manifest update (uses get() to avoid stale closure issues)
  updateManifestEntry: (description: string, entry: ImageManifestEntry) => void;
  // Batch update multiple manifest entries in a single set() call
  batchUpdateManifestEntries: (entries: Record<string, ImageManifestEntry>) => void;

  // Slide HTML cache actions
  cacheSlideHtml: (key: string, html: string) => void;
  getSlideHtml: (key: string) => string | undefined;
  setGeneratingSlide: (key: string, generating: boolean) => void;
  isSlideGenerating: (key: string) => boolean;

  toggleEditor: () => void;
  toggleSpeakerNotes: () => void;
  toggleFullscreen: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
