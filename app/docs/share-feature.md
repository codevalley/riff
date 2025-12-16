# Riff Share & Embed Feature

This document describes the sharing and embedding capabilities for Riff presentations.

## Overview

Riff allows users to share their presentations publicly and embed them on external websites. The system uses a **publish model** where content is snapshotted at publish time, ensuring shared links always show a consistent version.

## Architecture

### Data Model

```prisma
model Deck {
  // ... other fields

  // Public sharing & publishing
  shareToken       String?   @unique  // nanoid(12) - used in URLs
  publishedContent String?   @db.Text // Markdown snapshot at publish time
  publishedTheme   String?   @db.Text // Theme JSON snapshot
  publishedAt      DateTime?          // Last publish timestamp
}
```

### Sharing Flow

1. **Share** → Creates a `shareToken` (deck not yet publicly accessible)
2. **Publish** → Captures `publishedContent` & `publishedTheme` snapshots, makes deck public
3. **View** → Anyone with the token can view at `/p/[token]`
4. **Republish** → Updates the snapshot with current content
5. **Revoke** → Clears token and published content, making deck private

## Capabilities

### 1. Public Share Page (`/p/[token]`)

Full-featured presentation viewer for shared decks.

**URL Pattern:** `https://www.riff.im/p/{shareToken}`

**Features:**
- Full presenter mode with all navigation options
- Theme support (published theme applied)
- Keyboard shortcuts, fullscreen, slide overview
- No authentication required
- "Made with Riff" branding badge (bottom-right)

### 2. Dynamic OG Images

Each shared deck generates its own Open Graph preview image that respects the deck's theme.

**Files:**
- `app/p/[token]/opengraph-image.tsx`
- `app/p/[token]/twitter-image.tsx`

**Image Specs:**
- Size: 1200x630 (standard OG dimensions)
- Content: Deck title with Riff branding
- Theme-aware: Uses `--slide-bg`, `--slide-text`, `--slide-accent` from theme
- Adaptive font sizing for long titles
- Playfair Display font

**Theme Integration:**
The OG image extracts these CSS variables from the published theme:
- `--slide-bg` → Background color
- `--slide-text` → Title text color
- `--slide-accent` → Accent bar at bottom + glow effect
- `--slide-muted` → Watermark color

**Automatic Preview:** When sharing on Twitter, LinkedIn, Slack, etc., the deck title appears in the preview card with theme colors.

### 3. Enhanced Metadata

The public share page includes full Open Graph and Twitter Card metadata:

```html
<meta property="og:type" content="article">
<meta property="og:url" content="https://www.riff.im/p/{token}">
<meta property="og:title" content="{Deck Name}">
<meta property="og:description" content="View '{Deck Name}' - a presentation shared on Riff">
<meta property="og:site_name" content="Riff">
<meta property="og:image" content="https://www.riff.im/p/{token}/opengraph-image">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{Deck Name}">
```

### 4. Embed Route (`/embed/[token]`)

Minimal, iframe-optimized viewer for embedding presentations.

**URL Pattern:** `https://www.riff.im/embed/{shareToken}`

