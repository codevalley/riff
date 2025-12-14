# Session 11: Landing Page Showcase & Frontmatter Migration

**Date:** 2025-12-14

## Summary

Added an embedded Riff slideshow to the landing page ("Riff used to present Riff") and migrated YAML frontmatter from top to bottom of markdown files for better editing UX.

## Features Implemented

### 1. Landing Page Showcase Section
**File:** `app/components/Landing.tsx`

New section after "How it works" featuring an embedded Riff deck:
- Title: "See it in action"
- Subtitle: "This presentation was made with Riff"
- Embedded iframe pointing to `/embed/8uAo54Y_eFy-`
- Radial dot background pattern with fade mask
- Animated reveal on scroll (motion.div)
- Helper text: "Use arrow keys or click to navigate"

### 2. YAML Frontmatter at Bottom
**File:** `app/lib/parser.ts`

Moved frontmatter from top to bottom of markdown for better editing UX:

**Before:**
```markdown
---
images:
  "description": { ... }
---

# Slide content
```

**After:**
```markdown
# Slide content

---
images:
  "description": { ... }
---
```

### 3. Frontmatter Merge & Cleanup
**File:** `app/lib/parser.ts`

Robust handling of multiple/orphaned YAML blocks:
- Finds ALL yaml blocks (top, bottom, inline)
- Merges all `images:` entries into one manifest
- Strips all yaml blocks from content body
- Removes orphaned `---\n---` separators
- Returns clean body + single merged frontmatter

### 4. Normalize on Publish
**File:** `app/api/decks/[id]/publish/route.ts`

When publishing:
- Calls `normalizeFrontmatter()` to ensure bottom position
- Saves normalized content back to blob storage
- Auto-migrates legacy decks on publish

### 5. Image Container Background Fix
**File:** `app/components/ImagePlaceholder.tsx`

Fixed random color showing when image doesn't fill frame:
- Added `bg-slide-bg` to image container
- Empty space now matches slide background color

## Files Modified

| File | Changes |
|------|---------|
| `components/Landing.tsx` | Added showcase section with embedded deck |
| `lib/parser.ts` | Frontmatter extraction/serialization at bottom, merge logic |
| `api/decks/[id]/publish/route.ts` | Normalize frontmatter on publish, save to blob |
| `components/ImagePlaceholder.tsx` | Added `bg-slide-bg` to image container |
| `docs/yaml-frontmatter.md` | Updated examples to show bottom position |
| `docs/how-riff-works.md` | Long-form content for the showcase deck |

## Technical Details

### Frontmatter Extraction Logic
```typescript
export function extractFrontmatter(content: string) {
  // Find ALL yaml blocks and merge them
  const yamlBlockRegex = /\n---\n(images:[\s\S]*?)\n---/g;
  const mergedImages: ImageManifest = {};

  // Check top (legacy) and all bottom/inline blocks
  // Merge into single manifest
  // Clean body of all yaml blocks
  // Return { frontmatter, body }
}
```

### Serialization (Bottom Position)
```typescript
function serializeFrontmatter(frontmatter: Frontmatter): string {
  return `\n---\n${yaml.dump(frontmatter)}---`;
}

// Usage: body + serializeFrontmatter(frontmatter)
```

### Portability
Decks are fully portable - copying markdown (including YAML) to a new deck preserves images because:
- Blob URLs are public (no auth required)
- Parser extracts manifest from YAML
- ImagePlaceholder reads from manifestEntry

## New Files

| File | Purpose |
|------|---------|
| `docs/how-riff-works.md` | Long-form content explaining Riff features |

## Backward Compatibility

- **Load**: Parses both top and bottom frontmatter positions
- **Edit**: Saves with bottom format (auto-migrates on any image change)
- **Publish**: Explicitly normalizes to bottom (forced migration)
- **Multiple blocks**: Merges all into single clean block

---

## Landing Page Polish

### Navigation Links
Added header nav links for key sections:
- Demo → `#demo` (embedded deck)
- Features → `#features`
- Syntax → `#syntax`
- Editor → `/editor`

### Section Restructure
- **Hero section**: Now includes live editor preview (merged)
- **Demo section**: Embedded Riff deck ("See it in action")
- Reduced section gaps: `py-32` → `py-20`
- Grammar fix: "notes, documents, and ideas"

### Embed URL
Changed from relative to absolute URL for cross-environment support:
```tsx
src="https://www.riff.im/embed/8uAo54Y_eFy-"
```

---

## Embed Improvements
**File:** `components/EmbedClient.tsx`

### 1. Font Loading
Added Google Fonts import directly in embed:
```tsx
<style jsx global>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter...&family=Playfair+Display...');
`}</style>
```

### 2. Smart Scaling
Content now scales to fit iframe dimensions:
- Design size: 1280x720 (16:9)
- Calculates `Math.min(scaleX, scaleY, 1)`
- Uses CSS `transform: scale()` centered

### 3. Riff Badge
Added badge in bottom-left corner:
- RiffIcon + "Riff" text
- Links to https://www.riff.im
- Matches style of slide counter

## Files Modified (Additional)

| File | Changes |
|------|---------|
| `components/Landing.tsx` | Nav links, section IDs, restructure, reduced gaps |
| `components/EmbedClient.tsx` | Fonts, scaling, Riff badge |

---

## Theme Studio UI Polish
**File:** `components/ThemeCustomizer.tsx`

### Button Styling
Matched Theme button to ImageStyleSelector for consistent toolbar appearance:
- Smaller padding: `px-2.5 py-1.5` (was `px-3 py-2`)
- Smaller font: `text-xs` (was `text-sm`)
- Smaller icon: `w-3.5 h-3.5` (was `w-4 h-4`)
- Added `ChevronDown` indicator with rotation animation
- Added tooltip on hover

### Dropdown Positioning
Changed from fixed overlay to proper dropdown menu:
- Position: `absolute right-0 bottom-full mb-1.5` (was `fixed right-4 top-16`)
- Opens upward from button (matches Style dropdown behavior)
- Slightly narrower: `w-[340px]` (was `360px`)
- Animation slides up instead of down
- Max height: `70vh` for better viewport fit

### Active Theme
Retained "Active theme" section at bottom of panel:
- Green pulsing indicator
- Copy button with confirmation feedback
- Displays current theme prompt
