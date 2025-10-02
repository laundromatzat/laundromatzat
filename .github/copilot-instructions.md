Welcome to the Laundromatzat codebase — a Vite + React portfolio with a small Express API for mailing-list management.

Keep guidance concise and targeted: focus on the frontend (React + TypeScript + Tailwind) and the backend mailing-list API (Express + TypeScript).

Key places to look

- `App.tsx` — top-level route wiring and global layout.
- `components/` — reusable UI components; look at `MailingListSignup.tsx` for how the UI calls the backend client.
- `pages/` — route-driven pages (Images, Videos, Tools, etc.).
- `services/geminiService.ts` — wrapping Google Gemini usage and prompt patterns.
- `services/mailingListClient.ts` — frontend client used by `MailingListSignup.tsx`.
- `server/index.ts` — Express app entry: rate limiting, CORS, routes, and which env vars are required.
- `server/routes/mailingListRoutes.ts` and `server/services/mailingListService.ts` — server-side validation, storage, admin endpoints.
- `constants.ts` and `types.ts` — canonical prompts, content metadata, and shared TypeScript shapes.

Architecture & data flow (short)

- Frontend (Vite) at `npm run dev` serves the UI on :5173. During dev, Vite proxies `/api/*` to the backend so the signup form calls the local API without additional CORS setup.
- Backend API is a small Express server started with `npm run server` (runs `tsx server/index.ts`) and listens on :3001 by default. It validates input, rate-limits, and stores subscribers in `data/subscribers.json` (configurable via env).
- The Gemini assistant is invoked from the frontend via `services/geminiService.ts` and depends on a build-time env variable `VITE_GEMINI_API_KEY`.

Developer workflows and commands

- Install: `npm install`.
- Run backend only: `npm run server` (terminal 1).
- Run frontend only: `npm run dev` (terminal 2).
- Build production: `npm run build` and preview: `npm run preview`.

Environment variables and secrets (discoverable in README)

- Frontend: `VITE_GEMINI_API_KEY` must be set in `.env.local` (client-visible at build time).
- Backend (.env): `MAILING_LIST_ADMIN_KEY`, `MAILING_LIST_FROM_EMAIL`. Optional: `MAILING_LIST_SMTP_URL`, `CORS_ORIGINS`, `MAILING_LIST_STORAGE_PATH`, `MAILING_LIST_OUTBOX_PATH`, `PORT`.

Patterns and conventions to follow

- Types-first: extend `types.ts` when adding or changing data shapes so TypeScript and IntelliSense remain accurate.
- Tailwind classes are used inline in components. Preserve class naming patterns and spacing conventions seen in `components/*`.
- Small, focused services: backend logic lives in `server/services/*`, routes in `server/routes/*`, and controllers are thin.
- Error handling: APIs tend to throw Errors with descriptive messages; frontend displays them directly (see `MailingListSignup.tsx`). When changing error messages, keep them user-friendly and localizable.

Integration points and external dependencies

- Google Gemini: `@google/genai` used via `services/geminiService.ts`. The key is build-time client exposure (`VITE_GEMINI_API_KEY`).
- Background removal: `@imgly/background-removal` used in `services/backgroundRemovalStorage.ts` and pages that manipulate images.
- ONNX Runtime: `onnxruntime-web` is used for client-side model inference (see `services/backgroundRemovalStorage.ts`).
- Mailing list: local JSON storage by default (`data/subscribers.json`) with optional SMTP for sending real emails via `nodemailer`.

Testing, linting, and CI notes

- There are no automated tests checked into the repo. Be conservative: add small unit tests near changed service files if behavior is complex.
- CI builds (deploy) are described in `README.md` and GitHub Actions are present under `.github/workflows` for frontend deployment — update workflow only if you understand Pages deployment details.

Quick examples (copyable patterns)

- Frontend -> API: `services/mailingListClient.ts` exports `subscribeToMailingList({email, name})` and `MailingListSignup.tsx` awaits it in `handleSubmit` and sets UI state based on thrown Errors.
- Server validation: `server/middleware/apiKeyAuth.ts` enforces `MAILING_LIST_ADMIN_KEY` on admin routes; mimic when adding new admin endpoints.
- Storage override: use `MAILING_LIST_STORAGE_PATH` to point the API to a different JSON file for testing.

If you change public behavior

- Update `types.ts` and `constants.ts` accordingly.
- Adjust `README.md` where relevant (env vars, ports, run commands) so local developers continue to get correct onboarding instructions.

When uncertain, inspect these files first

- `server/index.ts`, `server/routes/mailingListRoutes.ts`, `server/services/mailingListService.ts`, `services/mailingListClient.ts`, `services/geminiService.ts`, `components/MailingListSignup.tsx`, `constants.ts`, `types.ts`, and `README.md`.

Don'ts for AI agents

- Don't modify production deployment workflows unless asked—these can affect GitHub Pages configuration.
- Avoid exposing or guessing secret values; refer to `.env` variables and leave placeholders.

Ask the maintainer when:

- Changes require onboarding updates (env vars, ports) or affect published Pages workflow.
- Adding persistent storage beyond local JSON (we need to coordinate migration and secrets).

If anything in these instructions looks incomplete or out of date, tell me what to expand and I'll iterate.
