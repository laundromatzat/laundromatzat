# Changelog

## Unreleased — Simplified to a music video repository

The site was reduced to a single purpose: browsing the music video library.

### Added
- `docs/CONNECTIONS.md` documenting the one remaining external connection, the
  build variable, and the credentials that should now be revoked.
- Redirects from the previous `/vids`, `/videos`, and `/videos/:slug` paths.

### Changed
- The video library is now the home page (`/`). Deep links stay at `/vids/:slug`.
- `src/data/projects.json` holds videos only (26 entries; 9 photo and
  cinemagraph entries removed).
- The header is a title bar; the multi-section nav, login, and profile menu are gone.
- CSP in `index.html` narrowed to the media host and Google Fonts.
- CI now runs lint, typecheck, tests, and build, and injects no API keys.
- Dependencies cut from 33 runtime packages to 5.

### Removed
- The Express/PostgreSQL backend (`server/`) and all API routes.
- Accounts, Google OAuth, JWT sessions, admin dashboard, and mailing list.
- All AI tooling and the Gemini integration.
- Every tool page (paystub analyzer, mediscribe, neuroaesthetic, public health,
  pin pals, background removal, color palette, nylon fabric designer, wood
  carving visualizer, ideas board, media insight, automation recommender).
- The Images and Cinemagraphs portfolio sections.
- The Electron desktop app.
