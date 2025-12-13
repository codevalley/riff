# Session 07: Go to Market - Sharing & Embedding

**Date:** 2025-12-13

## Summary

Implemented comprehensive sharing and embedding features for Riff presentations. Users can now share decks with rich social previews (themed OG images) and embed presentations anywhere via iframe. Created the Embed Lab test page for local development.

## Problem Statement

Previously:
- Shared decks had generic OG images (no personalization)
- No way to embed presentations in external sites
- No theme support in social previews
- Missing oEmbed for rich platform integration

## What Was Built

### 1. Dynamic OG Images (Theme-Aware)

**Files Created:**
- `app/p/[token]/opengraph-image.tsx` - Dynamic OG image generator
- `app/p/[token]/twitter-image.tsx` - Twitter card image generator

**Features:**
- Extracts theme colors from published deck (`--slide-bg`, `--slide-text`, `--slide-accent`)
- Adaptive font sizing for long titles (72px → 48px based on length)
- Title truncation at 80 chars with ellipsis
- Light/dark contrast detection for logo
- Accent bar and glow effect using theme accent color

### 2. Embed Route

**Files Created:**
- `app/embed/[token]/page.tsx` - Iframe-optimized embed page
- `components/EmbedClient.tsx` - Minimal presenter component

**Features:**
- Clean, chrome-free interface
- Navigation: arrows, click, swipe, keyboard
- Progress bar + slide counter
- `robots: noindex, nofollow`
- `?slide=N` query param support

### 3. CORS Configuration

**Files Modified:**
- `next.config.js` - Added headers for embed route

```javascript
headers: [
  {
    source: '/embed/:token*',
    headers: [
      { key: 'X-Frame-Options', value: 'ALLOWALL' },
      { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
    ],
  },
]
```

### 4. oEmbed Endpoint

**Files Created:**
- `app/api/oembed/route.ts` - oEmbed JSON API

**Endpoint:** `GET /api/oembed?url={encoded_url}`

Returns rich embed data for platforms like Medium, Notion, etc.

### 5. ShareDialog Enhancement

**Files Modified:**
- `components/sharing/ShareDialog.tsx` - Added embed code generator

**Features:**
- Collapsible "Embed this presentation" section (visible after publish)
- Size selector: Small (480x270), Medium (640x360), Large (960x540)
- Code preview with copy button

### 6. Enhanced Metadata

**Files Modified:**
- `app/p/[token]/page.tsx` - Full OG/Twitter metadata

Added:
- `og:type`, `og:url`, `og:site_name`
- `twitter:card: summary_large_image`
- `alternates.canonical`

### 7. Embed Lab (Test Page)

**Files Created:**
- `public/embed-test.html` - Developer testing tool

**Features:**
- Token input with live update
- OG image previews with refresh buttons
- All embed sizes displayed
- Quick links to all endpoints
- Beautiful dark theme matching Riff aesthetic

## Technical Decisions

1. **API Fetch in OG Images** (not Prisma)
   - Edge runtime doesn't support Prisma directly
   - Fetch from `/api/shared/[token]` instead
   - Works reliably in edge functions

2. **Theme Color Extraction**
   - Parse CSS variables from `publishedTheme`
   - Regex extraction: `--slide-bg`, `--slide-text`, `--slide-accent`, `--slide-muted`
   - Fallback to default dark theme if no theme

3. **Separate Opacity Handling**
   - Can't append hex codes to rgba() colors
   - Use `opacity` CSS property instead of color concatenation
   - Fixed "Missing )" parsing errors

4. **EmbedClient vs Presenter**
   - Simplified component without fullscreen, notes, overview
   - Touch/swipe support for mobile
   - Hover-to-show navigation arrows

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `app/p/[token]/opengraph-image.tsx` | Dynamic OG image (theme-aware) |
| `app/p/[token]/twitter-image.tsx` | Twitter card (theme-aware) |
| `app/embed/[token]/page.tsx` | Embed route |
| `components/EmbedClient.tsx` | Minimal embed presenter |
| `app/api/oembed/route.ts` | oEmbed API |
| `public/embed-test.html` | Embed Lab test page |
| `docs/share-feature.md` | Feature documentation |

### Modified Files
| File | Changes |
|------|---------|
| `app/p/[token]/page.tsx` | Enhanced metadata |
| `components/sharing/ShareDialog.tsx` | Embed code generator |
| `next.config.js` | CORS headers |

## Testing

1. Start dev server: `npm run dev`
2. Open Embed Lab: `http://localhost:3000/embed-test.html`
3. Enter share token, click "Update All"
4. Test OG images, embeds, and all endpoints

## Next Steps

- [ ] Create tutorial deck using Riff itself
- [ ] Test sharing on Twitter, LinkedIn, Slack
- [ ] Verify oEmbed works on Medium/Notion
- [ ] Consider adding first-slide preview option for OG images
