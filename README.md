# laundromatzat.com — Music Videos

A static, single-purpose website: a repository of music videos. No backend, no
database, no accounts, no third-party APIs.

Visitors land on a grid of every video, click one to open it in a player, and
can page through the library with the arrow keys. Each video has a shareable
permalink at `/vids/<slug>`.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` (plus a `404.html` copy for SPA routing on GitHub Pages) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |

## Adding or editing a video

Everything the site renders comes from **`src/data/projects.json`**. Adding a
video needs no code change — append an object to that array:

```jsonc
{
  "id": 36,                       // unique
  "type": "video",                // must be "video"
  "title": "My Video",            // also generates the URL slug: /vids/my-video
  "description": "One line.",
  "imageUrl": "https://.../thumb.webp",  // poster/thumbnail
  "projectUrl": "https://.../video.m4v", // the video file itself
  "date": "03/2026",              // MM/YYYY — drives sort order (newest first)
  "location": "Vancouver",        // optional
  "gpsCoords": "49.28, -123.11",  // optional
  "tags": ["optional", "labels"]
}
```

The list is sorted by `date` descending at render time, so ordering in the file
does not matter.

## Architecture

```
src/
  data/projects.json     the entire content of the site
  pages/VideosPage.tsx   the grid + player route
  components/            Header, ProjectGrid, ProjectCard, PortfolioModal, ...
  utils/                 slug, date, and JSON parsing helpers
```

Stack: React 19, React Router 7, TypeScript, TailwindCSS, Vite. Deployment is
GitHub Pages via `.github/workflows/deploy.yml`.

## External connections

The site itself needs **no API keys**. The one external dependency is the media
host. See [`docs/CONNECTIONS.md`](docs/CONNECTIONS.md) for the full rundown,
including the credentials that are no longer needed and should be revoked.
