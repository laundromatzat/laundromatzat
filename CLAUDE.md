# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What this is

A **static music video library** — the whole site is one grid of videos plus a
player modal. There is no backend, no database, no authentication, and no
third-party API. Treat any suggestion to add one as out of scope unless asked.

## Commands

```bash
npm install
npm run dev          # Vite dev server on :5173
npm run build        # production build to dist/
npm run preview      # serve the production build

npm run lint         # ESLint, zero warnings allowed
npx tsc --noEmit     # typecheck
npm test             # Vitest
npm run test:e2e     # Playwright
```

Pre-commit hooks (Husky + lint-staged) lint changed files.

## Architecture

```
src/
  data/projects.json      ← all site content lives here
  constants.ts            parses that JSON into the VIDEOS array
  index.tsx               router: "/" and "/vids/:slug"
  App.tsx                 layout shell
  pages/
    VideosPage.tsx        the grid + player route
    NotFoundPage.tsx
  components/
    ProjectGrid.tsx       grid + modal state, keyboard paging
    ProjectCard.tsx       one thumbnail card
    PortfolioModal.tsx    the video player
    Header.tsx, Container.tsx, PageMetadata.tsx, ErrorBoundary.tsx
    aura/                 AuraButton, AuraCard (design system)
  utils/
    projectData.ts        JSON → Project, validates and derives `year`
    projectDates.ts       MM/YYYY parsing and sort
    slugs.ts              title → URL slug
```

Stack: React 19, React Router 7, TypeScript, TailwindCSS 3.4, Vite 6.

## Conventions

- **Content changes go in `src/data/projects.json`, not in code.** Adding a video
  requires no code change. Field reference is in `README.md`.
- **Types-first**: `src/types.ts` defines `Project`; extend it there.
- **Tailwind inline**, using the Aura palette in `tailwind.config.ts`. No
  per-component CSS files.
- Routing: `/` is the library; `/vids/:slug` deep-links one video. Slugs are
  derived from titles, so renaming a video changes its URL.
- `npm run build` copies `index.html` to `404.html` so deep links work on
  GitHub Pages. Don't drop that step.

## External connections

The site needs no API keys. Its one dependency is the Firebase Storage bucket
hosting the media, referenced by absolute URL from `projects.json`. If you
change media hosts you must also widen the CSP in `index.html`.

See `docs/CONNECTIONS.md` — it also records that the media bucket's billing
account is currently closed, which makes all media 402 until resolved.
