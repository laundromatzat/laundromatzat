<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Laundromatzat – AI-assisted creative portfolio

Laundromatzat is a Vite + React experience showcasing film, photography, cinemagraphs, and experimental tools. A lightweight
Express API fronts a Gemini-powered guide who helps visitors explore the catalogue.

> View the currently published build in AI Studio: https://ai.studio/apps/drive/1ae454ZN4_ouOKrPzrBExNr6kNpFP7YVT

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
11. [Roadmap & next steps](#roadmap--next-steps)

## Architecture at a glance

- **Frontend:** React 19 rendered with Vite 6 and Tailwind CSS. Shared types live in `types.ts` and components use utility-first
  styling with composition-heavy layouts.
- **Backend:** An Express 5 server proxies Gemini requests.
- **AI assistant:** The Gemini service is wrapped in `server/services/geminiService.ts` and exposed to the UI through
  `services/geminiClient.ts`. Sanitizers strip scripts before rendering responses.
- **Testing toolchain:** Vitest exercises UI logic, and a TSX-powered integration test keeps the Gemini sanitizers honest.

## Prerequisites

- [Node.js 18+](https://nodejs.org/) (20 LTS recommended).
- npm 9+ (ships with current Node LTS releases).

## Initial setup

```bash
git clone https://github.com/<your-account>/laundromatzat.git
cd laundromatzat
npm install
```

Create a `.env.local` file in the repository root. The backend and Vite dev server both read from this file. Start with the
following scaffold and replace the placeholder values:

```bash
# Required: API key for the Gemini assistant (used exclusively by the Express server)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional frontend overrides
VITE_API_BASE_URL=http://localhost:3001
VITE_SITE_URL=https://laundromatzat.com

# Optional: whitelist extra origins that can call the API in production
CORS_ORIGINS=https://laundromatzat.com,https://studio.partner.com
```

## Local development workflow

1. **Start the Gemini API**

   ```bash
   npm run server
   ```

   The server loads environment variables from `.env.local` and listens on port `3001` (override with `PORT`).

2. **Run the Vite dev server**

   ```bash
   npm run dev
   ```

   The frontend is served at http://localhost:5173 with hot module replacement. Requests to `/api/*` proxy to the Express server.
   If you need to expose the dev server on your LAN, run `npm run dev -- --host 0.0.0.0` and update `CORS_ORIGINS` accordingly.

3. **Populate and iterate on content**

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

This command runs the entire Vitest suite and then executes `tests/nylonFabricDesignerService.test.ts`, which hardens the Gemini
sanitizers. For a faster feedback loop while building features, invoke `npx vitest --watch`.

### Manual QA against the production bundle

Before shipping, build and preview the production assets to catch asset-path issues:

```bash
npm run build
npm run preview
```

The preview server serves the `dist/` folder on http://localhost:4173 and mirrors how the static files will behave behind a CDN.

## Environment configuration

| Variable            | Required | Default                                                                           | Purpose                                                                                                  |
| ------------------- | -------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`    | Yes      | `""`                                                                              | Credential used by the Express server to call Gemini. Without it, `/api/chat` responds with 503.         |
| `CORS_ORIGINS`      | No       | `http://localhost:5173, https://laundromatzat.com, https://www.laundromatzat.com` | Comma-separated origins allowed to call the API.                                                         |
| `PORT`              | No       | `3001`                                                                            | Port the Express server listens on.                                                                      |
| `VITE_API_BASE_URL` | No       | runtime origin                                                                    | Overrides the API origin used by the frontend. Useful when hosting the frontend separately from the API. |
| `VITE_SITE_URL`     | No       | `https://laundromatzat.com`                                                       | Used to build canonical metadata tags. Set to your production domain.                                    |

All variables live in `.env.local` for local work. In production mirror the same values using your platform's secrets manager
(Render, Fly.io, Railway, etc.).

## Production setup

> Looking for a step-by-step release checklist? See [`docs/deployment-runbook.md`](docs/deployment-runbook.md) for provider-specific
> instructions and DNS guidance. For the most hands-off experience, follow the Netlify (frontend) and Render (API)
> pairing highlighted in the runbook—those hosts require virtually no server maintenance once configured.

1. **Build the frontend**

   ```bash
   npm install
   npm run build
   ```

   Deploy the generated `dist/` directory to your static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront). Ensure the
   host is configured to serve `index.html` for all SPA routes. Every CI run now publishes the bundle as the `frontend-dist`
   artifact so you can download the exact files that were built on `main` if a manual upload is required.

2. **Provision the API runtime**
   - Choose a Node-capable host (Render, Fly.io, Railway, DigitalOcean, etc.).
   - Copy the repository (or the `server/`, `data/`, `constants.ts`, and shared utility folders if deploying as a separate
     service).
   - Install dependencies: `npm ci`. The Express server starts through the `tsx` runtime which lives in `devDependencies`, so leave dev packages installed (or provide your own transpiled startup command).
   - Set the environment variables listed above, including a Gemini key and `CORS_ORIGINS` that include your frontend’s domain.
   - Start the server with `npm run server` (wrap it in a process manager such as PM2, systemd, or your platform’s native process
     runner).

3. **Point the frontend at the API**
   - If the frontend and API share the same origin, no extra configuration is required.
   - If they are hosted separately, set `VITE_API_BASE_URL` to the API’s public URL during the frontend build and expose that
     variable when running `npm run build`.

4. **Smoke test the deployed stack**
   - Monitor the server logs for the “server is running” banner.

## Data management

- **Portfolio catalogue:** `data/projects.json` (and the optional `portfolio-data.csv` import) power the public projects grid and
  Gemini prompt context. The parsers in `utils/projectData.ts` normalise schema changes.
- **Links page:** Curated resources live in `public/data/links.csv` and feed the `/links` route.

Refer to [`docs/data-schema.md`](docs/data-schema.md) for the full project schema and CSV mapping details.

## Project structure

```
├── App.tsx                 # Route wiring and layout chrome
├── components/             # Reusable UI pieces (cards, modals, chat interface)
├── data/                   # Portfolio dataset
├── docs/                   # In-depth guides (data schema, Gemini contract)
├── pages/                  # React Router routes
├── public/                 # Static assets and CSV imports
├── server/                 # Express API (Gemini proxy)
├── services/               # Frontend data clients, Gemini helpers, sanitizers
├── tests/                  # Vitest suites, Playwright specs, integration tests
├── types.ts                # Shared TypeScript interfaces
├── utils/                  # Parsing and formatting helpers
└── vite.config.ts          # Vite + dev server proxy configuration
```

## Maintenance checklist

- [ ] Update `data/projects.json` with fresh work, tagging entries for smarter filtering.
- [ ] Refresh hero imagery to reflect the latest creative direction.
- [ ] Audit the Gemini system prompt for tone and brand alignment each release.
- [ ] Review Lighthouse scores quarterly to maintain performance and accessibility targets.
- [ ] Pin dependency versions before major launches to avoid unexpected regressions.
- [ ] Confirm rate limiting and CORS settings still match the deployment topology after infrastructure changes.

## Roadmap & next steps

- Introduce richer analytics on assistant usage to inform prompt tuning.
- Explore real-time Gemini streaming responses to tighten conversational feedback loops.

## Project Assessment & Directions

### Health snapshot

- **Experience polish:** The React + Vite frontend is production-ready with a modular component system and typed data pipeline that keeps layouts and content in sync.[^architecture]
- **Data readiness:** Portfolio content is easy to refresh via `data/projects.json` (or the CSV importer) and downstream utilities normalise the schema for consistent rendering.[^data]
- **Quality gates:** Established linting and Vitest coverage keep regressions in check across UI and server flows.[^quality]

### Strategic directions

1. **Content operations:** Document a repeatable workflow for ingesting new portfolio entries, including media hosting conventions and accessibility checks.[^content-next]
2. **Assistant evolution:** Prototype conversational guardrails that let the Gemini guide adapt tone and suggested tours while respecting the existing sanitisation layers.[^assistant-next]
3. **Analytics & insights:** Layer in privacy-respecting analytics to measure assistant usage so roadmap bets are data-informed.[^analytics-next]

[^architecture]: See "Architecture at a glance" for the React, Vite, and Express breakdown that powers the experience.

[^data]: Refer to "Data management" and `utils/projectData.ts` for schema normalisation and import details.

[^quality]: "Quality checks & tests" outlines linting and Vitest coverage that underpin CI.

[^content-next]: Follow the catalogue guidance in "Data management" and `docs/data-schema.md` when adding or updating work.

[^assistant-next]: Build on the Gemini integration summarised in "Architecture at a glance" and `services/geminiClient.ts`.

[^analytics-next]: Use the analytics ideas introduced under "Roadmap & next steps" as a starting point for instrumentation planning.
