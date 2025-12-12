# Session 06 Plan: User-Scoped Storage (Phase 3)

## Goal

Make decks owned by users. Each user sees only their own decks.

## Current State

- Auth works (Google/GitHub OAuth)
- Decks stored in Vercel Blob at `decks/{id}.md`
- No user association - all decks visible to everyone
- Deck model exists in Prisma but not used

## Implementation Steps

### 1. Update blob.ts - Add userId to paths

Change blob paths from:
```
decks/{deckId}.md
themes/{themeId}.json
images/{imageId}
slides/{slideId}
```

To:
```
users/{userId}/decks/{deckId}.md
users/{userId}/themes/{themeId}.json
users/{userId}/images/{imageId}
users/{userId}/slides/{slideId}
```

**Changes:**
- Add `userId` parameter to all blob functions
- Update path generation to include user prefix
- Keep backward compatibility for shared/public content

### 2. Update deck API routes

**`app/api/decks/route.ts` (GET - list decks)**
- Get session userId
- Query Prisma for user's decks (not blob list)
- Return deck metadata from database

**`app/api/decks/route.ts` (POST - create deck)**
- Get session userId
- Create Deck record in Prisma with ownerId
- Store blob at user-scoped path
- Return deck with id

**`app/api/decks/[id]/route.ts` (GET/PUT/DELETE)**
- Verify deck ownership via Prisma
- Return 403 if not owner
- Use user-scoped blob path

### 3. Create deck records for existing decks

**Option A: Migration script** (one-time)
- List all existing blobs
- Create Deck records assigned to first user
- Move blobs to user-scoped paths

**Option B: Fresh start** (simpler)
- Existing blobs become orphaned
- New decks created properly
- User chose this approach earlier

### 4. Update editor page

- Fetch decks from API (which queries Prisma)
- API already protected by middleware
- No changes needed if API is updated correctly

## Files to Modify

| File | Changes |
|------|---------|
| `lib/blob.ts` | Add userId param to all functions |
| `app/api/decks/route.ts` | Prisma integration, ownership |
| `app/api/decks/[id]/route.ts` | Ownership verification |

## API Changes

### GET /api/decks
```typescript
// Before: lists all blobs in decks/
// After: queries Prisma for user's decks
const decks = await prisma.deck.findMany({
  where: { ownerId: session.user.id },
  orderBy: { updatedAt: 'desc' }
});
```

### POST /api/decks
```typescript
// Before: creates blob, returns id
// After: creates Prisma record + blob
const deck = await prisma.deck.create({
  data: {
    name,
    ownerId: session.user.id,
    blobPath: `users/${session.user.id}/decks/${id}.md`,
    blobUrl: blob.url
  }
});
```

### GET/PUT/DELETE /api/decks/[id]
```typescript
// Before: direct blob access
// After: verify ownership first
const deck = await prisma.deck.findUnique({
  where: { id, ownerId: session.user.id }
});
if (!deck) return new Response('Not found', { status: 404 });
```

## Testing Checklist

- [ ] Create deck as User A → visible only to User A
- [ ] Create deck as User B → visible only to User B
- [ ] User A cannot access User B's deck via direct URL
- [ ] Deck list updates correctly after create/delete
- [ ] Existing orphaned decks don't cause errors

## Estimated Scope

- 3 files to modify
- ~100-150 lines of code changes
- No new dependencies
