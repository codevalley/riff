# Session 24: Multi-Format Export (PDF, PPTX, .riff)

## Date: 2025-12-21

## Summary

Added comprehensive export functionality with three formats:
1. **.riff** - Existing JSON backup format (free)
2. **PDF** - High-fidelity document with custom fonts (@react-pdf/renderer)
3. **PPTX** - Native PowerPoint presentation (pptxgenjs) - Beta

Key challenges solved:
- Dynamic Google Fonts fetching for PDF export
- Theme CSS parsing for colors and typography
- Server-side image pre-fetching and base64 embedding
- Credits integration (2 credits for PDF/PPTX)

---

## Part 1: Architecture Overview

### Export Flow
```
Editor Toolbar (ExportDropdown)
         |
         +-- .riff --> /api/decks/[id]/export (existing, free)
         +-- PDF  --> /api/decks/[id]/export/pdf (new, 2 credits)
         +-- PPTX --> /api/decks/[id]/export/pptx (new, 2 credits, beta)
```

### Technology Choices

| Format | Library | Rationale |
|--------|---------|-----------|
| PDF | `@react-pdf/renderer` | React-native, serverless-friendly, no Puppeteer |
| PPTX | `pptxgenjs` | Pure JS, native PowerPoint, well-maintained |

Both run server-side to avoid CORS issues with blob image URLs.

---

## Part 2: Export Utilities (`lib/export/`)

### `theme-parser.ts` - CSS Variable Parsing

Parses theme CSS to extract design tokens:

```typescript
interface ParsedTheme {
  bgPrimary: string;      // --color-bg1, --slide-bg
  bgSecondary: string;    // --color-bg2, --slide-surface
  textPrimary: string;    // --color-fg1, --slide-text
  textSecondary: string;  // --color-fg2, --slide-muted
  accent: string;         // --slide-accent
  fontDisplay: string;    // --font-f1
  fontBody: string;       // --font-f2
  fontMono: string;       // JetBrains Mono (default)
}
```

Features:
- Handles hex, rgb(), rgba(), hsl() color formats
- Resolves `var()` references recursively
- Extracts first font family from comma-separated lists
- Falls back to dark theme defaults

### `image-utils.ts` - Server-Side Image Fetching

```typescript
// Fetch all images from slides in parallel
async function fetchAllImages(
  slides: Slide[],
  manifest: ImageManifest
): Promise<ImageCache>
```

Features:
- Fetches from blob URLs with 10s timeout
- Validates magic bytes (PNG: 0x89504E47, JPEG: 0xFFD8)
- Converts to base64 for embedding
- Handles missing images with placeholder fallback
- Respects `active` slot from image manifest

### `font-registry.ts` - Dynamic Google Fonts

The most challenging part - getting custom fonts into react-pdf:

```typescript
// Fetch CSS from Google Fonts API
const cssUrl = `https://fonts.googleapis.com/css?family=Font+Name:400,500,600,700`;

// Parse @font-face blocks to extract TTF URLs
const fontFaceRegex = /@font-face\s*\{[\s\S]*?\}/g;
const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.ttf)\)/);

// Fetch TTF, convert to base64, register with react-pdf
const base64 = Buffer.from(arrayBuffer).toString('base64');
Font.register({ family, src: `data:font/truetype;base64,${base64}` });
```

**Key Discovery**: Google Fonts returns different formats based on User-Agent:
- No User-Agent (like curl) → TTF format (what react-pdf needs)
- Browser User-Agent → woff2 with unicode subsets (complex, doesn't work)

**Solution**: Don't send User-Agent header at all.

### `slide-to-pdf.tsx` - React-PDF Components

Maps slide elements to PDF primitives:

| Slide Element | PDF Component |
|---------------|---------------|
| title | `<Text style={styles.title}>` |
| subtitle | `<Text style={styles.subtitle}>` |
| text/body | `<Text style={styles.text}>` |
| quote | `<View>` with border-left accent |
| code | `<View>` with mono font, bg |
| image | `<Image src={base64}>` |
| list | `<View>` with bullet Text |
| grid | Flexbox-wrapped cards |

Features:
- `wrap={false}` on all elements to prevent page breaks
- MAX_IMAGE_HEIGHT = 180px to prevent overflow
- Markdown formatting (**bold**, *italic*, `code`)
- Slide numbers in footer

### `slide-to-pptx.ts` - PowerPoint Generation

Maps slides to native PowerPoint using pptxgenjs:

```typescript
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_16x9';

slides.forEach((slide, index) => {
  const pptSlide = pres.addSlide();
  pptSlide.background = { color: toColor(theme.bgPrimary) };
  // Add text, images, shapes...
});

return pres.write({ outputType: 'arraybuffer' });
```

Features:
- 16:9 layout (10" × 5.625")
- Theme colors applied to backgrounds and text
- Split layouts (image left/right)
- Grid layouts as positioned cards
- Quote bars as accent-colored rectangles

---

## Part 3: API Routes

### `/api/decks/[id]/export/pdf/route.ts`

```typescript
// 1. Auth + fetch deck
const deck = await prisma.deck.findFirst({ where: { id, ownerId } });

// 2. Parse content and theme
const parsed = parseSlideMarkdown(rawContent);
const theme = parseThemeCSS(metadata?.theme?.css);

// 3. Fetch images in parallel
const imageCache = await fetchAllImages(parsed.slides, metadata?.images);

// 4. Create PDF (async - registers fonts)
const pdfDocument = await createPdfDocument(parsed.slides, theme, imageCache);

