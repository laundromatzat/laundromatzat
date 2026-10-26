# Wedding site template

A scroll-driven storytelling site: welcome → our story → the theme → the day → travel → FAQ → RSVP.
Plain HTML, CSS and JS. No build step, no dependencies, and separate from the music-video app in the
repo root.

```bash
cd wedding-site
python3 -m http.server 8000   # or any static server; open http://localhost:8000
```

## Where things go

| To change…                         | Edit                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| Names, date, venue, RSVP target    | `config.js` (drives countdown, calendar file, RSVP)         |
| Text and section content           | `index.html` (placeholder copy is marked as such)           |
| Colours, fonts, spacing            | tokens at the top of `styles.css`                           |
| Photos                             | replace `<figure class="slot" data-slot="…">` with `<img>` inside it |
| Story beats                        | `<li class="beat">` in `#story`; keep `--beats`, the four `.beat:nth-child` ranges and `400svh` in step |

Names and the date also appear as text in `index.html` (title, hero, footer); update them there too.

## How the storytelling works

- **Pinned scene.** `#story` is 400svh tall and its stage is `position: sticky`. One scroll timeline
  (`view-timeline: --story`) drives the three brush lines, the seal, the progress bar and which beat is
  visible. The `cover 20%–80%` range is exactly the pinned span.
- **Reveals.** Anything with `.reveal` fades up as it enters; `.reveal--left` / `--right` slide sideways.
- **Depth.** The hero ink washes drift at different rates (`--depth` on each `.ink-layer`).
- **Chapter dots and a top progress bar** track position.

## Accessibility and fallbacks

Motion is layered on a complete static page. A script in `<head>` picks one of:

- `sd-native`: CSS scroll-driven animations (Chrome, Edge, Safari 26+).
- `sd-fallback`: the same effects driven by `main.js` (Firefox, older Safari).
- neither, when the visitor prefers reduced motion. They get the finished page: beats stacked,
  drawing complete, nothing pinned. The same applies with JS off.

All story text stays in the accessibility tree at every scroll position.

## Before launch

- [ ] Replace placeholder copy and `config.js`
- [ ] Add photos, plus `og:image` in `<head>` (check the link preview)
- [ ] Set `rsvp.endpoint` (e.g. a Formspree URL) or confirm `rsvp.email`. Test a real submission.
- [ ] Optional: load a web font (the stack falls back to system serifs)
