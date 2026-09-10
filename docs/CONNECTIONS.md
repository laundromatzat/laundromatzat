# External connections, API keys, and what to update

The simplified site is a **static SPA with no backend**. It makes exactly one
kind of outbound request: fetching thumbnails and video files from Firebase
Storage. Everything below is what that implies.

---

## 1. Firebase Storage — the only thing that must work

All 26 videos and their 26 thumbnails are absolute URLs in
`src/data/projects.json`, all pointing at one bucket:

```
host:   firebasestorage.googleapis.com
bucket: laundromat-zat.firebasestorage.app
form:   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=<uuid>
```

### Status: resolved (was broken)

Every media URL once returned **HTTP 402** (`The billing account for the owning
project is disabled in state closed`). Billing has since been re-enabled and the
media serves normally again.

Because a billing lapse or a revoked token leaves the build passing while the
site shows nothing, run `npm run check-media` after any Firebase change — it
fetches every thumbnail and video and fails loudly on 402/403/404.

### 1.1 About the `token=` values

Access is granted by a per-object **download token**, not by public ACLs — the
same URL without its token returns `403`. Consequences:

- Clicking "revoke token" on an object in the Firebase console **permanently
  breaks that URL**. There is no way to restore the old token; you must copy the
  newly generated one back into `projects.json`.
- These tokens are committed to the repository and are readable by anyone. For a
  public portfolio that is the intended delivery mechanism, but treat them as
  public URLs, not secrets. Do not store anything private in this bucket.

### 1.2 If you change media host

Update **both** places, or media will fail silently:

1. The `imageUrl` / `projectUrl` values in `src/data/projects.json`.
2. The Content-Security-Policy `<meta>` tag in `index.html` — see §2.

### 1.3 CORS

Not currently required. The site loads media with plain `<img src>` and
`<video><source src>` and sets no `crossOrigin` attribute, so these are not
CORS-gated requests. You would only need a bucket CORS policy if you later fetch
media with `fetch()`/XHR, or add `crossOrigin` to draw video frames to a canvas.

---

## 2. Content-Security-Policy (`index.html`)

The CSP is now scoped tightly to what the site actually uses:

| Directive | Allows | Why |
| --- | --- | --- |
| `img-src` | `'self' data: blob:` + `firebasestorage.googleapis.com` | thumbnails / video posters |
| `media-src` | `'self' blob:` + `firebasestorage.googleapis.com` | the video files |
| `connect-src` | `'self'` + `firebasestorage.googleapis.com` | service-worker precache |
| `style-src` / `font-src` | Google Fonts | webfonts in `index.html` |
| `script-src` | `'self'` | no third-party scripts remain |

**If you move the media to a new host, add that host to `img-src`, `media-src`,
and `connect-src`.** A CSP violation produces a blank player with only a console
error, which is easy to misdiagnose.

The previous CSP allowed `https:` for images, `*` for media, and
`generativelanguage.googleapis.com` + `localhost:*` for connections. Those were needed
by the removed AI tools and backend and are now gone.

---

## 3. Build-time environment variables

Only one remains, and it is **not a secret**:

| Variable | Required? | Purpose |
| --- | --- | --- |
| `VITE_SITE_URL` | Optional | Absolute base for `<link rel="canonical">` and OpenGraph URLs. Set to `https://laundromatzat.com` in `deploy.yml`. If unset, falls back to the browser's own origin, so local dev works with no configuration. |

There is **no `.env` file to create** for local development. `npm install && npm run dev` is sufficient.

---

## 4. Credentials that are no longer used — revoke these

The removed features (AI tools, accounts, admin dashboard, mailing list,
paystub analyzer) were the only consumers of the following. Nothing in the
codebase reads them any more. **Because several were exposed to the browser via
the `VITE_` prefix, they should be treated as compromised and rotated or deleted
rather than merely unset.**

### GitHub → Settings → Secrets and variables → Actions

| Secret | Action |
| --- | --- |
| `VITE_GEMINI_API_KEY` | **Delete the secret and revoke the key** in Google AI Studio. `VITE_`-prefixed values are inlined into the public JS bundle, so this key was published on every previous deploy. |
| `GEMINI_API_KEY` | Same — delete and revoke. |
| `VITE_API_URL` | Delete. There is no backend to point at. |

Both workflows have already been updated to stop injecting these.

### Server-side credentials (the deleted `server/` directory)

If a backend is still deployed anywhere, decommission it and retire these:

- `DATABASE_URL` — the PostgreSQL database is unused; back it up before dropping.
- `JWT_SECRET` — rotate/retire; it signed login sessions that no longer exist.
- Google OAuth **client ID and client secret** — delete the OAuth client in the
  Google Cloud console, and remove `laundromatzat.com` from its authorized
  redirect URIs.
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` — rotate the mail credentials.
- The `x-api-key` header value that used to guard `/api/subscribers` and
  `/admin/mailing-list` (previously declared in `metadata.json`, now removed).

### Firebase

`.firebaserc` was removed: it named a **different** project
(`laundromatzat-gemini`) from the one that actually owns the media bucket
(`laundromat-zat`), and the site deploys to GitHub Pages rather than Firebase
Hosting. If `laundromatzat-gemini` is otherwise unused, consider shutting it
down. **Do not delete the project that owns `laundromat-zat`** — that is where
the videos live.

---

## 5. Hosting and DNS

- Deployed by `.github/workflows/deploy.yml` to **GitHub Pages** on push to `main`.
- `public/CNAME` pins the custom domain `laundromatzat.com`; its DNS must keep
  pointing at GitHub Pages. Leave this file in place or the domain will unbind
  on the next deploy.
- `npm run build` copies `index.html` to `404.html` so that deep links like
  `/vids/sea-of-love` resolve — GitHub Pages serves `404.html` for unknown
  paths, which lets the client-side router take over. Keep this step.

---

## Quick checklist

- [x] **Re-enable billing on the Firebase project that owns `laundromat-zat`.** Done — verified serving.
- [ ] Delete and revoke `VITE_GEMINI_API_KEY` / `GEMINI_API_KEY`.
- [ ] Delete the `VITE_API_URL` secret.
- [ ] Decommission the old backend; rotate `JWT_SECRET`, SMTP, and OAuth credentials; back up then drop the database.
- [ ] Confirm `VITE_SITE_URL` is set to `https://laundromatzat.com` in `deploy.yml` (already done).
- [ ] Verify `laundromatzat.com` DNS still points at GitHub Pages.
