# Session 05: User System - Auth Foundation

**Date:** 2025-12-12

## Summary

Added user authentication using NextAuth.js with Prisma/PostgreSQL. Completed Phase 1 (database & auth foundation) and Phase 2 (auth UI & route protection). Users can now sign in via Google or GitHub OAuth and access protected routes.

## Problem Statement

Previously:
- No user concept - all decks globally accessible
- State split between localStorage (preferences) and Vercel Blob (decks)
- Changing URL/port loses localStorage state
- No access control on any API routes

## What Was Built

### Phase 1: Database & Auth Foundation

**Database Schema (Prisma + PostgreSQL)**
```
User (NextAuth standard + preferences)
  ├── UserPreferences (imageStyle, customPrompts)
  ├── Deck[] (owned decks)
  └── DeckShare[] (shared access)

Deck
  ├── id, name, blobPath, blobUrl
  ├── ownerId → User
  └── shares → DeckShare[]

DeckShare
  ├── deckId → Deck
  ├── userId → User (nullable for public links)
  ├── shareToken (for public link sharing)
  ├── permission (VIEW | EDIT)
  └── expiresAt (optional)
```

**Files Created:**
- `prisma/schema.prisma` - Complete database schema
- `lib/prisma.ts` - Prisma client singleton
- `lib/auth.ts` - NextAuth.js configuration (JWT sessions)
- `app/api/auth/[...nextauth]/route.ts` - Auth API route
- `components/auth/AuthProvider.tsx` - SessionProvider wrapper

### Phase 2: Auth UI & Route Protection

**Auth Pages:**
- `app/auth/signin/page.tsx` - Sign-in with Google/GitHub OAuth
- `app/auth/error/page.tsx` - Auth error display
- `app/auth/verify/page.tsx` - Email verification (unused, kept for future)

**Components:**
- `components/auth/UserMenu.tsx` - User avatar dropdown in header

**Route Protection:**
- `middleware.ts` - NextAuth middleware protecting /editor, /settings, /api/decks, /api/user
- `lib/middleware/auth.ts` - Auth helper functions

**Files Modified:**
- `app/layout.tsx` - Wrapped with AuthProvider
- `app/editor/page.tsx` - Added UserMenu to header
- `.env.example` - Added new environment variables

## Technical Decisions

1. **JWT Sessions** (not database sessions)
   - Avoids timing issues with middleware checks
   - Session immediately available after OAuth callback
   - Changed from initial `'database'` to `'jwt'` to fix redirect loop

2. **OAuth Only** (no email/magic link)
   - Removed email provider for simpler UX
   - Google and GitHub OAuth configured
   - Conditional provider loading (only if env vars set)

3. **Auto-create Preferences**
   - On user creation, default UserPreferences record created via NextAuth `createUser` event

## Dependencies Added

```json
{
  "next-auth": "^4.24.0",
  "@auth/prisma-adapter": "^1.0.0",
  "@prisma/client": "^5.0.0",
  "prisma": "^5.0.0",
  "nanoid": "^5.0.0"
}
```

## Environment Variables (New)

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## Database Scripts Added

```json
{
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "db:reset": "prisma migrate reset"
}
```

## Phase 3: User-Scoped Storage (Completed)

### Problem
After Phase 1 & 2, auth was working but all decks were visible to all users regardless of account.

### Implementation

**Blob Storage Path Migration:**
```
Before: decks/{deckId}.md
After:  users/{userId}/decks/{deckId}.md
```

**Files Modified:**

1. **`lib/blob.ts`** - All functions now accept `userId` parameter
   - `saveDeckBlob(userId, deckId, content)` - User-scoped paths
   - `getDeckContent()`, `updateDeckBlob()`, `deleteDeckBlob()` - unchanged signatures, work with full paths
   - Same pattern applied to themes, images, slide-cache

2. **`app/api/decks/route.ts`** - Lists/creates user's decks via Prisma
   - GET: `prisma.deck.findMany({ where: { ownerId: session.user.id } })`
   - POST: Creates Deck record with ownership

3. **`app/api/decks/[id]/route.ts`** - Ownership checks on all operations
   - GET, PUT, PATCH, DELETE all verify `ownerId === session.user.id`

4. **Other API routes updated** with auth checks:
   - `api/theme/[id]`, `api/generate-theme`, `api/slide-cache`, `api/convert-document`

5. **`middleware.ts`** - Extended protection to more routes
   - Added `/api/generate-theme`, `/api/slide-cache`, `/api/theme`, `/api/convert-document`

6. **`app/present/[id]/page.tsx`** - Added auth for owned decks (share tokens for Phase 4)

## Bug Fixes

### Bug 1: Lost deck after login
**Problem:** Landing page → paste doc → login → document content lost

**Solution:**
- Store document in `sessionStorage` before auth redirect
- On editor load, check for pending document and auto-convert

**Files:** `DocumentUploader.tsx`, `editor/page.tsx`

### Bug 2: Document upload success CTA not working
**Problem:** From editor → upload → convert → success modal CTA did nothing

**Solution:**
- Added `onSuccess` callback prop to DocumentUploader
- Editor handles it by refreshing deck list and loading new deck

**Files:** `DocumentUploader.tsx`, `editor/page.tsx`

### Bug 3: Delete deck breaks header icons
**Problem:** After deleting deck, header icons became unclickable

**Solution:**
- Close dropdown after deletion: `setIsOpen(false)` in handleDelete

**Files:** `DeckManager.tsx`

## Aesthetic Improvements

### Emoji-prefixed deck names from document import
- AI now generates deck names like "🚀 Product Launch Strategy"
- Prompt updated to request "TITLE: [emoji] Name" format
- Title extracted and cleaned from markdown before saving

**Files:** `app/api/convert-document/route.ts`

### Deck rename functionality
- Added PATCH endpoint for renaming decks
- Inline edit UI in DeckManager dropdown (pencil icon → edit mode)
- Enter/checkmark to save, Escape/X to cancel

**Files:** `app/api/decks/[id]/route.ts`, `components/DeckManager.tsx`, `app/editor/page.tsx`

## Current State

**Working:**
- OAuth sign-in (Google, GitHub)
- Session persistence (JWT)
- Route protection (middleware)
- User menu in editor header
- **User-scoped deck storage** - users only see their own decks
- **Document import with emoji titles**
- **Deck renaming from dropdown**

**Not Yet Implemented:**
- Sharing system (Phase 4)
- User preferences migration (Phase 5)
