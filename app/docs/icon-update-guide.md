# Riff Icon Update Guide

This document explains where the Riff icon is used throughout the app and how to update it with a new icon.

## Icon Design

The Riff icon is a "stacked pages" design - two overlapping rounded rectangles representing presentation slides:
- **Front page**: Higher opacity (primary) - white
- **Back page**: Lower opacity, offset (secondary) - gray

Source file: `/riff-icon.svg` (project root)

---

## CRITICAL: Favicon Setup (Read This First!)

### The Next.js Convention File

**The favicon is controlled by: `app/app/icon.svg`**

This is a [Next.js App Router convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons). Next.js automatically serves this file as the favicon. No `<link>` tags or metadata configuration needed.

### Common Pitfalls (We Learned the Hard Way)

| Pitfall | Why It Happens | Solution |
|---------|----------------|----------|
| **Favicon not updating** | `app/app/icon.svg` exists and overrides everything | Update THIS file, not `public/icon.svg` |
| **Multiple conflicting sources** | Having `metadata.icons`, `<link>` tags, AND convention files | Use ONLY `app/app/icon.svg` |
| **Icon appears as gray blob** | Original 512x512 viewBox doesn't fill small favicon space | Use cropped viewBox: `viewBox="30 20 460 470"` |
| **Browser cache** | Old favicon cached | Hard refresh (`Cmd+Shift+R`) or incognito mode |

### Correct Favicon File Structure

```
app/
├── app/
│   └── icon.svg        ← THIS IS THE FAVICON (Next.js convention)
├── public/
│   └── (no icon.svg)   ← Don't put favicon here, it gets ignored
└── ...
```

### What NOT to Do

```tsx
// ❌ DON'T add this to layout.tsx - Next.js handles it automatically
<link rel="icon" href="/icon.svg" type="image/svg+xml" />

// ❌ DON'T add this to metadata - conflicts with convention file
export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};

// ❌ DON'T create these - they conflict with icon.svg
app/app/icon.tsx      // Dynamic generation
app/app/icon.png      // Static PNG
public/icon.svg       // Gets ignored when app/app/icon.svg exists
```

---

## All Icon Locations

### 1. Favicon (Browser Tab) ⚠️ MOST IMPORTANT
**File:** `app/app/icon.svg`

This is the Next.js convention file. It MUST use a cropped viewBox to display properly at small sizes (16x16, 32x32).

```svg
<!-- Cropped viewBox for favicon visibility -->
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="30 20 460 470" fill="none">
  <rect x="30" y="20" width="460" height="470" rx="60" fill="#0a0a0a"/>
  <!-- paths here -->
</svg>
```

### 2. Reusable Component
**File:** `app/components/RiffIcon.tsx`

React component for use in headers, footers, etc. Uses full 512x512 viewBox since it renders at larger sizes.

```tsx
import { RiffIcon } from '@/components/RiffIcon';

<RiffIcon
  size={26}
  primaryColor="rgba(255, 255, 255, 0.9)"
  secondaryColor="rgba(255, 255, 255, 0.5)"
/>
```

### 3. OpenGraph & Twitter Images
**Files:**
- `app/app/opengraph-image.tsx` - Main OG image (1200x630)
- `app/app/twitter-image.tsx` - Main Twitter card
- `app/app/p/[token]/opengraph-image.tsx` - Shared deck OG image
- `app/app/p/[token]/twitter-image.tsx` - Shared deck Twitter card

These use inline SVG (not the component) because Next.js `ImageResponse` doesn't support React components.

### 4. App Header & Footer
**Files:**
- `app/components/Landing.tsx` - Nav bar (size={26}) and footer (size={20})
- `app/app/editor/page.tsx` - Editor header (size={26})

Uses the `RiffIcon` component.

### 5. Attribution Badge
**File:** `app/components/RiffBadge.tsx`

"Made with Riff" badge shown on shared presentations. Uses inline SVG with hover color transitions.

---

## How to Update the Icon

### Step 1: Create Your New Icon

Design your icon as an SVG with a 512x512 viewBox. You need two path elements:
- Path 1: Back page (secondary, lower opacity)
- Path 2: Front page (primary, higher opacity)

### Step 2: Update the Source File

Replace `/riff-icon.svg` (project root) with your new SVG.

### Step 3: Extract Path Data & Bounds

From your SVG:
1. Extract the `d` attribute values from each `<path>` element
2. **Calculate the bounding box** of your paths (min/max x and y coordinates)
3. Create a cropped viewBox for the favicon: `viewBox="minX minY width height"`

### Step 4: Update All Files

#### A. Favicon (CRITICAL - Update First)
**`app/app/icon.svg`**
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="YOUR_CROPPED_VIEWBOX" fill="none">
  <rect x="..." y="..." width="..." height="..." rx="60" fill="#0a0a0a"/>
  <path d="YOUR_BACK_PAGE_PATH" fill="#777777"/>
  <path d="YOUR_FRONT_PAGE_PATH" fill="#ffffff"/>
