# User System Implementation Plan

## Overview

Add user authentication, deck ownership, and sharing to Riff. Currently all decks are globally accessible with no user concept.

**Choices Made:**
- Auth: NextAuth.js (self-hosted)
- Migration: Start fresh (new users get empty workspace)
- Sharing: Yes, via shareable links (view/edit permissions)

---

## Architecture

### Database Schema (Prisma + PostgreSQL)

```
User (NextAuth standard + preferences)
  ├── UserPreferences (imageStyle, customPrompts - migrated from localStorage)
  ├── Deck[] (owned decks)
  └── DeckShare[] (shared access)

Deck
  ├── id, name, blobPath, blobUrl
  ├── ownerId → User
  └── shares → DeckShare[]

DeckShare
  ├── deckId → Deck
  ├── userId → User (nullable for public links)
  ├── shareToken (for public links)
  ├── permission (VIEW | EDIT)
  └── expiresAt (optional)
```

### Blob Path Migration

```
Current:  decks/{deckId}.md
New:      users/{userId}/decks/{deckId}.md

Same pattern for themes/, images/, slides/
```

---

## Implementation Phases

### Phase 1: Database & Auth Foundation ✅
1. ✅ Add PostgreSQL (Vercel Postgres)
2. ✅ Setup Prisma with schema
3. ✅ Install NextAuth.js + PrismaAdapter
4. ✅ Create `/lib/auth.ts`, `/lib/prisma.ts`
5. ✅ Create `/app/api/auth/[...nextauth]/route.ts`
6. ✅ Add `SessionProvider` to root layout

**Files Created:**
- `prisma/schema.prisma`
- `lib/auth.ts`
- `lib/prisma.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `components/auth/AuthProvider.tsx`

### Phase 2: Auth UI & Route Protection
7. Create sign-in page (with OAuth + magic link)
8. Create `UserMenu` component for header
9. Add `middleware.ts` for route protection
10. Create auth helper functions

**Files to Create:**
- `app/auth/signin/page.tsx`
- `components/auth/UserMenu.tsx`
- `middleware.ts`
- `lib/middleware/auth.ts`

### Phase 3: User-Scoped Storage
11. Modify `blob.ts` - add `userId` param to all functions
12. Update deck API routes with ownership checks
13. Create Deck records in database on creation
14. Update editor to use authenticated deck listing

**Files to Modify:**
- `lib/blob.ts` - Add userId to all function signatures
- `app/api/decks/route.ts` - Auth + DB integration
- `app/api/decks/[id]/route.ts` - Ownership checks
- `app/editor/page.tsx` - Use auth session

### Phase 4: Sharing System
15. Create share API endpoints
16. Create ShareDialog component
17. Add share button to editor
18. Create public share viewer page

**Files to Create:**
- `app/api/decks/[id]/share/route.ts`
- `app/api/share/[token]/route.ts`
- `app/shared/[token]/page.tsx`
- `components/sharing/ShareDialog.tsx`

### Phase 5: Present Mode & Preferences
19. Update present mode to handle share tokens
20. Migrate localStorage prefs to user profile
21. Create user preferences API
22. Add settings page

**Files to Modify/Create:**
- `app/present/[id]/page.tsx` - Share token support
- `lib/store.ts` - Add auth state
- `app/api/user/preferences/route.ts`
- `app/settings/page.tsx`

---

## Environment Variables (New)

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Email (optional)
EMAIL_SERVER="smtp://..."
EMAIL_FROM="noreply@riff.app"
```

---

## Share Link Flow

1. Owner clicks "Share" → ShareDialog opens
2. Selects permission (View/Edit) → Creates DeckShare with token
3. Gets URL: `/shared/{token}`
4. Recipient opens link → Fetches deck via token (no auth needed)
5. If Edit permission → Can modify

---

## Testability Checkpoints

| After Phase | What's Testable |
|-------------|-----------------|
| Phase 1 | Nothing visible - just infrastructure |
| Phase 2 | Can sign in, see user menu, protected routes redirect |
| Phase 3 | User sees only their own decks, can create/edit |
| Phase 4 | Can share decks via link, others can view/edit |
| Phase 5 | Preferences persist across devices, settings page works |
