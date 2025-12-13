# Session 10: Smart Publish Button with Dirty State Detection

**Date:** 2025-12-13

## Summary

Replaced the "Share" button in the editor header with a smart "Publish" dropdown that shows publish status and detects unpublished changes. Inspired by Lovable's publish UI design.

## Features Implemented

### 1. PublishPopover Component
**File:** `app/components/sharing/PublishPopover.tsx`

A dropdown-style publish UI that replaces the modal ShareDialog:
- Shows current publish status (Live badge when published)
- URL display with copy button
- Embed code section with size selector (S/M/L)
- Unpublish functionality

### 2. Smart Button States

| State | Icon | Color | Label |
|-------|------|-------|-------|
| Never published | `Cloud` | Neutral (zinc) | "Publish" |
| Published (clean) | `CloudCheck` | Green (emerald) | "Published" |
| Published (dirty) | `CloudAlert` | Amber | "Publish" |

### 3. Dirty State Detection

Detects when a published deck has unpublished changes:
- API returns `hasUnpublishedChanges` by comparing `updatedAt > publishedAt`
- Warning banner: "You have unpublished changes"
- Amber styling to indicate action needed

**Bug Fix:** Fixed false positives in dirty detection by syncing both `updatedAt` and `publishedAt` to the same timestamp when publishing.

### 4. Action Buttons (Inside Popover)

| State | Icon | Button Text |
|-------|------|-------------|
| Never published | `Cloud` | "Publish" |
| Published (clean) | `CloudBackup` | "Republish" |
| Published (dirty) | `CloudAlert` | "Push changes" |
| Unpublish | `CloudOff` | "Unpublish" |

### 5. Unpublish Feature
**Endpoint:** `DELETE /api/decks/[id]/publish`

Allows users to take a deck offline by clearing:
- `shareToken`
- `publishedContent`
- `publishedTheme`
- `publishedAt`

## Files Modified

| File | Changes |
|------|---------|
| `app/api/decks/[id]/route.ts` | Added `publishStatus` to GET response |
| `app/api/decks/[id]/publish/route.ts` | Fixed timestamp sync, added DELETE handler |
| `app/editor/page.tsx` | Replaced ShareDialog with PublishPopover |
| `components/sharing/PublishPopover.tsx` | New component (dropdown publish UI) |
| `package.json` | Updated lucide-react to 0.561.0 |

## Technical Details

### Publish Status API Response
```typescript
publishStatus: {
  isPublished: boolean;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
  shareToken: string | null;
}
```

### Dirty Detection Fix
```typescript
// Before: timestamps could desync
publishedAt: new Date()

// After: same timestamp for both
const now = new Date();
data: {
  publishedAt: now,
  updatedAt: now,  // Ensures hasUnpublishedChanges is false
}
```

### Cloud Icons (lucide-react 0.561.0)
- `Cloud` - base/unpublished state
- `CloudCheck` - published successfully
- `CloudAlert` - needs attention (dirty)
- `CloudBackup` - republish action
- `CloudOff` - unpublish action

## Removed

- `ShareDialog` component usage from editor (replaced with PublishPopover)
- Old Share button in header
