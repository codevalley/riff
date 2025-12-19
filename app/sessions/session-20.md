# Session 20 - Deck Editor Upgrade: Add Slide & Per-Slide Revamp

## Date: 2025-12-19

## Summary
Major upgrade to the deck editor experience:
1. **Removed Generated Slides Mode** - Simplified to Standard mode only
2. **Add Slide Feature** - AI-powered slide generation with templates
3. **Per-Slide Revamp** - Transform individual slides with inline comparison
4. **Navigator UX Polish** - Auto-scroll, current slide highlighting, hover interactions

## Phase 1: Remove Generated Slides Mode

### Problem
The Standard/Generated toggle was confusing and added complexity. Generated mode used a different rendering approach that wasn't needed.

### Solution
Removed all Generated mode infrastructure:
- Deleted `GeneratedSlide.tsx` component
- Deleted `SlideGeneratorSettings.tsx` component
- Deleted `/api/generate-slide/route.ts` endpoint
- Deleted `/api/slide-cache/route.ts` endpoint
- Removed `SlideRenderMode` type from `lib/types.ts`
- Removed `toggleRenderMode()` and `setRenderMode()` from store
- Removed toggle UI from `SlidePreview.tsx`

## Phase 2: Add Slide Feature

### User Flow
1. User selects a slide in the mini navigator
2. A `+` button appears after the current slide
3. Clicking opens `AddSlideDialog` with template options
4. User selects template and/or writes description
5. AI generates slide, inserted after current position
6. Inline review overlay with Keep/Revamp/Discard options

### Templates Available
- **Comparison** - Before/after or side-by-side
- **Statistics** - Key metrics with visual emphasis
- **Quote** - Customer testimonial or key quote
- **Features** - Feature grid with icons
- **Visual** - Image-focused with minimal text
- **Impact** - Bold statement with emphasis

### API: `/api/add-slide`

```typescript
interface AddSlideRequest {
  deckId: string;
  insertAfterSlide: number;
  userDescription: string;
  deckContext: {
    title: string;
    slideCount: number;
  };
  surroundingSlides?: {
    before: string;
    after: string;
  };
}
```

Uses `DECKSMITH_ADD_SLIDE_PROMPT` with `MARKDOWN_SYNTAX_SPEC` injection for consistent output.

### Files Created
- `app/api/add-slide/route.ts` - API endpoint
- `components/AddSlideDialog.tsx` - Premium dialog with templates

### Files Modified
- `lib/prompts.ts` - Added `DECKSMITH_ADD_SLIDE_PROMPT`
- `lib/credits-config.ts` - Added `ADD_SLIDE: 0.2` credits
- `components/SlidePreview.tsx` - Add slide button and inline review flow

## Phase 3: Per-Slide Revamp

### User Flow
1. Hover over any slide thumbnail in navigator
2. "Revamp" button appears (icon expands to icon+text on hover)
3. Clicking opens `RevampSlideDialog` with quick suggestions
4. User enters instructions (can toggle suggestions on/off)
5. AI transforms the slide
6. Inline Original/Revamped toggle for comparison
7. Apply Changes or Discard

### Quick Suggestions
- More visual - Icons and layout improvements
- Icon grid - Convert to icon grid layout
- Progressive reveals - Add reveal animations
- Simplify - Reduce text density
- Background effect - Add dynamic background
- Stats slide - Transform to statistics slide

### API: `/api/revamp-slide`

```typescript
interface RevampSlideRequest {
  deckId: string;
  slideIndex: number;
  currentSlide: string;
  userInstructions: string;
  deckContext: {
    title: string;
    theme?: string;
    slideCount: number;
  };
}
```

### Files Created
- `app/api/revamp-slide/route.ts` - API endpoint
- `components/RevampSlideDialog.tsx` - Premium dialog with toggle suggestions

### Files Modified
- `lib/prompts.ts` - Added `DECKSMITH_REVAMP_SLIDE_PROMPT`
- `lib/credits-config.ts` - Added `SLIDE_REVAMP: 0.2` credits
- `components/SlidePreview.tsx` - Revamp button, comparison overlay

## Phase 4: Navigator UX Polish

### Improvements
1. **Current slide highlighting** - Amber border with glow effect
2. **Auto-scroll** - Navigator scrolls to keep current slide visible
3. **Revamp button expansion** - Icon-only → icon+text on hover
4. **Newly added slide indicator** - Sparkles icon instead of number
5. **Loading states** - Inline overlays with animated progress

### Implementation Details

**Auto-scroll with refs:**
```typescript
const navigatorRef = useRef<HTMLDivElement>(null);
const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map());

useEffect(() => {
  const slideElement = slideRefs.current.get(presentation.currentSlide);
  if (slideElement && navigatorRef.current) {
    slideElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }
}, [presentation.currentSlide]);
```

**Inline loading overlay:**
- Breathing icon animation (scale + opacity)
- Status message
- Sliding gradient progress bar
- Backdrop blur effect

## Helper Functions Added

```typescript
// Split deck into frontmatter and slides
function splitDeckContent(content: string): { frontmatter: string; slides: string[] }

// Join frontmatter and slides back
function joinDeckContent(frontmatter: string, slides: string[]): string

// Get single slide markdown by index
function getSlideMarkdown(content: string, slideIndex: number): string

// Replace single slide in deck
function replaceSlideMarkdown(content: string, slideIndex: number, newSlide: string): string

// Insert slide after position
function insertSlideAfter(content: string, afterIndex: number, newSlide: string): string

// Remove slide at position
function removeSlideAt(content: string, slideIndex: number): string
```

## Credit Pricing

| Action | Credits |
|--------|---------|
| Add Slide | 0.2 |
| Revamp Slide | 0.2 |
| Deck Revamp | 1.5 (existing) |

## Files Changed Summary

### Created
- `app/api/add-slide/route.ts`
- `app/api/revamp-slide/route.ts`
- `components/AddSlideDialog.tsx`
- `components/RevampSlideDialog.tsx`

### Deleted
- `app/api/generate-slide/route.ts`
- `app/api/slide-cache/route.ts`
- `components/GeneratedSlide.tsx`
- `components/SlideGeneratorSettings.tsx`

### Modified
- `components/SlidePreview.tsx` - Major rewrite with all features
- `lib/prompts.ts` - Added two new DeckSmith prompts
- `lib/credits-config.ts` - Added ADD_SLIDE and SLIDE_REVAMP costs
- `lib/types.ts` - Removed SlideRenderMode
- `lib/store.ts` - Removed render mode state/actions

## Design Decisions

1. **No blank slide option** - All new slides are AI-generated for consistency
2. **Templates as starting points** - Can be combined with custom description
3. **Inline review flows** - No modal for comparison, feels more integrated
4. **Keep on Escape** - Pressing Escape keeps changes (not discard)
5. **Auto-save on all operations** - Changes saved immediately after apply
