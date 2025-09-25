# Project overview

Laundromatzat is a personal creative portfolio that merges video, still imagery, cinemagraphs, and micro-apps into an immersive
story world. The React + Vite frontend is supported by a Gemini-powered assistant that offers context about each project and
acts as a concierge for visitors exploring the work.

Portfolio content is defined in `constants.ts` and typed via `types.ts`. Pages read that dataset and render layouts suited to the
medium (e.g., galleries for stills, embedded players for films, and live canvases for interactive experiments). The design ethos
is clean and cinematic, letting the projects take center stage.

# Building and running

## Prerequisites

- Node.js 18 or newer
- A Google Gemini API key with the `models.generateContent` scope

## Setup steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure the Gemini key**

   Create `.env.local` and add:

   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

   The dev server boots on http://localhost:5173 with hot module replacement.

4. **Build for production**

   ```bash
   npm run build
   ```

   Outputs the optimized bundle in `dist/`.

5. **Preview the production build**

   ```bash
   npm run preview
   ```

   Useful for QA before shipping to GitHub Pages.

# Development conventions

- **Component-driven UI:** Compose features from atomic components in `components/`. Prefer splitting layout and data fetching
  logic for readability.
- **Routing:** `App.tsx` configures all routes with `react-router-dom`. Keep route-specific data loaders colocated with their
  respective page components inside `pages/`.
- **Styling:** Tailwind utility classes are the default; if a pattern repeats, extract a component instead of custom CSS.
- **State management:** Favor local state via React hooks. If cross-cutting state emerges, introduce lightweight context modules
  inside `services/` before reaching for heavier libraries.
- **AI assistant:** The conversational tone lives in the `SYSTEM_PROMPT` string inside `constants.ts`. Document any changes there
  so copywriting stays aligned with the brand voice.
- **Content updates:** Portfolio entries are curated objects inside `constants.ts`. Keep slugs unique and include alt text for
  accessibility.
- **Type safety:** Update `types.ts` first whenever introducing new data shapes, then refactor components to consume the new
  definitions.

# Content workflow tips

1. Draft new project blurbs in a shared doc, then translate them into the structured fields used in `constants.ts`.
2. Store high-resolution media in an external CDN (e.g., Cloudinary or Vimeo) and embed via performant URLs.
3. When integrating experimental tools, prototype in isolation (Storybook or a separate sandbox) before moving the code into
   `components/experimental/`.

# Forward-looking ideas

These suggestions expand on the roadmap and give Gemini-friendly hooks for future conversations:

1. **Adaptive curator bot** – Let the assistant learn from visitor interactions (e.g., liked projects, time on page) to craft a
   bespoke tour the next time they visit. Use localStorage for anonymous sessions and surface an “Encore Tour” CTA.
2. **Residency postcards** – Generate printable postcards combining project frames, geo-tagged maps, and artist statements. Allow
   the assistant to write personalized dedications.
3. **Live performance layer** – Stream scheduled audiovisual performances where the assistant moderates chat, cues lighting
   presets, and offers backstage notes.
4. **Technique recipe cards** – Break down signature techniques (lighting setups, LUT chains, shader snippets) into step-by-step
   guides. Gemini can adapt each guide for beginners vs. pros.
5. **Studio atlas** – Build an interactive floor plan of the studio, with hotspots unlocking equipment specs, budgets, and
   behind-the-scenes footage. Perfect for workshops or sponsorship decks.

Keep this document up to date as decisions evolve—it doubles as onboarding material for collaborators and as a reference for the
Gemini assistant’s system prompt.
