# Repository Guidelines

## Commands (run from `app/` directory)
- `npm run dev` - Start dev server at http://localhost:3000
- `npm run build` - Production build (includes Prisma generate + migrate)
- `npm run lint` - ESLint check; must pass before committing
- `npm run db:studio` - Open Prisma Studio for database inspection

## Code Style
- TypeScript with strict types; define interfaces in `lib/types.ts`
- Functional React components with 2-space indentation
- Imports: `@/` alias for `app/` (e.g., `import { useStore } from '@/lib/store'`)
- Tailwind utilities preferred; order: layout > typography > effects
- State: Zustand stores in `lib/store.ts`, local state with `useState`/`useRef`
- Naming: PascalCase components (`SlideEditor`), camelCase functions/variables
- Error handling: Set errors via `useStore().setError()`, check API responses

## Project Structure
- `app/app/` - Next.js 14 App Router pages and API routes
- `app/components/` - Shared React components
- `app/lib/` - Utilities, types, Zustand store, Prisma client
- `app/prisma/` - Database schema and migrations

## Commits
Use conventional prefixes: `feat:`, `fix:`, `chore:` (imperative mood, ~72 chars)
