<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Laundromatzat – AI-assisted creative portfolio

This repository contains the source code for the Laundromatzat portfolio experience – a Vite + React application that blends
video, photography, cinemagraphs, and small interactive tools. A lightweight Gemini-powered assistant adds conversational
context to the work, making the site feel more like an interactive gallery than a static archive.

> View the currently published build in AI Studio: https://ai.studio/apps/drive/1ae454ZN4_ouOKrPzrBExNr6kNpFP7YVT

## Table of contents

1. [Tech stack](#tech-stack)
2. [Local development](#local-development)
3. [Project scripts](#project-scripts)
4. [Environment configuration](#environment-configuration)
5. [Deployment](#deployment)
6. [Project structure](#project-structure)
7. [Maintenance checklist](#maintenance-checklist)
8. [Roadmap & next steps](#roadmap--next-steps)

## Tech stack

- **Frontend framework:** React 19 with Vite 6 for lightning-fast HMR.
- **Language:** TypeScript throughout the app, including strongly typed portfolio data.
- **Styling:** Tailwind CSS utility classes (see component files for patterns).
- **Secure backend API:** Express 5 + TypeScript powers the mailing-list service with rate limiting, validation, and admin tooling.
- **AI assistant:** Google Gemini API powers the in-app conversational guide.
- **Media handling:** Background removal and ONNX Runtime enable richer visual presentations.

## Local development

Before getting started, ensure you have [Node.js](https://nodejs.org) installed (18 LTS or newer is recommended).

```bash
git clone https://github.com/<your-account>/laundromatzat.git
cd laundromatzat
npm install
```

Once dependencies are installed, start both the secure mailing-list API and the Vite dev server:

```bash
# Terminal 1 – secure mailing list API
npm run server

# Terminal 2 – frontend
npm run dev
```

The site will be available at http://localhost:5173 and the API at http://localhost:3001. Vite proxies `/api/*` to the backend
during development, so the signup form works without additional configuration. Any changes inside `components`, `pages`, or
`services` will refresh automatically.

### Working with TypeScript types

Portfolio items and chat assistant messaging rely on shared types defined in `types.ts`. When adding new content, extend the
relevant type first to keep IntelliSense and editor hints accurate.

## Project scripts

| Command           | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `npm run dev`     | Start the Vite development server with hot module reloading.   |
| `npm run server`  | Boot the secure Express mailing-list API on http://localhost:3001. |
| `npm run build`   | Create an optimized production build in `dist/`.               |
| `npm run preview` | Serve the production build locally for QA.                     |

## Environment configuration

### Gemini assistant

The Gemini assistant requires an API key exposed to the frontend at build time.

1. Create `.env.local` (ignored by git).
2. Add your key:

   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Restart the dev server whenever the key changes.

### Mailing list API

Create a `.env` file in the project root (also ignored by git) for backend-only secrets:

```bash
MAILING_LIST_ADMIN_KEY=replace-with-a-long-random-string
MAILING_LIST_FROM_EMAIL=studio@laundromatzat.com
# Optional: use an SMTP connection string (e.g. SMTP URL) to deliver real emails.
MAILING_LIST_SMTP_URL=smtp://user:pass@mail.yourprovider.com:587
# Optional: comma-separated origins that can call the API in production.
CORS_ORIGINS=https://laundromatzat.com
```

Additional advanced settings:

- `MAILING_LIST_STORAGE_PATH` – override where subscriber data is stored (defaults to `data/subscribers.json`).
- `MAILING_LIST_OUTBOX_PATH` – change the folder where JSON email receipts are archived (defaults to `data/outbox`).
- `PORT` – change the API port (defaults to `3001`).

The API enforces an admin API key for management endpoints (list, delete, send updates). Keep the key secret and rotate it
regularly.

## Deployment

The `main` branch is continuously deployed to GitHub Pages.

1. **Custom domain:** Managed through **Settings → Pages** and the `CNAME` file in `public/` (if present).
2. **Workflow:** `.github/workflows/deploy-frontend.yml` builds and publishes the site after each push.
3. **DNS:** Ensure your registrar points the domain to GitHub Pages to avoid downtime.

## Project structure

```
├── App.tsx            # Route wiring and layout chrome
├── components/        # Reusable UI pieces (cards, modals, chat interface)
├── data/              # Subscriber database + email outbox snapshots (gitignored)
├── pages/             # Page-level routes powered by React Router
├── server/            # Secure Express mailing-list API
├── services/          # Gemini + mailing list client helpers
├── constants.ts       # Portfolio data + chat system prompts
├── types.ts           # Shared TypeScript interfaces
└── public/            # Static assets and favicon
```

## Maintenance checklist

- [ ] Update `constants.ts` with fresh projects, tagging them by medium for smarter filtering.
- [ ] Refresh hero imagery to reflect the latest creative direction.
- [ ] Audit the Gemini system prompt for tone and brand alignment each release.
- [ ] Review Lighthouse scores quarterly to maintain performance and accessibility targets.
- [ ] Pin dependency versions before major launches to avoid unexpected regressions.

## Roadmap & next steps

1. **Immersive storytelling modes** – Introduce a “director’s commentary” overlay that syncs captions, behind-the-scenes audio,
   and sketch overlays to each hero project. Pair with scroll-driven animation to create a guided tour feeling.
2. **Generative remix lab** – Offer visitors the ability to remix a project’s palette, typography, or soundtrack with Gemini
   suggestions. Export the variations as sharable mood boards or short clips.
3. **Interactive residency calendar** – Build a timeline that maps residencies, exhibitions, and collaborations. Each milestone
   can open a mini-case study with embedded VR/AR previews or downloadable press kits.
4. **Audience co-creation wall** – Aggregate curated user submissions (images, prompts, or code snippets) and let the assistant
   narrate the story behind the collaborations. Include moderation workflows and opt-in attribution.
5. **Studio operations dashboard** – Add a private, authenticated route summarizing analytics, newsletter metrics, and a content
   pipeline Kanban fed by Notion or Airtable. Use Gemini to suggest priority next actions during reviews.

Have another idea? Open a GitHub issue with context, desired outcomes, and references to keep ideation collaborative.
