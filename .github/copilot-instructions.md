# Copilot / AI agent instructions

This repository is a **static music video library**. There is no backend, no
database, no authentication, and no third-party API.

- The video list is plain data in `src/data/projects.json`.
- Thumbnails and video files are hosted externally (Firebase Storage) and
  referenced by absolute URL from that JSON.
- The site is a Vite + React + TypeScript SPA deployed to GitHub Pages.

When adding a video, edit `src/data/projects.json` only — no code change is
needed. See `README.md` for the field reference.

Before pushing, run: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.
