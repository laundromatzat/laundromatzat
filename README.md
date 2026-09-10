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
| `npm run build` | Production build to `dist/` (prerenders per-video link previews, plus a `404.html` copy for SPA routing on GitHub Pages) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run add-video` | Append a video to `projects.json` from its Firebase download URL |
| `npm run check-media` | Verify every thumbnail and video still loads, and report how they are delivered |
| `npm run transcode-hls` | Encode one video into an adaptive-bitrate HLS ladder ([docs](docs/VIDEO-DELIVERY.md)) |
| `npm run transcode-all` | Do that for every video that has no `streamUrl` yet, uploading and recording each |

## Adding a video

Everything the site renders comes from **`src/data/projects.json`**. Adding a
video needs no code change.

### The easy way

1. Upload the video to `videos/` in Firebase Storage (and, ideally, a matching
   poster image to `thumbnails/`).
2. In the Firebase console, click each file and copy its **Download URL** — the
   long one ending in `?alt=media&token=...`. The token is what lets the site
   play the file, so the plain object path will not work.
3. Run:

```bash
npm run add-video -- \
  --video "https://firebasestorage.googleapis.com/v0/b/.../o/videos%2Fmy-video.m4v?alt=media&token=..." \
  --thumb "https://firebasestorage.googleapis.com/v0/b/.../o/thumbnails%2Fmy-video.webp?alt=media&token=..." \
  --title "My Video" \
  --date 05/2026 \
  --description "One line." \
  --location "Vancouver" \
  --tags "Michael,Canada"
```

Only `--video`, `--title`, and `--date` are required. The script checks the URLs
actually serve bytes before writing, so a revoked token or a disabled billing
account fails immediately rather than silently shipping a broken tile.

Commit the change and open a PR — the site redeploys on merge to `main`.

### Or edit the JSON directly

```jsonc
{
  "id": 36,                       // unique
  "type": "video",                // must be "video"
  "title": "My Video",            // also generates the URL slug: /vids/my-video
  "description": "One line.",
  "imageUrl": "https://.../thumb.webp",  // optional poster; omit for a placeholder tile
  "projectUrl": "https://.../video.m4v", // the video file itself
  "streamUrl": "https://.../master.m3u8", // optional HLS ladder; see docs/VIDEO-DELIVERY.md
  "date": "03/2026",              // MM/YYYY — drives sort order (newest first)
  "location": "Vancouver",        // optional
  "gpsCoords": "49.28, -123.11",  // optional
  "tags": ["optional", "labels"]
}
```

The list is sorted by `date` descending at render time, so ordering in the file
does not matter.

### Checking the media still works

```bash
npm run check-media
```

Fetches every thumbnail and video and reports anything that no longer serves
bytes — a revoked token, a deleted object, or a disabled Firebase billing
account (HTTP 402). These all leave the build passing while the site shows
nothing, so this is worth running after any Firebase change.

It also reports total payload and flags objects served with a `Cache-Control`
that defeats caching, which is Firebase Storage's default. See
[docs/VIDEO-DELIVERY.md](docs/VIDEO-DELIVERY.md) for the one-command fix and
for how to move a video to adaptive-bitrate playback.

## Sharing a video

`npm run build` writes a static HTML page for every video under `dist/vids/`,
carrying that video's own title, description and thumbnail as Open Graph tags.
Link unfurlers do not run JavaScript, so without this a shared `/vids/<slug>`
link would preview as a blank card. The build also emits `sitemap.xml`.

If you add or rename a video, the previews regenerate on the next deploy — no
manual step.

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
