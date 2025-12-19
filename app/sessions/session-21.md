# Session 21 - v3 Metadata System & .riff Export/Import

## Date: 2025-12-19

## Summary
Complete implementation of the v3 metadata architecture and portable deck format:
1. **v3 Metadata System** - Unified JSON storage for images, theme, and settings
2. **.riff Export/Import** - Portable deck format with full metadata
3. **Header Redesign** - Cleaner UI with better grouping and visual hierarchy
4. **Image Manifest Bug Fix** - Fixed random image disappearance in v3 decks

## Phase 1: v3 Metadata Architecture

### Problem
- Images stored in markdown frontmatter → unnecessary LLM context
- Theme and images in separate storage → complex to manage
- No theme history → can't revert to previous themes without regeneration

### Solution
Unified metadata JSON at `users/{userId}/themes/{deckId}.json`:

```typescript
interface DeckMetadataV3 {
  v: 3;
  images?: ImageManifest;
  theme?: ThemeData;
  themeHistory?: ThemeData[];  // For theme quantization
  settings?: DeckSettings;
}
```

### Files Modified
- `lib/types.ts` - Added `DeckMetadataV3`, `ThemeData`, `DeckSettings`, `RiffExport`
- `lib/blob.ts` - Added `getMetadata`, `saveMetadata`, `updateThemeInMetadata`, `applyThemeFromHistory`, `updateImagesInMetadata`
- `lib/parser.ts` - Added `stripFrontmatter`, `extractFrontmatterForMigration`, updated `isLegacyDeck()`
- `app/api/decks/[id]/route.ts` - Returns metadata, migrates frontmatter to JSON on save

## Phase 2: .riff Export/Import

### Problem
With v3, pasting markdown alone doesn't include images/theme. Need portable format.

### Solution
`.riff` file format - JSON bundle with `.riff` extension:

```typescript
interface RiffExport {
  format: 'riff-v1';
  name: string;
  content: string;           // Clean markdown (no frontmatter)
  metadata: DeckMetadataV3;  // Full metadata
  exportedAt: string;        // ISO timestamp
}
```

### Files Created
- `app/api/decks/[id]/export/route.ts` - GET endpoint for .riff download
- `app/api/decks/import/route.ts` - POST endpoint for .riff upload
- `app/api/decks/[id]/images/route.ts` - PATCH/PUT for image metadata updates

### User Flow
- **Export**: Click "Download" → browser downloads `{deck-name}.riff`
- **Import**: Click "New" → "Open .riff file" → select file → deck imported

## Phase 3: Header Redesign

### Problems with Old Header
- Too crowded with 4 buttons + labels side by side
- No visual hierarchy - all buttons looked equally important
- Harsh white separators
- Center positioning felt awkward

### New Design (Swiss Modernism + Dark Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ [Riff]  [Deck ▼]  [+ New ▼]           [⬇][Publish] │ 💰 👤 [◫]
│  Logo    Selector   Dropdown            Actions      User  View
└─────────────────────────────────────────────────────────────┘
```

### Key Changes
| Before | After |
|--------|-------|
| 4 separate buttons | Single "New" dropdown with all options |
| White `border-border/50` | No border, `bg-background/98` |
| Separate New + chevron | Single click dropdown |
| `Download` icon | `CloudDownload` icon |
| Editor toggle in middle | Far right edge (view control) |
| Harsh separators | Subtle `bg-white/[0.08]` only where needed |

### Dropdown Menu
```
┌──────────────────────┐
│ 📄 Blank deck        │
│ 🔗 From document     │
│ ─────────────────    │
│ 📂 Open .riff file   │
└──────────────────────┘
```

### Files Modified
- `app/editor/page.tsx` - Complete header redesign, dropdown with AnimatePresence
- `components/CreditsDisplay.tsx` - Fixed tooltip positioning, removed triangle

## Phase 4: Image Manifest Bug Fix

### Problem
Images randomly disappeared in v3 decks, but were present in metadata JSON.

### Root Cause
Multiple components re-parse content on changes:
```javascript
// SlideEditor, SlidePreview, etc.
const parsed = parseSlideMarkdown(localContent);
setParsedDeck(parsed);  // ← Overwrote imageManifest!
```

For v3 decks, `parseSlideMarkdown()` returns **empty imageManifest** (no frontmatter). This overwrote the correctly loaded manifest from metadata JSON.

### Solution
Modified `setParsedDeck` in store to preserve existing imageManifest:

```javascript
// lib/store.ts
setParsedDeck: (deck) => {
  const { parsedDeck: existingDeck } = get();

  // Preserve existing imageManifest if new one is empty
  const newManifestIsEmpty = !deck.imageManifest || Object.keys(deck.imageManifest).length === 0;
  const existingManifestHasData = existingDeck?.imageManifest && Object.keys(existingDeck.imageManifest).length > 0;

  const preservedImageManifest = (newManifestIsEmpty && existingManifestHasData)
    ? existingDeck.imageManifest  // Keep existing
    : deck.imageManifest;         // Use new

  set({
    parsedDeck: { ...deck, imageManifest: preservedImageManifest },
    ...
  });
}
```

### Files Modified
- `lib/store.ts` - Smart imageManifest preservation in `setParsedDeck`

## Legacy Detection Update

### Before
`isLegacyDeck()` returned true for any deck without `v: 2` in frontmatter, incorrectly flagging v3 decks.

### After
Only returns true if deck has embedded images WITHOUT `v: 2` marker:
```javascript
// lib/parser.ts
export function isLegacyDeck(content: string): boolean {
  const { frontmatter } = extractFrontmatter(content);
  if (frontmatter.v === 2) return false;  // v2 format
  if (frontmatter.images && Object.keys(frontmatter.images).length > 0) return true;  // v1 legacy
  return false;  // v3 or empty
}
```

## Data Flow Summary

### Loading a Deck (v3)
1. `GET /api/decks/[id]` returns `{ content, metadata }`
2. `loadDeck()` parses content, merges `metadata.images` into `parsedDeck.imageManifest`
3. Store preserves imageManifest on subsequent re-parses

### Updating an Image (v3)
1. `handleImageChange()` calls `PATCH /api/decks/[id]/images`
2. API updates metadata JSON in blob storage
3. Store updates `parsedDeck.imageManifest` in place

### Exporting
1. `GET /api/decks/[id]/export` fetches content + metadata
2. Returns JSON with `Content-Disposition: attachment; filename="name.riff"`

### Importing
1. `POST /api/decks/import` receives .riff JSON
2. Creates new deck with unique ID
3. Saves content to blob, metadata to JSON

## Files Changed Summary

### Created
- `app/api/decks/[id]/export/route.ts`
- `app/api/decks/import/route.ts`
- `app/api/decks/[id]/images/route.ts`

### Modified
- `lib/types.ts` - v3 types, RiffExport
- `lib/blob.ts` - Metadata operations
- `lib/parser.ts` - stripFrontmatter, isLegacyDeck fix
- `lib/store.ts` - imageManifest preservation
- `app/editor/page.tsx` - Header redesign, export/import UI
- `app/api/decks/[id]/route.ts` - Returns metadata, migration
- `components/CreditsDisplay.tsx` - Tooltip fix
