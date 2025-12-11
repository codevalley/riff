# Repository Guidelines

## Project Structure & Module Organization
The Next.js 14 App Router lives in `app/app`, with route groups such as `present/[id]` for presenter mode and `app/api/*` for data + AI endpoints. Shared React/TSX UI lives under `app/components`, reusable utilities and Zustand stores are in `app/lib`, design tokens in `tailwind.config.js`, and persistent draft decks are cached in `app/sessions`. Keep slide content, assets, and new API routes under this tree so deployments stay Vercel-friendly.

## Build, Test, and Development Commands
- `cd app && npm run dev`: starts the local editor at `http://localhost:3000` with hot reload.
- `cd app && npm run build`: production-optimizes the app; run before shipping PRs touching runtime code.
- `cd app && npm run start`: serves the output of `next build` for smoke tests.
- `cd app && npm run lint`: TypeScript + ESLint + Tailwind rules; treat failures as blockers.

## Coding Style & Naming Conventions
Use TypeScript, functional React components, and 2-space indentation (see `app/app/page.tsx`). Favor descriptive component names (`SlidePreview`, `ThemeCustomizer`). Co-locate helper modules in `app/lib/*.ts`, export typed functions, and keep state hooks inside components or Zustand stores. Tailwind utility classes are preferred over ad-hoc CSS; keep class order semantic (layout → typography → effects).

## Testing Guidelines
The repo currently relies on linting plus manual deck walkthroughs; whenever you add parser logic or async API handlers, include unit coverage via Jest/Vitest under a new `app/__tests__` folder and name files `*.test.ts`. Snapshot slide rendering with Testing Library, and verify AI endpoints using mocked fetch responses. Always run `npm run lint` before requesting review.

## Commit & Pull Request Guidelines
Follow the existing conventional-prefix pattern (`feat:`, `fix:`, `chore:`) in imperative mood, limit to ~72 characters, and reference related issues in the body. PRs should state the motivation, outline UI changes, attach screenshots or deck IDs for reviewer reproduction, and list any schema or environment-variable updates.

## Security & Configuration Tips
Copy `.env.example` to `.env.local`, fill the Blob + AI keys, and never commit secrets. When debugging, prefer Vercel Blob test tokens and limit logging of prompt contents. Review access controls on `/api/decks/*` endpoints before merging features that touch storage.
