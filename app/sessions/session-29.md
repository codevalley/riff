# Session 29: OpenGraph Improvements & Semantic Share URLs

## Date: 2026-01-01

## Summary

Improved shared deck presentation with themed OG images, AI-generated descriptions, and human-readable share URLs (`/p/politics-behind-the-font-f38u` instead of `/p/F38UslfEluas`).

---

## Part 1: OG Image Theming Bug Fix ✅

### Problem

OG images weren't picking up deck theme colors because:
1. API returns nested structure: `{ theme: { v: 3, theme: { css: "..." } } }`
2. OG image was checking `data.theme?.css` instead of `data.theme?.theme?.css`
3. CSS variables like `--slide-bg: var(--color-bg1)` weren't being resolved

### Solution

**File:** `app/p/[token]/opengraph-image.tsx`

1. Fixed nested path access:
```typescript
if (data.theme?.theme?.css) {
  colors = parseThemeColors(data.theme.theme.css);
}
```

2. Enhanced `extractCSSVar()` to resolve variable references:
```typescript
function extractCSSVar(css: string, varName: string): string | null {
  const regex = new RegExp(`${varName}:\\s*([^;]+)`);
  const match = css.match(regex);
  if (!match) return null;

  let value = match[1].trim();

  // Resolve var() references (e.g., var(--color-bg1) → actual value)
  const varRef = value.match(/var\(--([^)]+)\)/);
  if (varRef) {
    const refName = `--${varRef[1]}`;
    const refRegex = new RegExp(`${refName}:\\s*([^;]+)`);
    const refMatch = css.match(refRegex);
    if (refMatch) {
      value = refMatch[1].trim();
    }
  }

  return value;
}
```

---

## Part 2: AI-Generated Descriptions ✅

### Problem

OG description was generic "A presentation shared on Riff" - not content-aware.

### Solution

Extended the LLM metadata generation to produce descriptions.

**File:** `lib/prompts.ts`

Added `description` to DECK_METADATA_PROMPT output:
```typescript
{
  "title": "Short punchy deck title (3-6 words)",
  "description": "One compelling sentence summarizing the deck (15-25 words)",
  "themePrompt": "...",
  "imageContext": "..."
}
```

Rules added:
- Focus on WHAT the content is about
- Do NOT mention "Riff", "presentation", or "slides"
- Write as if describing an article

**File:** `lib/types.ts`

```typescript
export interface DeckMetadataV3 {
  v: 3;
  description?: string;  // NEW
  // ...existing fields
}
```

**File:** `app/p/[token]/page.tsx`

Uses description in OG tags with fallback:
```typescript
let description = 'A presentation made with Riff';
if (deck.publishedTheme) {
  const meta = JSON.parse(deck.publishedTheme);
  if (meta.description) {
    description = meta.description;
  }
}
```

---

## Part 3: Semantic Share URLs ✅

### Problem

Share URLs were gibberish: `riff.im/p/F38UslfEluas`

### Solution

New format: `riff.im/p/politics-behind-the-font-f38u`

**Step 3.1: Database Schema**

**File:** `prisma/schema.prisma`

```prisma
model Deck {
  shareToken       String?   @unique  // Legacy random token
  shareSlug        String?   @unique  // NEW: slugified-title-xxxx

  @@index([shareSlug])
}
```

**Step 3.2: Slug Generator**

**File:** `lib/utils.ts`

```typescript
export function generateShareSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special chars (including emojis)
    .replace(/\s+/g, '-')       // Spaces to hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .substring(0, 50)           // Limit length
    .replace(/^-|-$/g, '');     // Trim hyphens

  const shortId = nanoid(4).toLowerCase();

  if (!slug) return shortId;
  return `${slug}-${shortId}`;
}
```

**Step 3.3: Generate on Publish**

**File:** `app/api/decks/[id]/publish/route.ts`

```typescript
let shareSlug = deck.shareSlug;
if (!shareSlug) {
  shareSlug = generateShareSlug(deck.name);
  // Handle collision
  const existing = await prisma.deck.findUnique({ where: { shareSlug } });
  if (existing) {
    shareSlug = generateShareSlug(deck.name);
  }
}
```

**Step 3.4: All Routes Support Both Formats**

Updated all routes to query by slug OR token:
```typescript
const deck = await prisma.deck.findFirst({
  where: {
    OR: [
      { shareSlug: token },
      { shareToken: token },
    ],
  },
});
```

Files updated:
- `app/p/[token]/page.tsx`
- `app/p/[token]/opengraph-image.tsx`
- `app/api/shared/[token]/route.ts`
- `app/api/shared/[token]/view/route.ts`
- `app/embed/[token]/page.tsx`

**Step 3.5: UI Updated**

**File:** `components/sharing/PublishPopover.tsx`

- Added `shareSlug` to `PublishStatus` interface
- `getShareUrl()` prefers slug over token
- `getEmbedCode()` uses slug for embed URLs
- Fixed URL overflow with `min-w-0` on flex container

---

## Files Modified Summary

| File | Change |
|------|--------|
| `app/p/[token]/opengraph-image.tsx` | Fixed nested theme path + CSS var resolution |
| `lib/prompts.ts` | Added `description` to DECK_METADATA_PROMPT |
| `lib/types.ts` | Added `description` to DeckMetadataV3 |
| `app/api/save-deck/route.ts` | Store description in metadata |
| `app/p/[token]/page.tsx` | Use description in OG tags + slug/token lookup |
| `prisma/schema.prisma` | Added `shareSlug` field with index |
| `lib/utils.ts` | Added `generateShareSlug()` function |
| `app/api/decks/[id]/publish/route.ts` | Generate slug on publish |
| `app/api/shared/[token]/route.ts` | Slug/token lookup |
| `app/api/shared/[token]/view/route.ts` | Slug/token lookup |
| `app/embed/[token]/page.tsx` | Slug/token lookup |
| `components/sharing/PublishPopover.tsx` | UI shows slug URLs + overflow fix |
| `components/DocumentUploader.tsx` | Pass description to save-deck |

---

## Migration Notes

- **No migration needed** for existing decks
- Old token URLs (`/p/F38UslfEluas`) → **308 permanent redirect** to slug URL
- New publishes automatically get slug URLs
- `OR` query handles both formats seamlessly

### Permanent Redirect (308)

When accessing via legacy token URL, the page now redirects to the slug URL:

```typescript
// 308 permanent redirect from legacy token URL to SEO-friendly slug URL
if (deck?.shareSlug && token === deck.shareToken) {
  permanentRedirect(`/p/${deck.shareSlug}`);
}
```

This preserves SEO link equity from any existing backlinks.

---

## Remaining / Deferred

### OG Image Custom Fonts

**Status:** Deferred

OG images pick up theme colors but not custom typefaces. Implementing fonts in `ImageResponse` (Satori) requires:
- Loading font files dynamically based on theme
- Mapping CSS font-family to actual font data
- Bundling or fetching font files at build/runtime

Complexity vs benefit doesn't justify implementation now.

---

## Technical Insights

1. **Flexbox truncation**: `truncate` class won't work in flex containers unless parent has `min-w-0` (overrides `min-width: auto` default)

2. **CSS variable resolution**: Theme CSS uses references like `--slide-bg: var(--color-bg1)`. Simple regex extraction misses these - need recursive resolution.

3. **Prisma migration in non-interactive terminals**: `prisma migrate dev` requires interactive input. Use `prisma db push` for quick local changes or create migration files manually with `migrate resolve --applied`.
