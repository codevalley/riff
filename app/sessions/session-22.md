# Session 22: Complete Image Management System

## Date: 2025-12-20

## Summary

Major session implementing the complete Image Management System for Riff. This includes:
- **Scene Context** as a first-class deck property (auto-extracted, editable, persisted)
- **Batch image generation** with the Sweep Generate Dialog
- **Unified action menu** for individual images
- **End-to-end propagation** of scene context through editor, presenter, and API

---

## Part 1: Scene Context Auto-Extraction Pipeline (Staged)

When a document is imported, scene context is automatically extracted and persisted.

### 1.1 Prompt Update: `lib/prompts.ts`

Extended DECK_METADATA_PROMPT to extract `imageContext` alongside title and theme:

```typescript
export const DECK_METADATA_PROMPT = `You extract title, theme, and image context from presentation content.

Given the deck content, output ONLY a JSON object:
{
  "title": "Short punchy deck title (3-6 words)",
  "themePrompt": "Theme description for CSS generation",
  "imageContext": "Scene setting for AI-generated images (location, recurring characters, thematic elements)"
}

Rules:
- Image context describes the SCENE SETTING (NOT artistic style):
  - Location/setting: "Set in Turkey", "Modern office", "Medieval castle"
  - Recurring characters: "A friendly cartoon mascot", "Team of diverse professionals"
  - Thematic elements: "Turkish patterns", "Sustainability motifs", "Tech aesthetic"
- Keep imageContext to 1-2 sentences max
`;
```

### 1.2 Metadata API: `/api/generate-deck-metadata/route.ts`

Now extracts `imageContext` from LLM response with fallback default:

```typescript
const { text: metadataOutput } = await generateText({
  model: gateway(modelId),
  system: DECK_METADATA_PROMPT,
  prompt: `Extract title, theme, and image context from this deck:\n\n${markdown.slice(0, 3000)}`,
  maxOutputTokens: 512,  // Increased from 256
});

// Parse imageContext from response
let imageContext: string | null = null;
const metadata = JSON.parse(jsonMatch[0]);
imageContext = metadata.imageContext || null;

// Default if none extracted
if (!imageContext) {
  imageContext = 'Professional business environment with modern aesthetic';
}

return NextResponse.json({ title, themePrompt, imageContext });
```

### 1.3 Document Uploader: `components/DocumentUploader.tsx`

Captures `imageContext` from metadata API and forwards to save-deck:

```typescript
// Stage 2: Metadata extraction
const { title, themePrompt, imageContext } = metadataData;

// Stage 4: Save deck with imageContext
const saveResponse = await fetch('/api/save-deck', {
  method: 'POST',
  body: JSON.stringify({
    markdown: finalMarkdown,
    title,
    themeCss,
    themePrompt,
    imageContext,  // Scene setting for AI-generated images
  }),
});
```

### 1.4 Save Deck API: `/api/save-deck/route.ts`

Persists `imageContext` to metadata blob:

```typescript
const { markdown, title, themeCss, themePrompt, imageContext } = await request.json();

// Save imageContext to metadata if provided
if (imageContext && typeof imageContext === 'string') {
  const existingMetadata = await getMetadata(session.user.id, deckId);
  const metadata = existingMetadata || { v: 3 };
  metadata.imageContext = imageContext;
  await saveMetadata(session.user.id, deckId, metadata);
}
```

---

## Part 2: Scene Context Editing & Persistence (Staged)

Scene context is a first-class editable deck property in the editor.

### 2.1 Theme API Extended: `/api/theme/[id]/route.ts`

PATCH handler now doubles as metadata writer for `imageContext`:

```typescript
// PATCH: Apply theme from history OR update imageContext
export async function PATCH(request: NextRequest, { params }) {
  const body = await request.json();

  // Handle imageContext update
  if (body.imageContext !== undefined) {
    const metadata = await getMetadata(session.user.id, deckId) || { v: 3 };
    metadata.imageContext = body.imageContext;
    await saveMetadata(session.user.id, deckId, metadata);
    return NextResponse.json({ success: true, imageContext: body.imageContext });
  }

  // Handle theme history application (existing logic)
  const { historyIndex } = body;
  // ...
}
```

### 2.2 Editor State: `app/editor/page.tsx`

