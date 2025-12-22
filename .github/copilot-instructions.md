Welcome to the Laundromatzat codebase — a simplified static React portfolio.

Key places to look

- `App.tsx` — top-level route wiring and global layout.
- `components/` — reusable UI components.
- `pages/` — route-driven pages (Images, Videos, Tools, etc.).
- `services/geminiClient.ts` — client-side Gemini API integration.
- `data/projects.json` — source of truth for portfolio content.
- `constants.ts` and `types.ts` — canonical prompts, content metadata, and shared TypeScript shapes.

Architecture & data flow (short)

- Frontend (Vite) at `npm run dev` serves the UI on :5173.
- The site is static; there is no backend server.
- The Gemini assistant is invoked directly from the frontend via `services/geminiClient.ts` and depends on `VITE_GEMINI_API_KEY`.
- Content is loaded from `data/projects.json` at build/runtime.

Developer workflows and commands

- Install: `npm install`.
- Run: `npm run dev`.
- Build: `npm run build`.

Environment variables

- `VITE_GEMINI_API_KEY` must be set in `.env.local` for the AI assistant to work.

Patterns and conventions to follow

- Types-first: extend `types.ts` when adding or changing data shapes.
- Tailwind classes are used inline in components.
- Client-side only: Do not introduce server-side dependencies (Node.js, Express, etc.).

Integration points

- Google Gemini: `@google/genai` used directly in browser.
- Mailing list: Functionality is disabled/mocked in this version.

If you change public behavior

- Update `types.ts` and `constants.ts` accordingly.
- Update `README.md` if setup instructions change.
