# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What this is

A **static music video library** — the whole site is one grid of videos plus a
player modal. There is no backend, no database, no authentication, and no
third-party API. Treat any suggestion to add one as out of scope unless asked.

## Commands

```bash
npm install
npm run dev          # Vite dev server on :5173
npm run build        # production build to dist/
npm run preview      # serve the production build

npm run lint         # ESLint, zero warnings allowed
npx tsc --noEmit     # typecheck
npm test             # Vitest
npm run test:e2e     # Playwright

npm run add-video      # append a video from its Firebase download URL
npm run check-media    # verify every thumbnail/video still serves bytes
npm run transcode-hls  # encode one video into an adaptive-bitrate HLS ladder
npm run transcode-all  # do that for every video still lacking a streamUrl
```

Pre-commit hooks (Husky + lint-staged) lint changed files.

## Architecture

```
src/
  data/projects.json      ← all site content lives here
  data/people.json        the names the People filter offers
  constants.ts            parses that JSON into the VIDEOS array
  index.tsx               router: "/" and "/vids/:slug"
  App.tsx                 layout shell
  pages/
    VideosPage.tsx        the grid + player route
    NotFoundPage.tsx
  components/
    ProjectGrid.tsx       grid + modal state, keyboard paging
    ProjectCard.tsx       one thumbnail card
    FilterBar.tsx         search, year chips, tag chips
    PortfolioModal.tsx    the video player
    Header.tsx, Container.tsx, PageMetadata.tsx, ErrorBoundary.tsx
    aura/                 AuraButton, AuraCard (design system)
  hooks/
    useAdaptiveVideoSource.ts   HLS where possible, the file otherwise
    useFocusTrap.ts             keeps keyboard focus inside the open player
    usePlayerShortcuts.ts       space/arrows/J L/M/F, shift+arrows to page
    useRememberedVolume.ts      volume and mute persist across videos
    useScrollLock.ts            pins the page behind the overlay (iOS-safe)
  utils/
    projectData.ts        JSON → Project, validates and derives `year`
    projectDates.ts       MM/YYYY parsing and sort
    slugs.ts              title → URL slug
    socialMetadata.ts     the og:/twitter: tags a page should carry
    videoFilters.ts       matching on four axes, facets, URL round trip
scripts/
  add-video.mjs           append an entry from a Firebase download URL
  check-media.mjs         verify media still serves, report size and caching
  prerender.mjs           post-build: static HTML per video, plus sitemap.xml
  transcode-hls.mjs       ffmpeg → adaptive-bitrate ladder + upload script
  transcode-all.mjs       runs that over the whole backlog, resumably
```

Stack: React 19, React Router 7, TypeScript, TailwindCSS 3.4, Vite 6.

## Conventions

- **Content changes go in `src/data/projects.json`, not in code.** Adding a video
  requires no code change — prefer `npm run add-video`, which validates the URL
  and checks it actually loads. Field reference is in `README.md`.
- `imageUrl` is optional. A video without a thumbnail (or whose thumbnail token
  is revoked) renders a placeholder tile rather than a broken image.
- **Types-first**: `src/types.ts` defines `Project`; extend it there.
- **Tailwind inline**, using the Aura palette in `tailwind.config.ts`. No
  per-component CSS files.
- Routing: `/` is the library; `/vids/:slug` deep-links one video. Slugs are
  derived from titles, so renaming a video changes its URL.
- `npm run build` runs `scripts/prerender.mjs` and then copies `index.html` to
  `404.html`, in that order. Prerendering writes a static page per video so a
  shared link unfurls with the right thumbnail; the `404.html` copy makes deep
  links work on GitHub Pages. Don't drop or reorder either step.
- **Link-preview tags live in `src/utils/socialMetadata.ts`**, and
  `scripts/prerender.mjs` mirrors it because the script is plain Node and
  cannot import TypeScript. `tests/scripts/prerender.test.ts` asserts the two
  stay in agreement — if you change one, change both.
- `streamUrl` on a video is an optional HLS playlist. Videos without one play
  the progressive file exactly as before, so adaptive playback rolls out one
  video at a time. See `docs/VIDEO-DELIVERY.md`.
- **The player uses native `<video controls>` on purpose.** They carry iOS
  fullscreen, Picture-in-Picture, AirPlay and the system caption menu, none of
  which a custom control bar gets for free. Everything around the controls --
  focus handling, keyboard, states, paging -- is ours.
- `App.tsx` moves focus to `<main>` on navigation, but skips it while a
  `[role="dialog"][aria-modal="true"]` is open: paging the player changes the
  URL every step and would otherwise drag focus out of the dialog.
- **Filters live in the URL** (`?q=`, `?year=`, `?person=`, `?location=`,
  `?tag=`), so a narrowed view is
  shareable, and they survive opening a video. A deep link wins over them: a
  `/vids/<slug>` the filters exclude still opens.
- **Filtering has four axes: year, people, location, tag.** Year and location are
  derived from the `date` and `location` fields; people come from
  `src/data/people.json`; tag is the catch-all and offers everything that is
  neither. People are curated because a name is not distinguishable from any
  other tag by shape — and splitting them out is what makes them usable, since
  the two most-tagged people are on 100% and 82% of the library and any
  "too common to be a useful filter" rule threw exactly them away. Each axis is
  a `<select>`, not a row of chips: 14 years, 24 locations and 32 tags do not
  fit in a wrapping row, and on a phone they buried the grid. Adding a person is
  a content edit, like adding a video.

## External connections

The site needs no API keys. Its one dependency is the Firebase Storage bucket
hosting the media, referenced by absolute URL from `projects.json`. If you
change media hosts you must also widen the CSP in `index.html`.

The bucket is not publicly listable and objects are readable only via their
per-object download token, so new videos cannot be discovered automatically —
they are added by hand (see `README.md`). `npm run check-media` verifies the
existing ones still load and reports how they are being delivered.

Adding a media host means widening `connect-src` as well as `media-src` in the
CSP: hls.js fetches playlists and segments over XHR rather than through the
`<video>` element. See `docs/VIDEO-DELIVERY.md`.

See `docs/CONNECTIONS.md` for the full rundown.