</svg>
```

#### B. React Component
**`app/components/RiffIcon.tsx`**
- Update the two `<path d="...">` elements
- Keep the full 512x512 viewBox

#### C. OpenGraph Images (4 files)
- `app/app/opengraph-image.tsx`
- `app/app/twitter-image.tsx`
- `app/app/p/[token]/opengraph-image.tsx`
- `app/app/p/[token]/twitter-image.tsx`

Update inline SVG path data. These can use the full 512x512 viewBox since they render large.

#### D. Attribution Badge
**`app/components/RiffBadge.tsx`**
- Update inline SVG path data
- Keep the 512x512 viewBox

### Step 5: Verify

1. **Kill the dev server completely** and restart: `npm run dev`
2. **Hard refresh** the browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Check in **incognito/private mode** if still seeing old icon
4. Verify these locations:
   - Browser tab favicon
   - Landing page header/footer
   - Editor header
   - "Made with Riff" badge on `/p/[token]` pages
   - OG images: use [Facebook Debugger](https://developers.facebook.com/tools/debug/) or [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

## Debugging Favicon Issues

### Favicon Not Updating?

1. **Check the right file**: `app/app/icon.svg` (NOT `public/icon.svg`)
2. **Check for conflicts**:
   ```bash
   # Find all icon-related files
   find app -name "icon.*" -o -name "apple-icon.*" -o -name "favicon.*"
   ```
3. **Check layout.tsx**: Remove any manual `<link rel="icon">` tags
4. **Check metadata**: Remove `icons` from `metadata` export
5. **Clear everything**:
   - Browser cache
   - Next.js cache: `rm -rf .next`
   - Restart dev server

### Icon Appears as Gray Blob?

Your paths don't fill the viewBox. Calculate the actual bounds of your paths and use a cropped viewBox:

```svg
<!-- ❌ BAD: Full viewBox, icon too small at favicon sizes -->
<svg viewBox="0 0 512 512">

<!-- ✅ GOOD: Cropped viewBox, icon fills the space -->
<svg viewBox="30 20 460 470">
```

---

## Color Guidelines

### Header/Nav (Dark Background)
```tsx
primaryColor="rgba(255, 255, 255, 0.9)"
secondaryColor="rgba(255, 255, 255, 0.5)"
```

### Footer (Muted)
```tsx
primaryColor="rgba(255, 255, 255, 0.5)"
secondaryColor="rgba(255, 255, 255, 0.25)"
```

### Favicon (Solid for Visibility)
```svg
fill="#ffffff"   <!-- Front page -->
fill="#777777"   <!-- Back page -->
```

### Light Backgrounds
```tsx
primaryColor="rgba(0, 0, 0, 0.7)"
secondaryColor="rgba(0, 0, 0, 0.35)"
```

---

## SVG Path Data Reference

Current icon paths (original 512x512 viewBox, actual content spans ~60-452 x, ~42-469 y):

**Back page:**
```
M451.755 105.052L415.896 377.78C413.449 396.325 396.381 409.253 377.968 406.806L358.815 404.244L323.072 132.731C320.018 109.916 300.503 92.717 277.455 92.717C275.5 92.717 273.43 92.8328 271.476 93.0789L196.951 102.836L200.975 71.9718C203.422 53.4271 220.374 40.3837 238.903 42.8156L422.597 67.0932C441.141 69.5542 454.199 86.5066 451.753 105.051L451.755 105.052Z
```

**Front page:**
```
M346.87 407.08L310.982 134.352C308.55 115.836 291.554 102.793 273.039 105.225L89.3715 129.386C70.8557 131.819 57.8122 148.814 60.2441 167.329L96.132 440.057C98.5641 458.573 115.56 471.616 134.075 469.184L317.743 445.023C336.258 442.591 349.302 425.595 346.87 407.08Z
```

**Cropped viewBox for favicon:** `viewBox="30 20 460 470"`

---

## Quick Reference: Files to Update

| Location | File | ViewBox | Notes |
|----------|------|---------|-------|
| **Favicon** | `app/app/icon.svg` | Cropped | MOST IMPORTANT |
| Component | `app/components/RiffIcon.tsx` | Full 512 | React component |
| OG Image | `app/app/opengraph-image.tsx` | Full 512 | Inline SVG |
| Twitter | `app/app/twitter-image.tsx` | Full 512 | Inline SVG |
| Shared OG | `app/app/p/[token]/opengraph-image.tsx` | Full 512 | Inline SVG |
| Shared Twitter | `app/app/p/[token]/twitter-image.tsx` | Full 512 | Inline SVG |
| Badge | `app/components/RiffBadge.tsx` | Full 512 | Inline SVG |
| Landing | `app/components/Landing.tsx` | - | Uses RiffIcon |
| Editor | `app/app/editor/page.tsx` | - | Uses RiffIcon |
