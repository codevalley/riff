# Theme Generation System

## Current Implementation

### Overview
The theme generator uses AI to create CSS custom properties from natural language prompts.

### Files Involved
- `lib/prompts.ts` - System prompt for AI
- `app/api/generate-theme/route.ts` - API endpoint
- `app/globals.css` - Default theme variables
- `components/ThemeCustomizer.tsx` - UI component

### Current CSS Output Structure

```css
:root {
  /* Primary Font (f1) - for titles and headings */
  --font-f1: '<display font>', system-ui, sans-serif;

  /* Secondary Font (f2) - for body text */
  --font-f2: '<body font>', system-ui, sans-serif;

  /* Foreground Colors (similar tones) */
  --color-fg1: <primary text color>;     /* Main text */
  --color-fg2: <secondary text color>;   /* Muted/subtle text */

  /* Background Colors */
  --color-bg1: <main background>;        /* Primary background */
  --color-bg2: <accent surface>;         /* Cards, grids, gradients */

  /* Derived variables for compatibility */
  --font-display: var(--font-f1);
  --font-body: var(--font-f2);
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --slide-bg: var(--color-bg1);
  --slide-text: var(--color-fg1);
  --slide-muted: var(--color-fg2);
  --slide-surface: var(--color-bg2);
  --slide-accent: var(--color-fg1);
  --glow-color: var(--color-bg2);
}
```

### Current Limitations

1. **No font weights** - All elements use browser defaults
2. **No size ratios** - Sizes are hardcoded in SlideRenderer
3. **No per-element font assignment** - Just "display" and "body" fonts
4. **No typography style guidance** - Serif vs sans-serif not specified
5. **Limited creative control** - Generator can't customize weights or assignments

---

## Improved Approach (v2)

### Philosophy
- **Defaults with flexibility**: Provide sensible defaults that the AI can creatively override
- **Complete typography system**: Fonts, weights, sizes, and assignments
- **Semantic mapping**: Each heading level has explicit font and weight

### Typography Hierarchy

| Element | Markdown | Default Font | Default Weight | Size Ratio |
|---------|----------|--------------|----------------|------------|
| Title | `#` | f1 (serif) | 300 (light) | 16x |
| H1 | `##` | f2 (sans) | 500 (medium) | 8x |
| H2 | `###` | f1 (serif) | 500 (medium) | 4x |
| H3 | body headings | f1 (serif) | 500 (medium) | 2x |
| Body | plain text | f2 (sans) | 400 (regular) | 1.5x |
| List | bullets | f2 (sans) | 400 (regular) | 1x |

### Default Font Pairing Strategy

```
f1 (Display/Serif): Used for impact and visual hierarchy
   - Title (#): Large, light weight for elegance
   - H2 (###): Medium weight for emphasis

f2 (Body/Sans): Used for readability
   - H1 (##): Headers that need clarity
   - Body text: Easy to read at smaller sizes
```

### New CSS Output Structure

```css
:root {
  /* ============================================ */
  /* FONTS                                        */
  /* ============================================ */

  /* Font Families */
  --font-f1: 'Playfair Display', Georgia, serif;
  --font-f2: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Assignments (which font for which element) */
  --font-title: var(--font-f1);           /* # */
  --font-h1: var(--font-f2);              /* ## */
  --font-h2: var(--font-f1);              /* ### */
  --font-h3: var(--font-f1);              /* grid/section headings */
  --font-body: var(--font-f2);            /* plain text, lists */

  /* Font Weights */
  --weight-title: 300;                    /* light - elegant titles */
  --weight-h1: 500;                       /* medium - clear headers */
  --weight-h2: 500;                       /* medium - emphasis */
  --weight-h3: 500;                       /* medium - subheadings */
  --weight-body: 400;                     /* regular - readable body */

  /* ============================================ */
  /* SIZE RATIOS (relative to base)               */
  /* ============================================ */

  --ratio-title: 16;                      /* # = 16x base */
  --ratio-h1: 8;                          /* ## = 8x base */
  --ratio-h2: 4;                          /* ### = 4x base (was 3x) */
  --ratio-h3: 2;                          /* headings = 2x base */
  --ratio-body: 1.5;                      /* body text = 1.5x base */
  --ratio-list: 1;                        /* lists = 1x base */

  /* Base size (1x) in presenting mode */
  --size-base: 1rem;

  /* ============================================ */
  /* COLORS                                       */
  /* ============================================ */

  /* Foreground Colors */
  --color-fg1: #ededed;                   /* Primary text */
  --color-fg2: #666666;                   /* Muted/secondary text */

  /* Background Colors */
  --color-bg1: #0a0a0a;                   /* Main background */
  --color-bg2: #1a1a1a;                   /* Surface/accent background */

  /* ============================================ */
  /* COMPATIBILITY ALIASES                        */
  /* ============================================ */

  --font-display: var(--font-f1);
  --slide-bg: var(--color-bg1);
  --slide-text: var(--color-fg1);
  --slide-muted: var(--color-fg2);
  --slide-surface: var(--color-bg2);
  --slide-accent: var(--color-fg1);
  --glow-color: var(--color-bg2);
}
```

### AI Generator Guidelines

The system prompt should instruct the AI to:

1. **Choose complementary font pairing**
   - f1: Distinctive display font (serif, display sans, decorative)
   - f2: Readable body font (clean sans-serif, humanist)

2. **Assign fonts creatively**
   - Default: f1 for title/h2/h3, f2 for h1/body
   - Can swap based on theme mood (e.g., all-sans for tech, all-serif for editorial)

3. **Select appropriate weights**
   - Light (300): Elegant, modern, large text
   - Regular (400): Body text, readability
   - Medium (500): Emphasis, subheadings
   - Semibold (600): Strong headers
   - Bold (700): Maximum impact

4. **Maintain size ratios**
   - Keep relative hierarchy (title > h1 > h2 > h3 > body)
   - Can adjust ratios for different moods (tighter for dense, looser for airy)

5. **Ensure color harmony**
   - fg1/fg2: Same hue family, different luminance
   - bg1/bg2: Complementary backgrounds
   - Good contrast for accessibility

### Example Theme Variations

#### Tech/Minimal
```css
--font-f1: 'Space Grotesk', sans-serif;
--font-f2: 'Inter', sans-serif;
--weight-title: 700;  /* Bold for impact */
--weight-h1: 600;
--color-bg1: #000000;
--color-fg1: #ffffff;
```

#### Editorial/Classic
```css
--font-f1: 'Playfair Display', serif;
--font-f2: 'Source Serif Pro', serif;
--weight-title: 400;  /* Regular, let the serif speak */
--weight-h1: 400;
--color-bg1: #faf9f7;
--color-fg1: #1a1a1a;
```

#### Playful/Creative
```css
--font-f1: 'Fraunces', serif;
--font-f2: 'Nunito', sans-serif;
--weight-title: 300;
--weight-body: 400;
--color-bg1: #1e1b4b;
--color-fg1: #fef3c7;
```

### Implementation Checklist

- [ ] Update `lib/prompts.ts` with new system prompt
- [ ] Update `SlideRenderer.tsx` to use CSS variables for weights
- [ ] Update `globals.css` with default weight/assignment variables
- [ ] Update `api/generate-theme/route.ts` to extract weight info
- [ ] Test with various theme prompts
- [ ] Update ThemeCustomizer quick styles

### Migration Notes

The new system is backwards compatible:
- Old themes (without weights) will use browser defaults
- New variables have fallbacks to current behavior
- Compatibility aliases maintain existing functionality
