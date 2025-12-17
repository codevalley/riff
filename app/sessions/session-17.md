# Session 17 - V2 Format Detection, Prompt Architecture & Bug Fixes

## Date: 2025-12-17

## Summary
Major session covering:
1. Legacy deck detection system (v: 2 marker in frontmatter)
2. Complete prompt architecture overhaul using system-prompt-writer principles
3. Multiple frontmatter handling bug fixes
4. Editor reveal step fix for grid visibility

## Changes Made

### Feature 1: Legacy Deck Detection & Upgrade
- Added `v: 2` marker to frontmatter to identify v2 format decks
- `isLegacyDeck()` function now checks for `v: 2` in frontmatter
- Decks without `v: 2` show pulsing amber badge on Revamp button
- RevampDeckDialog shows "Upgrade Deck" option for legacy decks
- Auto-selects upgrade suggestion when legacy deck detected

### Feature 2: Prompt Architecture Overhaul
Applied system-prompt-writer skill principles to create professional prompts:

**New Architecture:**
```
RIFF_FORMAT_REFERENCE (shared syntax reference)
        │
    ┌───┴───┐
    ▼       ▼
DECK_CREATION_PROMPT    DECK_REVAMP_PROMPT
```

**RIFF_FORMAT_REFERENCE** - Comprehensive v2 syntax shared by all prompts:
- Slide setup (alignment, backgrounds)
- Content elements table
- Images with positioning
- Grid cards with icons
- Text effects

**DECK_CREATION_PROMPT** - For new deck generation:
- Role: Elite presentation designer
- Design Principles: Viewport-first, visual hierarchy, progressive disclosure
- Golden Example: Embedded sample-deck.md showing ideal v2 usage
- Success Criteria & Constraints

**DECK_REVAMP_PROMPT** - For upgrading/improving decks:
- Role: Presentation renovation expert
- Revamp Philosophy: House renovation metaphor
- Transformation Patterns: Plain list → Grid, Stats → Grid stats, etc.
- Viewport Density Rules: Max 3-5 bullets, split if needed

### Feature 3: Frontmatter Handling Fixes

**Bug: Duplicate `v: 2` blocks**
- Cause: Revamp API added its own block, image updates added another
- Fix: Use `extractFrontmatter()` to properly merge into single block

**Bug: Version info lost when adding images**
- Cause: `Frontmatter` interface only tracked `images`, not `v`
- Fix: Added `v?: number` to interface, updated extraction/serialization

**Bug: New decks showing revamp button**
- Cause: convert-document API didn't add `v: 2`
- Fix: Added frontmatter handling to convert-document API

### Feature 4: Grid Items Hidden in Editor Fix
- Cause: Editor used `revealStep={presentation.currentReveal}` which starts at 0
- Grid items with `**pause**` get different `revealOrder` values (0, 1, 2...)
- Items with `revealOrder > 0` were hidden at `revealStep=0`
- Fix: Changed editor to use `revealStep={999}` to show all content
- Reveals still work correctly in actual presentation mode

## Files Created
- `sessions/session-17.md`

## Files Modified

### `lib/parser.ts`
- Added `v?: number` to `Frontmatter` interface
- Rewrote `extractFrontmatter()` to capture both `v` and `images`
- Updated `serializeFrontmatter()` to output `v` first, then `images`
- `updateImageInManifest()` now always sets `v: 2`
- `setActiveImageSlot()` preserves/sets `v: 2`
- Simplified `isLegacyDeck()` to use `extractFrontmatter()`

### `lib/prompts.ts`
- Added `RIFF_FORMAT_REFERENCE` constant (shared v2 syntax)
- Added `DECK_CREATION_PROMPT` with design principles + golden example
- Added `DECK_REVAMP_PROMPT` with transformation patterns
- Kept `DOCUMENT_TO_SLIDES_PROMPT` as alias for backward compatibility

### `app/api/revamp-deck/route.ts`
- Import `DECK_REVAMP_PROMPT` from prompts.ts (removed inline prompt)
- Import `extractFrontmatter` from parser
- Use proper frontmatter extraction instead of manual regex
- Single unified frontmatter block output

### `app/api/convert-document/route.ts`
- Import `extractFrontmatter` from parser
- Add `v: 2` frontmatter on deck creation
- New decks now marked as v2 format

### `components/SlidePreview.tsx`
- Changed `revealStep` from `presentation.currentReveal` to `999`
- Editor now shows all content (reveals only matter in presentation mode)

### `docs/sample-deck.md`
- Added `v: 2` frontmatter at end of file

## Technical Notes

### Frontmatter Format
```yaml
---
v: 2
images:
  "Image description":
    active: uploaded
    uploaded: https://...
---
```

### Prompt Design Principles Applied
1. **Hybrid structure** - Markdown headers + XML tags for clarity
2. **Shared reference** - DRY principle, one source of truth for format
3. **Golden examples** - "Pictures worth 1000 words"
4. **Right altitude** - Not too rigid, not too vague
5. **Clear success criteria & constraints**

### Grid Visibility Logic
```typescript
// GridCard checks visibility
const isVisible = (item.revealOrder ?? 0) <= revealStep;

// Editor: revealStep=999 (show all)
// Presenter: revealStep=currentReveal (progressive)
```

## Known Issues Resolved
- ✅ Duplicate frontmatter blocks
- ✅ Version lost on image operations
- ✅ New decks flagged as legacy
- ✅ Grid items hidden in editor
- ✅ Prompts lacked design guidance
