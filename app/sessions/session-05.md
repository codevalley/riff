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

## Current State

**Working:**
- OAuth sign-in (Google, GitHub)
- Session persistence (JWT)
- Route protection (middleware)
- User menu in editor header
- Cross-device deck visibility (all decks visible to all users)

**Not Yet Implemented:**
- User-scoped deck storage (Phase 3)
- Deck ownership in database (Phase 3)
- Sharing system (Phase 4)
- User preferences migration (Phase 5)

## Next Session: Phase 3 - User-Scoped Storage

See `sessions/session-06-plan.md` for detailed implementation plan.
