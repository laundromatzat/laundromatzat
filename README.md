<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Laundromatzat – Creative Portfolio

Laundromatzat is a Vite + React experience showcasing film, photography, cinemagraphs, and experimental tools.

## Table of contents

1. [Architecture at a glance](#architecture-at-a-glance)
2. [Prerequisites](#prerequisites)
3. [Initial setup](#initial-setup)
4. [Local development workflow](#local-development-workflow)
5. [Quality checks & tests](#quality-checks--tests)
6. [Environment configuration](#environment-configuration)
7. [Production setup](#production-setup)
8. [Data management](#data-management)
9. [Project structure](#project-structure)
10. [Maintenance checklist](#maintenance-checklist)

## Architecture at a glance

- **Frontend:** React 19 rendered with Vite 6 and Tailwind CSS. Shared types live in `types.ts` and components use utility-first
  styling with composition-heavy layouts.
- **Static Site:** The application is a fully static SPA (Single Page Application) deployable to any static host (GitHub Pages, Netlify, etc.).
- **Testing toolchain:** Vitest exercises UI logic.

## Prerequisites

- [Node.js 18+](https://nodejs.org/) (20 LTS recommended).
- npm 9+ (ships with current Node LTS releases).

## Initial setup

```bash
git clone https://github.com/<your-account>/laundromatzat.git
cd laundromatzat
npm install
```

Create a `.env.local` file in the repository root for local development overrides (optional):

```bash
# Optional frontend overrides
VITE_SITE_URL=https://laundromatzat.com
```

## Local development workflow

1. **Run the Vite dev server**

   ```bash
   npm run dev
   ```

   The frontend is served at http://localhost:5173 with hot module replacement.

2. **Populate and iterate on content**

   Edit `data/projects.json` (or import `portfolio-data.csv`) to refresh the catalogue. Changes are parsed via
   `utils/projectData.ts` and immediately reflected in the UI.

## Quality checks & tests

### Linting

Run ESLint in CI mode to keep TypeScript, React hooks, and accessibility rules clean:

```bash
npm run lint
```

### Unit & component tests (Vitest)

Vitest covers rendering logic, hooks, and shared utilities. The default test run matches CI:

```bash
npm test
```

### Manual QA against the production bundle

Before shipping, build and preview the production assets to catch asset-path issues:

```bash
npm run build
npm run preview
```

The preview server serves the `dist/` folder on http://localhost:4173 and mirrors how the static files will behave behind a CDN.

## Environment configuration

| Variable        | Required | Default                     | Purpose                                                               |
| --------------- | -------- | --------------------------- | --------------------------------------------------------------------- |
| `VITE_SITE_URL` | No       | `https://laundromatzat.com` | Used to build canonical metadata tags. Set to your production domain. |

## Production setup

1. **Build the frontend**

   ```bash
   npm install
   npm run build
   ```

   Deploy the generated `dist/` directory to your static host (GitHub Pages, Vercel, Netlify, etc.). Ensure the
   host is configured to serve `index.html` for all SPA routes.

2. **GitHub Pages Deployment**

   This repository is configured to deploy automatically to GitHub Pages via GitHub Actions.
   - Workflow file: `.github/workflows/deploy.yml`
   - Trigger: Push to `main` branch.

## Data management

- **Portfolio catalogue:** `data/projects.json` (and the optional `portfolio-data.csv` import) power the public projects grid.
- **Links page:** Curated resources live in `public/data/links.csv` and feed the `/links` route.

Refer to [`docs/data-schema.md`](docs/data-schema.md) for the full project schema and CSV mapping details.

## Project structure

```
├── App.tsx                 # Route wiring and layout chrome
├── components/             # Reusable UI pieces (cards, modals)
├── data/                   # Portfolio dataset
├── docs/                   # In-depth guides (data schema)
├── pages/                  # React Router routes
├── public/                 # Static assets and CSV imports
├── services/               # Frontend data clients
├── tests/                  # Vitest suites, Playwright specs
├── types.ts                # Shared TypeScript interfaces
├── utils/                  # Parsing and formatting helpers
└── vite.config.ts          # Vite configuration
```

## Maintenance checklist

- [ ] Update `data/projects.json` with fresh work, tagging entries for smarter filtering.
- [ ] Refresh hero imagery to reflect the latest creative direction.
- [ ] Review Lighthouse scores quarterly to maintain performance and accessibility targets.
- [ ] Pin dependency versions before major launches to avoid unexpected regressions.

## Project Assessment & Directions

### Health snapshot

- **Experience polish:** The React + Vite frontend is production-ready with a modular component system and typed data pipeline that keeps layouts and content in sync.[^architecture]
- **Data readiness:** Portfolio content is easy to refresh via `data/projects.json` (or the CSV importer) and downstream utilities normalise the schema for consistent rendering.[^data]
- **Quality gates:** Established linting and Vitest coverage keep regressions in check across UI.[^quality]

### Strategic directions

1. **Content operations:** Document a repeatable workflow for ingesting new portfolio entries, including media hosting conventions and accessibility checks.[^content-next]
2. **Analytics & insights:** Layer in privacy-respecting analytics to measure usage so roadmap bets are data-informed.[^analytics-next]

[^architecture]: See "Architecture at a glance" for the React breakdown.

[^data]: Refer to "Data management" and `utils/projectData.ts` for schema normalisation and import details.

[^quality]: "Quality checks & tests" outlines linting and Vitest coverage that underpin CI.

[^content-next]: Follow the catalogue guidance in "Data management" and `docs/data-schema.md` when adding or updating work.

[^analytics-next]: Use the analytics ideas introduced under "Roadmap & next steps" as a starting point for instrumentation planning.
