# Task: Legacy Image Optimization on Publish

## Status: Open
## Priority: Medium
## Created: 2025-12-31
## Related: session-27.md

---

## Problem

After implementing WebP + cache headers for NEW images (session-27), existing decks still have legacy PNG images that don't benefit from:
1. **WebP format** (~30% smaller files)
2. **1-year cache headers** (faster CDN/browser caching)

Note: `next/image` optimization already works for existing images (serves optimized versions at request time), but the source files remain unoptimized PNGs.

---

## Proposed Solution

### UX Flow

1. **On deck load**: Detect legacy `.png` URLs in image manifest
2. **Show dirty state**: If published deck has legacy images → show "unpublished changes" indicator
3. **Tooltip**: Explain why (e.g., "Images need optimization")
4. **On publish**: Optimize images server-side before publishing

### User Experience

```
User opens deck with legacy PNG images
  → Publish button shows "dirty" state (amber color)
  → Tooltip: "Images need optimization"

User clicks Publish
  → Button shows "Optimizing images..." (reuse existing loading state)
  → Server optimizes images
  → Button shows "Publishing..."
  → Done
```

---

## Technical Implementation

### 1. Detection (in `app/editor/page.tsx`)

Around line 158, after loading imageManifest:

```typescript
// Detect legacy PNG images
const hasLegacyImages = Object.values(parsed.imageManifest || {}).some(entry => {
  const urls = [entry.generated, entry.uploaded, entry.restyled].filter(Boolean);
  return urls.some(url => url?.endsWith('.png'));
});

// If published deck has legacy images → mark as dirty
if (data.publishStatus?.isPublished && hasLegacyImages) {
  data.publishStatus.hasUnpublishedChanges = true;
  data.publishStatus.hasLegacyImages = true; // New flag for tooltip
}
```

### 2. Tooltip (in `components/sharing/PublishPopover.tsx`)

Add title attribute to trigger button when `hasLegacyImages` is true:

```typescript
<button
  onClick={handleToggle}
  title={status?.hasLegacyImages ? "Images need optimization" : undefined}
  // ... rest of button
>
```

### 3. Optimization during publish (in `PublishPopover.tsx`)

Modify `handlePublish`:

```typescript
const handlePublish = async () => {
  try {
    setPublishing(true);
    setError(null);

    // If legacy images exist, optimize first
    if (status?.hasLegacyImages) {
      // Reuse loading state - could show "Optimizing images..."
      await fetch(`/api/optimize-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId }),
      });
    }

    // Then proceed with normal publish...
    const imageUrls = collectImageUrls();
    const res = await fetch(`/api/decks/${deckId}/publish`, {
      // ...
    });
    // ...
  }
};
```

### 4. New API endpoint (`app/api/optimize-images/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMetadata, saveMetadata } from '@/lib/blob';
import { put } from '@vercel/blob';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { deckId } = await request.json();

  // Get current metadata
  const metadata = await getMetadata(session.user.id, deckId);
  if (!metadata?.images) {
    return NextResponse.json({ optimized: 0 });
  }

  let optimizedCount = 0;
  const updatedImages = { ...metadata.images };

  // Process each image entry
  for (const [description, entry] of Object.entries(updatedImages)) {
    const slots = ['generated', 'uploaded', 'restyled'] as const;

    for (const slot of slots) {
      const url = entry[slot];
      if (url && url.endsWith('.png')) {
        try {
          // Fetch the PNG
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const pngBuffer = Buffer.from(arrayBuffer);

          // Convert to WebP
          const webpBuffer = await sharp(pngBuffer)
            .webp({ quality: 85 })
            .toBuffer();

          // Upload with new filename and cache headers
          const hash = url.split('/').pop()?.replace('.png', '') || Date.now().toString();
          const newPath = `images/${hash}.webp`;

          const blob = await put(newPath, webpBuffer, {
            access: 'public',
            contentType: 'image/webp',
            cacheControlMaxAge: 31536000,
          });

          // Update entry
          entry[slot] = blob.url;
          optimizedCount++;
        } catch (err) {
          console.error(`Failed to optimize ${slot} for "${description}":`, err);
          // Skip and continue - partial failure is OK
        }
      }
    }
  }

  // Save updated metadata
  if (optimizedCount > 0) {
    metadata.images = updatedImages;
    await saveMetadata(session.user.id, deckId, metadata);
  }

  return NextResponse.json({ optimized: optimizedCount });
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `app/editor/page.tsx` | Detect legacy images on load, set dirty state |
| `components/sharing/PublishPopover.tsx` | Add tooltip, optimization step in publish |
| `lib/types.ts` | Add `hasLegacyImages` to `PublishStatus` interface |
| `app/api/optimize-images/route.ts` | **NEW** - Server-side image optimization |

---

## Edge Cases

1. **Never-published decks**: No dirty state shown (they'll get optimized on first publish anyway)
2. **Partial failure**: Skip failed images, continue with rest, proceed to publish
3. **Empty manifest**: No-op, proceed to publish immediately
4. **Already optimized**: `.webp` URLs are skipped

---

## Testing Checklist

- [ ] Load deck with legacy PNG images → shows dirty state
- [ ] Tooltip appears on publish button
- [ ] Click publish → "Optimizing..." → "Publishing..." → success
- [ ] Verify images now have `.webp` URLs in manifest
- [ ] Verify old PNG images still work (backwards compat)
- [ ] Test with mixed PNG/WebP deck
- [ ] Test with never-published deck (no dirty state)
- [ ] Test partial failure (one image fails, others succeed)

---

## Notes

- Server-side optimization (not client-side) to avoid bandwidth/CPU on user's device
- Reuses existing publish button loading state - no new UI elements needed
- Gradual migration: only optimizes decks when user publishes