Editor loads, tracks, and persists scene context:

```typescript
// State
const [sceneContext, setSceneContext] = useState<string | undefined>(undefined);

// Load from metadata on deck open
useEffect(() => {
  // ... fetch deck ...
  if (data.metadata?.imageContext) {
    setSceneContext(data.metadata.imageContext);
  } else {
    setSceneContext(undefined);
  }
}, [deckId]);

// Persist changes via theme API
const handleSceneContextChange = useCallback(async (context: string) => {
  if (!currentDeckId) return;
  setSceneContext(context);

  await fetch(`/api/theme/${encodeURIComponent(currentDeckId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageContext: context }),
  });
}, [currentDeckId]);

// Pass to SlidePreview
<SlidePreview
  sceneContext={sceneContext}
  onSceneContextChange={handleSceneContextChange}
  // ...
/>
```

---

## Part 3: App-wide Scene Context Propagation (Staged)

Scene context flows through the entire component tree to both single-image and batch generation.

### 3.1 Single Image API: `/api/generate-image/route.ts`

Now accepts `sceneContext` and prepends to prompt:

```typescript
function getPromptForStyle(
  description: string,
  styleId: ImageStyleId,
  backgroundColor?: string,
  sceneContext?: string  // NEW
): string {
  let prefix = '';

  // Scene context first (sets the world/setting)
  if (sceneContext && sceneContext.trim()) {
    prefix += `${sceneContext.trim()}. `;
  }

  // Background color instruction
  if (backgroundColor) {
    prefix += `IMPORTANT: Use a solid ${backgroundColor} background. `;
  }

  // Add "Subject: " to clearly separate context from subject
  const descriptionWithSubject = sceneContext ? `Subject: ${description}` : description;
  return prefix + preset.promptTemplate.replace('{description}', descriptionWithSubject);
}

// In POST handler:
const { description, styleId, forceRegenerate, backgroundColor, sceneContext } = await request.json();
const fullPrompt = getPromptForStyle(description, styleId || 'none', backgroundColor, sceneContext);
```

### 3.2 Component Prop Chain

Scene context flows through the component hierarchy:

```
Editor (page.tsx)
  └── sceneContext state
  └── handleSceneContextChange callback
        ↓
SlidePreview
  └── sceneContext prop
  └── onSceneContextChange prop
  └── Passes to SlideRenderer
  └── Passes to SweepGenerateDialog
        ↓
SlideRenderer
  └── sceneContext prop
  └── Passes to ImagePlaceholder
        ↓
ImagePlaceholder
  └── sceneContext prop
  └── Includes in /api/generate-image calls
```

### 3.3 Presenter Integration

Presenter mode also receives scene context for live image generation:

**`app/present/[id]/page.tsx`** (Server Component):
```typescript
// Load metadata for scene context
const metadata = await getMetadata(session.user.id, deckId);
const sceneContext = metadata?.imageContext;

return (
  <PresenterClient
    deck={parsedDeck}
    deckId={deckId}
    themeCSS={theme?.css}
    sceneContext={sceneContext}  // NEW
  />
);
```

**`app/present/[id]/client.tsx`**:
```typescript
interface PresenterClientProps {
  // ...
  sceneContext?: string;  // NEW
}

export function PresenterClient({ sceneContext, ...props }) {
  return <Presenter sceneContext={sceneContext} {...props} />;
}
```

**`components/Presenter.tsx`**:
```typescript
interface PresenterProps {
  // ...
  sceneContext?: string;  // NEW
}