**Features:**
- Clean, chrome-free interface
- Navigation: arrow keys, click, swipe
- Progress bar at bottom
- Slide counter (subtle, corner)
- Responsive to any iframe size
- `robots: noindex, nofollow` (embeds shouldn't be indexed)

**Query Parameters:**
- `?slide=N` - Start at specific slide (0-indexed)

**CORS Headers:** Configured in `next.config.js` to allow embedding on any domain:
```
X-Frame-Options: ALLOWALL
Content-Security-Policy: frame-ancestors *
```

### 5. oEmbed Endpoint (`/api/oembed`)

Implements the [oEmbed specification](https://oembed.com/) for rich embeds on platforms like Medium, Notion, and others.

**Endpoint:** `GET /api/oembed?url={encoded_url}`

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | Full URL of the shared presentation |
| `format` | No | Only `json` supported (default) |
| `maxwidth` | No | Maximum width (default: 640) |
| `maxheight` | No | Maximum height (default: 360) |

**Example Request:**
```
GET /api/oembed?url=https://riff.im/p/abc123xyz
```

**Example Response:**
```json
{
  "type": "rich",
  "version": "1.0",
  "title": "My Presentation",
  "provider_name": "Riff",
  "provider_url": "https://www.riff.im",
  "html": "<iframe src=\"https://www.riff.im/embed/abc123xyz\" width=\"640\" height=\"360\" frameborder=\"0\" allowfullscreen style=\"border-radius: 8px;\"></iframe>",
  "width": 640,
  "height": 360,
  "thumbnail_url": "https://www.riff.im/p/abc123xyz/opengraph-image",
  "thumbnail_width": 1200,
  "thumbnail_height": 630
}
```

### 6. Embed Code Generator (ShareDialog)

The share dialog includes an embed code generator that appears after publishing.

**UI Features:**
- Collapsible "Embed this presentation" section
- Size selector: Small (480x270), Medium (640x360), Large (960x540)
- Code preview with syntax highlighting
- One-click copy button
- Preview button (opens share URL in new tab)

**Generated Code:**
```html
<iframe
  src="https://www.riff.im/embed/{token}"
  width="640"
  height="360"
  frameborder="0"
  allowfullscreen
  style="border-radius: 8px;">
</iframe>
```

### 7. "Made with Riff" Badge

A floating branding badge appears on all shared presentations.

**File:** `components/RiffBadge.tsx`

**Features:**
- Fixed position (bottom-right corner)
- Glass-morphism design with dark gradient background
- Animated 4-square Riff icon (glows amber on hover)
- Playfair Display typography
- Smooth entrance animation (1.5s delay)
- Links to riff.im on click
- Subtle arrow indicator on hover

**Design Details:**
- Multi-layered shadows for depth
- Backdrop blur effect
- Staggered icon animation on hover
- Non-intrusive but memorable branding

### 8. Embed Lab (Test Page)

A developer tool for testing embed functionality locally.

**URL:** `http://localhost:3000/embed-test.html`

**Features:**
- Token input with live update
- OG image previews with refresh buttons
- All embed sizes (Small, Medium, Large, Responsive)
- Quick links to all endpoints
- Dark theme matching Riff aesthetic

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `app/p/[token]/opengraph-image.tsx` | Dynamic OG image generator (theme-aware) |
| `app/p/[token]/twitter-image.tsx` | Twitter card image generator (theme-aware) |
| `app/embed/[token]/page.tsx` | Embed route page |
| `components/EmbedClient.tsx` | Minimal embed viewer component |
| `components/RiffBadge.tsx` | "Made with Riff" floating branding badge |
| `app/api/oembed/route.ts` | oEmbed API endpoint |
| `public/embed-test.html` | Embed Lab test page |

### Modified Files

| File | Changes |
|------|---------|
| `app/p/[token]/page.tsx` | Enhanced OG/Twitter metadata, RiffBadge integration |
| `components/sharing/ShareDialog.tsx` | Embed code generator, preview button |
| `next.config.js` | Added CORS headers for embed route |

## API Routes Summary

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/decks/[id]/share` | GET | Yes | Get share status |
| `/api/decks/[id]/share` | POST | Yes | Create share token |
| `/api/decks/[id]/share` | DELETE | Yes | Revoke share |
| `/api/decks/[id]/publish` | POST | Yes | Publish deck snapshot |
| `/api/shared/[token]` | GET | No | Fetch published content |
| `/api/oembed` | GET | No | oEmbed endpoint |

## Usage Examples

### Sharing on Social Media

Simply paste the share URL. The dynamic OG image will appear with theme colors:
```
https://www.riff.im/p/O9SRviy-HiDU
```

### Embedding in a Website

Copy the iframe code from the share dialog:
```html
<iframe
  src="https://www.riff.im/embed/O9SRviy-HiDU"
  width="960"
  height="540"
  frameborder="0"
  allowfullscreen>
</iframe>
```

### Responsive Embed

Wrap the iframe in a responsive container:
```html
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe
    src="https://www.riff.im/embed/O9SRviy-HiDU"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;"
    frameborder="0"
    allowfullscreen>
  </iframe>
</div>
```

### Using oEmbed

For platforms that support oEmbed discovery:
```
GET https://www.riff.im/api/oembed?url=https://riff.im/p/O9SRviy-HiDU
```

## Local Testing

1. Start dev server: `npm run dev`
2. Open Embed Lab: `http://localhost:3000/embed-test.html`
3. Enter a share token and click "Update All"
4. Test OG images, embeds, and all endpoints
