# Share & Embed Feature

## Overview

Riff decks can be shared publicly and embedded in third-party applications.

## Public Sharing

Published decks are accessible at:
```
https://www.riff.im/p/{token}
```

## Embedding

Embeds use a minimal presenter optimized for iframes:
```
https://www.riff.im/embed/{token}
```

### Embed Features
- Smart scaling to fit container (1280x720 design dimensions)
- Keyboard navigation (arrows, space, enter)
- Touch/swipe support
- Click to advance, right-click to go back
- Progress bar at bottom
- Riff badge linking to riff.im

### Embedding in Third-Party Apps

Example iframe:
```html
<iframe
  src="https://www.riff.im/embed/{token}"
  width="100%"
  height="450"
  frameborder="0"
  allowfullscreen
></iframe>
```

Works in: Notion, websites, blogs, documentation tools, etc.

## Font Proxy (CSP Bypass)

Embedded slides use custom fonts from Google Fonts. Some platforms (Notion, enterprise tools) have strict Content Security Policy (CSP) that blocks external font loading.

### Solution

We proxy Google Fonts through our domain:

| Endpoint | Purpose |
|----------|---------|
| `/api/fonts?family=...` | Proxies Google Fonts CSS |
| `/api/fonts/file?url=...` | Proxies font files (woff2) |

### How It Works

1. Embed requests fonts from `/api/fonts?family=Inter:wght@400;500`
2. Our API fetches CSS from `fonts.googleapis.com`
3. Font file URLs are rewritten to `/api/fonts/file?url=...`
4. Font files are fetched from `fonts.gstatic.com` and served through our domain

### Caching

- Font CSS: 1 week
- Font files: 1 year (immutable)

### Security

- Only `fonts.gstatic.com` URLs are allowed for font file proxying
- All other URLs are rejected with 400 error
