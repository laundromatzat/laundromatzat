# Project overview

Laundromatzat is a personal creative portfolio that blends video, still imagery, cinemagraphs, and micro-apps into an immersive
story world. The React + Vite frontend is paired with an Express server that proxies Gemini and powers a rate-limited mailing
list workflow.

Portfolio content lives in `data/projects.json` (typed via `types.ts`) and is parsed by `utils/projectData.ts`. Pages read the
normalised dataset to render media-specific layouts—galleries for stills, embedded players for films, and live canvases for
interactive experiments. The design ethos is clean and cinematic so the work stays centre stage.

# Building and running

## Prerequisites

- Node.js 18 or newer.
- A Google Gemini API key with access to the `models.generateContent` scope.
- Optional: SMTP credentials if you want the mailing list to deliver real emails outside of development.

## Setup steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create `.env.local` in the project root and add at least:

   ```bash
   GEMINI_API_KEY=your_api_key_here
   MAILING_LIST_ADMIN_KEY=replace-with-a-long-random-string
   MAILING_LIST_FROM_EMAIL=studio@laundromatzat.com
   ```

   Add `MAILING_LIST_SMTP_URL` if you want to send real email and customise `CORS_ORIGINS` to match your deployment. The same
   file is read by both the Express server and the Vite dev server.

3. **Run the development servers**

   ```bash
   # Terminal 1 – Express API (mailing list + Gemini proxy)
   npm run server

   # Terminal 2 – Vite frontend
   npm run dev
   ```

   The frontend boots on http://localhost:5173 with hot module replacement. API requests are proxied to the Express server at
   http://localhost:3001 so both services stay in sync during local work.

4. **Build for production**

   ```bash
   npm run build
   ```

   The optimised bundle lands in `dist/`. Preview it locally via `npm run preview` before deploying to your hosting provider.

# Development conventions

- **Component-driven UI:** Compose features from atomic components in `components/`. Split layout from data-fetching logic for
  clarity.
- **Routing:** `App.tsx` wires `react-router-dom` routes. Keep route-specific loaders colocated with their page components in
  `pages/`.
- **Styling:** Tailwind utility classes are the default; extract shared patterns into reusable components before introducing
  bespoke CSS.
- **State management:** Prefer React hooks and local state. Reach for React context before adopting heavier global state tools.
- **AI assistant:** The conversational tone lives in `AI_SYSTEM_PROMPT` inside `constants.ts`. Update the prompt intentionally and
  document why changes were made so the brand voice stays consistent.
- **Content updates:** Update `data/projects.json` or `portfolio-data.csv` when adding new work. Keep IDs unique and include alt
  text for accessibility.
- **Type safety:** Adjust `types.ts` first whenever introducing new data shapes, then refactor components and services to use the
  updated definitions.

# Content workflow tips

1. Draft new project blurbs in a shared doc, then translate them into the structured fields used in `data/projects.json`.
2. Store high-resolution media in an external CDN (Cloudinary, Vimeo, etc.) and reference performant URLs.
3. Prototype experimental tools in isolation before promoting them into `components/experimental/` for production use.

# Forward-looking ideas

These suggestions expand on the roadmap and give Gemini-friendly hooks for future conversations:

1. **Adaptive curator bot** – Let the assistant learn from visitor interactions (liked projects, time on page) to craft bespoke
   tours on repeat visits. Store anonymous preferences in `localStorage` and surface an “Encore Tour” CTA.
2. **Residency postcards** – Generate printable postcards combining project frames, geo-tagged maps, and artist statements. Allow
   the assistant to write personalised dedications.
3. **Live performance layer** – Stream scheduled audiovisual performances where the assistant moderates chat, cues lighting
   presets, and offers backstage notes.
4. **Technique recipe cards** – Break down signature techniques (lighting setups, LUT chains, shader snippets) into step-by-step
   guides. Gemini can adapt each guide for beginners vs. pros.
5. **Studio atlas** – Build an interactive floor plan of the studio, with hotspots unlocking equipment specs, budgets, and
   behind-the-scenes footage. Ideal for workshops or sponsorship decks.

Keep this document up to date as decisions evolve—it doubles as onboarding material for collaborators and as a reference for the
Gemini assistant’s system prompt.