// 5. Render to buffer
const pdfBuffer = await renderToBuffer(pdfDocument);

// 6. Return with Content-Disposition
return new NextResponse(pdfBuffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${name}.pdf"`,
  },
});
```

### `/api/decks/[id]/export/pptx/route.ts`

Same flow but uses `generatePptxBuffer()` and returns with:
```typescript
'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
```

### `/api/credits/deduct/route.ts`

New endpoint for deducting credits after export:

```typescript
POST /api/credits/deduct
Body: { amount: 2, description: "PDF export" }

// Validates amount > 0, checks balance, creates transaction
const result = await deductCredits(userId, amount, description);

// Returns 402 if insufficient credits
if (isInsufficientCreditsError(result)) {
  return NextResponse.json(result, { status: 402 });
}
```

---

## Part 4: ExportDropdown Component

Replaces the single download button with a dropdown:

```typescript
const EXPORT_OPTIONS = [
  { id: 'riff', label: '.riff', credits: 0 },
  { id: 'pdf', label: 'PDF', credits: 2 },
  { id: 'pptx', label: 'PowerPoint', credits: 2, badge: 'Beta' },
];
```

Features:
- Checks credit balance before export
- Shows credit cost with Coins icon
- Triggers InsufficientCreditsModal if needed
- Loading spinner per format
- Completion checkmark animation
- Deducts credits after successful download
- Refreshes balance via `refetch()`

---

## Part 5: Editor Integration

### Changes to `app/editor/page.tsx`

- Removed `exportRiff()` function and `isExporting` state
- Removed `CloudDownload` icon import
- Added `ExportDropdown` component import
- Replaced download button with:
  ```tsx
  <ExportDropdown deckId={currentDeckId} deckName={currentDeck.name} />
  ```

---

## Part 6: Font Registry Deep Dive

### Problem
PDF exported with Helvetica/Courier instead of Playfair Display, Source Serif Pro.

### Investigation
Console logs showed:
```
[Font Registry] Found URLs for Playfair Display: {}
[Font Registry] No fonts found for: Playfair Display
```

But curl to same URL worked perfectly.

### Root Causes Found

1. **User-Agent Paradox**
   - With browser User-Agent → Google returns woff2 with unicode subsets
   - Without User-Agent → Google returns simple TTF files

2. **Weight Syntax**
   - Wrong: `400;500;600;700` (semicolons)
   - Right: `400,500,600,700` (commas)

3. **URL Encoding**
   - Wrong: `Playfair%20Display`
   - Right: `Playfair+Display`

### Solution

```typescript
// Don't send User-Agent - gets TTF format
const response = await fetch(cssUrl, {
  signal: AbortSignal.timeout(10000),
});

// Comma-separated weights, + for spaces
const weightStr = weights.join(',');
const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
```

---

## Files Summary

### New Files Created

| File | Purpose |
|------|---------|
| `components/ExportDropdown.tsx` | Dropdown UI with format options |
| `lib/export/index.ts` | Barrel export |
| `lib/export/theme-parser.ts` | CSS variable parsing |
| `lib/export/image-utils.ts` | Server-side image fetching |
| `lib/export/font-registry.ts` | Google Fonts registration |
| `lib/export/slide-to-pdf.tsx` | React-PDF components |
| `lib/export/slide-to-pptx.ts` | pptxgenjs generation |
| `app/api/decks/[id]/export/pdf/route.ts` | PDF export endpoint |
| `app/api/decks/[id]/export/pptx/route.ts` | PPTX export endpoint |
| `app/api/credits/deduct/route.ts` | Credits deduction endpoint |

### Modified Files

| File | Changes |
|------|---------|
| `package.json` | Added @react-pdf/renderer, pptxgenjs |
| `app/editor/page.tsx` | Replaced download button with ExportDropdown |

---

## Dependencies Added

```json
{
  "@react-pdf/renderer": "^4.3.1",
  "pptxgenjs": "^4.0.1"
}
```

---

## Credits Integration

| Export Format | Cost | Notes |
|---------------|------|-------|
| .riff | Free | JSON backup, always available |
| PDF | 2 credits | ~$0.10 |
| PPTX | 2 credits | ~$0.10, Beta |

Credits are deducted after successful download, not before (prevents charging for failed exports).

---

## Limitations

1. **Background effects** - Glow, retrogrid → solid color only
2. **Animations** - Static in exports
3. **Custom fonts** - Must be on Google Fonts
4. **Speaker notes** - Not exported (future enhancement)

---

## Key Insights

1. **Google Fonts Detection**: The API uses User-Agent to decide format. Counter-intuitively, "dumber" clients get simpler TTF while browsers get optimized woff2.

2. **Base64 vs URL**: react-pdf/fontkit struggles with URL-based fonts in server environments. Base64 data URIs are more reliable.

3. **Magic Byte Validation**: TTF starts with `0x00010000`, OTF with `OTTO`, PNG with `0x89504E47`, JPEG with `0xFFD8`.

4. **wrap={false}**: Critical for react-pdf to prevent automatic page breaks mid-element.

---

## Status

### Complete
- [x] ExportDropdown component with 3 formats
- [x] PDF export with @react-pdf/renderer
- [x] PPTX export with pptxgenjs (Beta)
- [x] Theme CSS parsing
- [x] Server-side image fetching
- [x] Dynamic Google Fonts registration
- [x] Credits integration (2 credits for PDF/PPTX)
- [x] Credits deduction API
- [x] Editor integration
