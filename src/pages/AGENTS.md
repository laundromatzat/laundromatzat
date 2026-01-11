# Agent Instructions

These instructions apply to React pages under `pages/`.

## Background removal tool

`BackgroundRemovalPage.tsx` integrates the `@imgly/background-removal` WebAssembly package (v1.7). When altering this workflow:

- Import the helper via `import { removeBackground } from '@imgly/background-removal';` and call it with a `File`/`Blob`. Keep the
  async/await pattern—callbacks from previous versions are no longer supported.
- Continue exposing the progress callback so UI updates remain responsive. The callback receives the phase key plus the current
  and total steps as described in the vendor docs: <https://docs.img.ly/background-removal/web/>.
- The library emits `Blob` instances; persist them in IndexedDB through `services/backgroundRemovalStorage.ts` so users can
  recover previous results after reloads.
- Avoid bundling server-side fallbacks. The package is browser-only and must be guarded against SSR usage (see the existing
  runtime checks before accessing `window`).
