# Session 04: Landing Page & Document Import

**Date:** 2025-12-12

## Summary

Created an elaborate landing page for Riff with animated demos and visual flair, plus a document-to-slides conversion feature. Moved the editor to `/editor` route.

## Key Changes

### Routing Restructure
- **`/`** → New landing page (`Landing.tsx`)
- **`/editor`** → Editor moved here (supports `?deck=` query param)
- **`/present/[id]`** → Unchanged

### Landing Page (`components/Landing.tsx`)
- **Hero section:** Playfair Display typography, animated badge, dual CTAs
- **Live demo:** Browser mockup with typing animation + slide preview cycling
- **Feature cards:** ai-sdk.dev style with fixed heights, compact visuals
- **Capabilities grid:** 6-card grid for feature overview
- **Syntax preview:** Code block showing Riff markdown format
- **CTA footer:** Final call to action with import/new deck buttons
- **Background patterns:** Subtle grid/dot/diagonal patterns per section with mask fades

### Document Import Feature
- **API:** `/api/convert-document` using AI Gateway + Kimi K2
- **Prompt:** `DOCUMENT_TO_SLIDES_PROMPT` in `lib/prompts.ts`
- **UI:** `DocumentUploader.tsx` modal with drag-drop, options, progress states
- **Flow:** Upload → Convert → Redirect to `/editor?deck=<id>`

### Design Refinements
- Hero text: `clamp(3rem,8vw,6rem)` with Playfair Display
- Subtext: 20px ui-sans-serif across all sections
- Feature cards: 360px height, 220px visual area, 80px text area (fixed positions)
- Grid layout: `lg:grid-cols-4` for 4-across on large screens
- Visual components: Compact 36x40 size with browser chrome dots

### Background Patterns (per section)
- **Hero:** Grid fading from top (`rgba(255,255,255,0.15)`)
- **Features:** Diagonal cross fading from bottom-left
- **Capabilities:** Dot pattern fading from right
- **Syntax:** Grid with radial center fade
- **CTA:** Diagonal lines fading from bottom

## Files Created
- `app/app/editor/page.tsx` - Editor moved here
- `app/components/Landing.tsx` - Full landing page
- `app/components/DocumentUploader.tsx` - Upload modal
- `app/app/api/convert-document/route.ts` - Conversion API

## Files Modified
- `app/app/page.tsx` - Now renders Landing component
- `app/lib/prompts.ts` - Added `DOCUMENT_TO_SLIDES_PROMPT`, enhanced visual requirements
- `app/components/DeckManager.tsx` - Removed "New Deck" from dropdown (moved to header)
- `app/components/FormatHelpDialog.tsx` - Changed icon to Lightbulb, text to "Handbook"

## Additional Updates (Session Continued)

### Document Uploader Redesign
- Better layout with dark theme (`#0a0a0a` background)
- Clear header with title + subtitle explaining the feature
- File preview when selected (icon + name + char count + X to remove)
- Options appear only after file selection (progressive disclosure)
- AI callout at bottom with clickable links to ChatGPT, Claude, Gemini
- "Full (don't reduce)" slide count option for comprehensive conversion

### Conversion Improvements
- **Full mode:** Preserves all content without summarizing (16384 max tokens)
- **Visual requirements:** Images every 2-3 slides, background effects, text effects
- **Better prompts:** Specific image description examples, emphasis on visual richness

### Editor Page Updates
- Logo updated to match landing page (LayoutGrid + Playfair Display font)
- "New Deck" and "Create from document" buttons moved to header bar
- New deck modal for creating decks
- Fixed race condition: deck loads directly by ID from URL param (handles newly created decks)

### UI Text/Icon Changes
- Landing: "Import document" → "I have content" with `FileSymlink` icon
- Editor: "+ New" → "+ New Deck"
- Editor: "Import" → "Create from document" with `FileSymlink` icon
- Help button: `?` → Lightbulb icon with "Handbook" text

### Bug Fixes
- Fixed "blob not found" error when redirecting from document import
- Editor now loads deck directly by ID instead of checking cached list first

## Technical Notes

1. **Inline styles for patterns:** Regular `<style>` tags don't work reliably in Next.js client components. Use React inline styles with `WebkitMask` for Safari support.

2. **Feature card layout:** Fixed heights prevent text position from shifting based on content length. Visual area has fixed 220px, text area pinned to bottom with `mt-auto`.

3. **Document conversion:** Max 100K characters, outputs up to 8192 tokens (~20 slides). Cleans markdown fences and leading `---` from AI output.

### AI Provider Consolidation (Anthropic Eliminated)

Removed Anthropic dependency entirely. Now using only 2 providers:

| Operation | Before | After |
|-----------|--------|-------|
| Text/slide generation | AI Gateway (Kimi K2) | Unchanged |
| Theme generation | **Anthropic SDK (Claude)** | AI Gateway (Kimi K2) |
| Image generation | Google Gemini | Unchanged |
| Image restyling | Google Gemini | Unchanged |

**Files Modified:**
- `generate-theme/route.ts` - Replaced `@anthropic-ai/sdk` with `ai` package's `createGateway`

**Environment Variables (simplified):**
```env
AI_GATEWAY_API_KEY=xxx          # Text + themes (Kimi K2)
AI_GATEWAY_MODEL=moonshotai/kimi-k2-0905
GOOGLE_GENERATIVE_AI_API_KEY=xxx # Images (Gemini 3)
```

**Removed:**
- `ANTHROPIC_API_KEY` no longer needed
- `AI_GATEWAY_IMAGE_MODEL` removed (AI Gateway image support too limited)

## Example Patterns

```tsx
// Grid pattern with top fade
style={{
  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
  mask: 'linear-gradient(to bottom, black 0%, transparent 70%)',
  WebkitMask: 'linear-gradient(to bottom, black 0%, transparent 70%)',
}}
```