export function Presenter({ sceneContext, ...props }) {
  return (
    <SlideRenderer
      sceneContext={sceneContext}  // Passed to all slides
      // ...
    />
  );
}
```

---

## Part 4: Sweep Generate Dialog (Staged)

### New Component: `SweepGenerateDialog.tsx` (1164 lines)

A cinematic batch image generation interface with:

- **Scene Context Editor**: Master context applied to all images (editable, persisted)
- **Style Picker**: Select from IMAGE_STYLE_PRESETS
- **Image Grid**: Shows all deck images with:
  - Pending (gray) vs Existing (with thumbnail)
  - Per-image selection checkboxes
  - Per-image prompt editing (click to expand)
- **Progress View**: DancingPixels animation with per-image status
- **Success Screen**: Grid of generated images with stats

```typescript
interface SweepGenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    description: string;
    slideIndex: number;
    hasExistingImage: boolean;
    existingUrl?: string;
  }>;
  sceneContext?: string;
  onSceneContextChange?: (context: string) => void;
  currentStyleId: ImageStyleId;
  onStyleChange?: (styleId: ImageStyleId) => void;
  onGenerateSingle: (description: string, modifiedPrompt?: string, slideIndex?: number)
    => Promise<{ url: string | null; error?: string }>;
  userCredits?: number;
  onRefreshCredits?: () => Promise<void>;
}
```

### UI States

1. **Setup View**: Configure context, style, select images
2. **Generating View**: Progress with DancingPixels, per-image status
3. **Success View**: Generated images grid, stats, close button

---

## Part 5: Sweep Generate API (Staged)

### New Route: `/api/sweep-generate/route.ts` (361 lines)

Server-Sent Events (SSE) based API for real-time progress updates.

**Features**:
- Model cascade: Gemini 3 Pro → Imagen 3 → Gemini 2.0 Flash
- Credit pre-checking and deduction
- Queue persistence in deck metadata
- Scene context + style prompt building (same logic as single-image API)

```typescript
function buildPrompt(description: string, styleId: ImageStyleId, sceneContext?: string): string {
  let prefix = '';
  if (sceneContext?.trim()) {
    prefix += `${sceneContext.trim()}. `;
  }
  const descriptionWithSubject = sceneContext ? `Subject: ${description}` : description;
  return prefix + preset.promptTemplate.replace('{description}', descriptionWithSubject);
}
```

---

## Part 6: Type Definitions (Staged)

### New Types in `lib/types.ts`

```typescript
// Individual image in generation queue
interface ImageQueueItem {
  id: string;
  description: string;
  modifiedPrompt?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'skipped';
  error?: string;
  resultUrl?: string;
  slideIndex: number;
}

