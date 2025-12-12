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
- `app/lib/prompts.ts` - Added `DOCUMENT_TO_SLIDES_PROMPT`

## Technical Notes

1. **Inline styles for patterns:** Regular `<style>` tags don't work reliably in Next.js client components. Use React inline styles with `WebkitMask` for Safari support.

2. **Feature card layout:** Fixed heights prevent text position from shifting based on content length. Visual area has fixed 220px, text area pinned to bottom with `mt-auto`.

3. **Document conversion:** Max 100K characters, outputs up to 8192 tokens (~20 slides). Cleans markdown fences and leading `---` from AI output.

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