// Batch generation queue (persists across page refresh)
interface ImageGenerationQueue {
  id: string;
  deckId: string;
  items: ImageQueueItem[];
  contextUsed: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// Extended DeckMetadataV3
interface DeckMetadataV3 {
  // ... existing fields
  imageContext?: string;           // Scene setting for visual consistency
  imageQueue?: ImageGenerationQueue; // Persists across refresh
}
```

---

## Part 7: DancingPixels Enhancements (Staged)

Visual improvements for better visibility:

| Property | Before | After |
|----------|--------|-------|
| Dot spacing | 12px | 16px (fewer, larger) |
| Dot size | 2x2 | 4x4 |
| Wander amount | 2.5 | 4 (more pronounced) |
| Active opacity | 0.85 × wave | max(0.4, 1.2 × wave) |
| Base opacity | 0.18 | 0.35 |
| Border radius | 0 | 1px (rounded) |

---

## Part 8: SlidePreview Integration (Staged)

Added sweep generation hooks and button:

```typescript
// Extract all images from deck for sweep dialog
const extractDeckImages = useCallback(() => {
  if (!parsedDeck) return [];
  const images = [];
  parsedDeck.slides.forEach((slide, slideIndex) => {
    slide.imageDescriptions?.forEach((description) => {
      const manifestEntry = parsedDeck.imageManifest?.[description];
      images.push({
        description,
        slideIndex,
        hasExistingImage: !!(manifestEntry?.generated || manifestEntry?.uploaded || manifestEntry?.restyled),
        existingUrl: manifestEntry?.[manifestEntry?.active || 'generated'],
      });
    });
  });
  return images;
}, [parsedDeck]);

// Generate single image (for sweep dialog)
const handleGenerateSingleImage = useCallback(async (description, modifiedPrompt, slideIndex) => {
  const response = await fetch('/api/generate-image', {
    body: JSON.stringify({
      description: modifiedPrompt || description,
      styleId: imageStyle,
      sceneContext,  // Uses deck-level scene context
      forceRegenerate: true,
    }),
  });
  // ...
}, [imageStyle, sceneContext, onImageChange]);
```

UI: Added "Images" button in controls bar that opens SweepGenerateDialog.

---

## Part 9: Unified Image Action Menu (Unstaged)

### Complete Overhaul of `ImagePlaceholder.tsx` (+493/-188 lines)

**Before**: Separate buttons for Generate, Upload, Regenerate, Style
**After**: Single contextual dropdown menu

#### Empty State: `+ Add Image` button
- Generate (Paintbrush icon)
- Upload
- From Library (when deck has other images)

#### Filled State: `Edit ▾` button
- Regenerate
- Upload New
- Restyle
- From Library
- Remove (destructive, with divider)

### Portal-based Menus (No Clipping)

```typescript
import { createPortal } from 'react-dom';

const menuContent = showActionMenu && createPortal(
  <motion.div
    className="fixed w-44 z-[9999]"
    style={{
      top: menuPosition.top - 8,
      left: menuPosition.left,
      transform: 'translate(-50%, -100%)',
    }}
  >
    {/* Menu items */}
  </motion.div>,
  document.body
);
```

### Accept/Reject Regeneration Flow

```typescript
const [pendingRegenImage, setPendingRegenImage] = useState<string | null>(null);
const [previousImage, setPreviousImage] = useState<string | null>(null);

// On regenerate completion: show preview
if (isRegenerate) {
  setPendingRegenImage(data.url);
}

// Accept: commit to manifest
const handleAcceptRegen = () => {
  cacheImage(cacheKey, pendingRegenImage);
  onImageChange?.('generated', pendingRegenImage);
};

// Reject: discard
const handleRejectRegen = () => {
  setPendingRegenImage(null);
};
```

### Library Picker Modal

New modal for selecting from existing deck images:
- 3-column grid
- Hover overlay with description (using named groups `group/libimg`)
- Slide number indicator

### DancingPixels During Regeneration

Added animation overlay when regenerating existing images.

---

## Part 10: deckImages Prop Chain (Unstaged)

Wired `deckImages` through component hierarchy for "From Library" picker:

| Component | Changes |
|-----------|---------|
| SlidePreview | Added `deckImagesForLibrary` useMemo |
| SlideRenderer | Added `deckImages` prop + interface |
| ElementRenderer | Added `deckImages` prop + interface |
| GridCard | Added `deckImages` prop + interface |
| GridRowRenderer | Added `deckImages` prop + interface |

---

## Part 11: Bug Fixes (Unstaged)

### Named Tailwind Groups

Fixed hover overlay showing on any editor hover:

```tsx
// Before (broken - parent group interference)
<button className="group">
  <div className="group-hover:opacity-100">

// After (isolated scope)
<button className="group/libimg">
  <div className="group-hover/libimg:opacity-100">
```

### Sparkles Icon Replaced

Changed Generate icon from forbidden `Sparkles` to `Paintbrush`.

---

## Files Summary

### Staged Changes (2697 insertions, 235 deletions)

| File | Lines | Description |
|------|-------|-------------|
| `components/SweepGenerateDialog.tsx` | +1164 | New: Batch generation dialog |
| `app/api/sweep-generate/route.ts` | +361 | New: SSE-based generation API |
| `app/api/generate-image/route.ts` | +46 | sceneContext support |
| `app/api/generate-deck-metadata/route.ts` | +14 | imageContext extraction |
| `app/api/save-deck/route.ts` | +12 | imageContext persistence |
| `app/api/theme/[id]/route.ts` | +22 | imageContext PATCH handler |
| `app/editor/page.tsx` | +28 | sceneContext state + editing |
| `app/present/[id]/page.tsx` | +7 | Load sceneContext for presenter |
| `app/present/[id]/client.tsx` | +3 | Pass sceneContext prop |
| `components/Presenter.tsx` | +4 | sceneContext prop chain |
| `components/SlidePreview.tsx` | +196 | Sweep integration, context props |
| `components/SlideRenderer.tsx` | +39 | sceneContext + deckImages props |
| `components/ImagePlaceholder.tsx` | +625 | Partial staged changes |
| `components/DocumentUploader.tsx` | +3 | Forward imageContext |
| `components/DancingPixels.tsx` | +33 | Visual enhancements |
| `lib/types.ts` | +35 | Queue types, metadata extensions |
| `lib/prompts.ts` | +18 | imageContext in metadata prompt |

### Unstaged Changes (493 insertions, 188 deletions)

| File | Lines | Description |
|------|-------|-------------|
| `components/ImagePlaceholder.tsx` | +493/-188 | Unified menu, portals, accept/reject |
| `components/SlideRenderer.tsx` | +23 | deckImages prop additions |
| `components/SlidePreview.tsx` | +37/-1 | deckImagesForLibrary extraction |

---

## Architecture: Scene Context Flow

```
Document Import
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ /api/generate-deck-metadata                                     │
│ LLM extracts: title, themePrompt, imageContext                  │
│ Default: "Professional business environment with modern aesthetic" │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ DocumentUploader → /api/save-deck                               │
│ Persists imageContext to metadata blob                          │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Editor (page.tsx)                                               │
│ Loads metadata.imageContext → sceneContext state                │
│ handleSceneContextChange → PATCH /api/theme/[id]                │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SlidePreview → SlideRenderer → ImagePlaceholder                 │
│ Each image generation includes sceneContext in prompt           │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SweepGenerateDialog                                             │
│ Master context editor (editable)                                │
│ Changes persist via onSceneContextChange                        │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Presenter (present/[id])                                        │
│ Loads sceneContext from metadata                                │
│ Passes to SlideRenderer for any live generation                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture: Image Management Flow

```
User clicks "Images" button
         ↓
┌─────────────────────────────────────────────────┐
│ SweepGenerateDialog                             │
│ ┌─────────────────┐ ┌─────────────────────────┐ │
│ │ Scene Context   │ │ Image Grid              │ │
│ │ (editable)      │ │ [✓] Slide 1: desc...    │ │
│ │                 │ │ [✓] Slide 2: desc...    │ │
│ │ Style Picker    │ │ [ ] Slide 3: (existing) │ │
│ └─────────────────┘ └─────────────────────────┘ │
│                                                 │
│ [Generate 2 Images] (2 credits)                 │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Progress View (DancingPixels)                   │
│ ○ Slide 1: desc... ✓                            │
│ ● Slide 2: desc... (generating)                 │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Success View                                    │
│ ┌─────┐ ┌─────┐                                │
│ │ img │ │ img │  2 generated, 0 failed          │
│ └─────┘ └─────┘                                │
└─────────────────────────────────────────────────┘
```

---

## Status

### Complete
- [x] Scene context auto-extraction (DECK_METADATA_PROMPT)
- [x] Scene context persistence (/api/save-deck, /api/theme/[id])
- [x] Scene context editing in editor
- [x] Scene context propagation to all image generation
- [x] Presenter scene context support
- [x] SweepGenerateDialog component
- [x] /api/sweep-generate SSE endpoint
- [x] ImageQueueItem and ImageGenerationQueue types
- [x] DeckMetadataV3 extensions (imageContext, imageQueue)
- [x] DancingPixels visual enhancements
- [x] SlidePreview sweep integration
- [x] Unified image action menu (empty + filled states)
- [x] Portal-based dropdown menus
- [x] Accept/reject regeneration flow
- [x] Library picker modal
- [x] deckImages prop chain
- [x] Named Tailwind groups fix
- [x] Sparkles → Paintbrush icon
- [x] Accept/Reject button styling (app theme)
- [x] Error display in filled state (insufficient credits)
- [x] Flicker fix on image accept (single img element pattern)

### Scope Note
- Library picker is **deck-specific** only (shows images from current deck)
- Cross-deck image library would require separate API
- Scene context is NOT artistic style (we have style presets for that) - it's the scene setting (location, characters, thematic elements)

---

## Part 12: Image Regeneration Flicker Fix

### Problem

When accepting a regenerated image, users saw a brief flicker:
1. Old image displayed
2. Click "Accept"
3. Old image briefly flashes
4. New image appears

### Root Cause

The component used conditional rendering with different `key` props:

```tsx
// Before: Two separate img elements with different keys
{pendingRegenImage ? (
  <img key={pendingRegenImage} src={pendingRegenImage} />
) : (
  <img key={activeImageUrl} src={activeImageUrl!} />
)}
```

When `pendingRegenImage` was cleared on accept, React unmounted the first `<img>` and mounted a new one with a different key. This caused a brief flash while the browser re-rendered the new element.

### Solution

Use a single `<img>` element with computed `src`:

```tsx
// After: Single img element, no remount
<img
  src={pendingRegenImage || activeImageUrl!}
  alt={description}
  className="absolute inset-0 w-full h-full object-contain"
  loading={pendingRegenImage ? undefined : 'lazy'}
/>
```

**Key insight**: When accepting, `handleAcceptRegen` sets `slots.generated` to `pendingRegenImage` before clearing `pendingRegenImage`. Since both point to the same URL, the `src` never changes during the transition - eliminating the flicker.

### Additional Fix: Error Display in Filled State

Also added error display overlay (e.g., for insufficient credits) when image already exists:

```tsx
{error && !isGenerating && !pendingRegenImage && (
  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 ...">
    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
      <AlertCircle className="w-4 h-4 text-red-400" />
      <span className="text-red-300 text-xs">{error}</span>
    </div>
  </div>
)}
```

### Accept/Reject Button Styling

Updated to match app theme:
- **Revert**: Muted black/white (`bg-black/60`, `border-white/20`)
- **Accept**: Accent color (`bg-slide-accent/90`, `border-slide-accent`)

---

## Part 13: Restyle Modal Simplification

### Problem: Regenerate Shows Old Image

Root cause identified: Browser cache collision due to `addRandomSuffix: false` in blob storage.
- Regenerated images save to the SAME URL path
- Browser caches the old image at that URL
- Even though server has new content, browser shows cached version
- Restyle works because it uses DIFFERENT cache key (`restyle:description`) → different URL

### Solution: Remove Regenerate Entirely

Removed regenerate in favor of restyle-only workflow:
- Removed `pendingRegenImage`, `previousImage` state
- Removed `handleAcceptRegen`, `handleRejectRegen` callbacks
- Removed accept/reject UI overlay
- Removed unused imports: `RefreshCw`, `RotateCcw`, `Check`, `Sparkles`
- Restyle is now the primary action in filled state menu

### Simplified Restyle Modal

Redesigned for minimal, compact UI:
- **Header**: Just "Restyle" text + close button (no icons, no "AI" text)
- **Input**: Single-line text field for custom style description
- **Style chips**: Compact inline buttons (not a grid), description shows only when selected
- **Scene context**: Collapsed by default, simple button + textarea (no nested containers)
- **Footer**: Cancel/Apply only

**In-place generation**: Modal closes immediately on "Apply", DancingPixels overlay shows on the image itself.

---

## Part 14: Editor Bottom Bar Polish

### Unified Button Styles

Theme and Images buttons now have consistent styling:

```tsx
// Both buttons now use:
className="
  flex items-center gap-1.5 px-2.5 py-1.5
  hover:bg-surface
  border border-border hover:border-border-hover
  rounded-md text-text-secondary hover:text-text-primary
  transition-all duration-fast text-xs
"
```

### Slide Navigator Arrows

Added `<` `>` buttons on either side of the mini deck view for easier scrolling:

```tsx
<div className="flex items-center gap-2 px-2 py-3 border-t border-border">
  {/* Left arrow */}
  <button onClick={() => scrollNavigator('left')}>
    <ChevronLeft className="w-4 h-4" />
  </button>

  {/* Scrollable navigator */}
  <div ref={navigatorRef} className="flex-1 overflow-x-auto">
    {/* slide thumbnails */}
  </div>

  {/* Right arrow */}
  <button onClick={() => scrollNavigator('right')}>
    <ChevronRight className="w-4 h-4" />
  </button>
</div>
```

### Editable Slide Counter

The slide count (e.g., "21/70") numerator is now clickable to jump to any slide:

```tsx
// Click on number → shows inline input
{isEditingSlideNumber ? (
  <input
    type="text"
    value={slideNumberInput}
    onChange={(e) => setSlideNumberInput(e.target.value.replace(/\D/g, ''))}
    onBlur={handleSlideNumberSubmit}
    onKeyDown={handleSlideNumberKeyDown}  // Enter to confirm, Escape to cancel
  />
) : (
  <button onClick={handleSlideNumberClick}>
    {presentation.currentSlide + 1} / {totalSlides}
  </button>
)}
```

**Behavior**:
- Click number → input field appears (auto-focused, text selected)
- Type new number → Enter to jump, Escape to cancel
- Click outside → jumps if valid number
