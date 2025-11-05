# Production Deployment Runbook

This runbook explains how to publish the Laundromatzat experience so the `/tools` page and other dynamic
features are available on https://laundromatzat.com. The repository now only runs CI checks, so you must
ship both the Vite frontend and the Express server to your own hosting platforms.

## Overview of the deployment topology

| Piece | Purpose | Recommended hosting options |
| ----- | ------- | --------------------------- |
| Frontend (`npm run build` → `dist/`) | Static React application served over HTTPS | Netlify, Vercel, Cloudflare Pages, GitHub Pages + CDN |
| API server (`npm run server`) | Express 5 service that powers the Gemini assistant and mailing list | Render, Fly.io, Railway, DigitalOcean App Platform |
| Persistent storage | Subscriber ledger (`data/subscribers.json`) and email outbox (`data/outbox/`) | Platform-provided disk volumes or S3-compatible bucket |

The frontend and API can live on separate hosts. Make sure `VITE_API_BASE_URL` in the frontend build points
to the API’s public URL and that the API’s `CORS_ORIGINS` include the frontend’s domain.

## 1. Prepare the repository

1. Pull the latest `main` branch locally and confirm the CI pipeline passes: `npm install && npm run build`.
2. Commit any content changes you need before deployment (new tools, data updates, etc.).
3. Tag a release commit if you want a clear reference for the version that goes live.

## 2. Deploy the frontend (example: Netlify)

1. Sign in to [Netlify](https://www.netlify.com/) and choose **Add new site → Import an existing project**.
2. Connect your GitHub account and select the `laundromatzat` repository.
3. Use these build settings:
   - **Base directory:** `.`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add the following environment variables under **Site configuration → Environment variables**:
   - `VITE_API_BASE_URL` → the HTTPS URL where the Express server will be hosted (e.g. `https://api.laundromatzat.com`).
   - `VITE_SITE_URL` → the public URL for the frontend (e.g. `https://laundromatzat.com`).
5. Trigger a deploy. Netlify builds the site and publishes the static assets globally.
6. After the API is live, add a redirect for the admin dashboard if you serve it from a subdomain (optional).

> **Alternative providers**
>
> - **Vercel**: Build command `npm run build`, output directory `dist`. Set the same `VITE_*` variables in the project settings.
> - **Cloudflare Pages**: Framework preset “Vite”. Use `npm run build` and `dist` as the output directory.

## 3. Deploy the API (example: Render)

1. Sign in to [Render](https://render.com/) and click **New → Web Service**.
2. Choose the `laundromatzat` repository and the `main` branch.
3. Configure the service:
   - **Root directory:** `.`
   - **Environment:** `Node`
   - **Build command:** `npm install`
   - **Start command:** `npm run server`
   - **Instance type:** Pick at least the starter tier so the service has persistent disk support.
4. Under **Environment variables**, supply the production secrets:
   - `GEMINI_API_KEY`
   - `MAILING_LIST_ADMIN_KEY`
   - `MAILING_LIST_FROM_EMAIL`
   - `MAILING_LIST_SMTP_URL` (omit if you prefer JSON outbox testing)
   - `MAILING_LIST_STORAGE_PATH` (e.g. `/data/subscribers.json` when using a mounted disk)
   - `MAILING_LIST_OUTBOX_PATH` (e.g. `/data/outbox`)
   - `CORS_ORIGINS` (include the frontend domain and Netlify preview domains if needed)
5. Enable **Persistent Disk** and mount it at `/data` so the subscriber ledger and outbox survive restarts.
6. Deploy the service. Render runs `npm install` (which keeps dev dependencies like `tsx` available) and then launches the
   Express server with `npm run server`.
7. Copy the generated service URL (e.g. `https://laundromatzat-api.onrender.com`) for use in the frontend’s `VITE_API_BASE_URL`.

> **Alternative providers**
>
> - **Fly.io**: Use `fly launch`, configure a Node builder image, and attach a volume for `/data`.
> - **Railway**: Create a “Node.js” service, set the start command to `npm run server`, and add a “Volume” plugin.
> - **DigitalOcean App Platform**: Deploy as a Node component with build command `npm install` and run command `npm run server`.

## 4. Update DNS and HTTPS

1. Point your apex (`laundromatzat.com`) and `www` records to the frontend host using CNAME/ANAME records per the provider’s
   documentation.
2. If you host the API on a separate subdomain (e.g. `api.laundromatzat.com`), add an `A`/`CNAME` record pointing to the API
   provider. Issue TLS certificates through the hosting dashboard.
3. Test HTTPS for both domains using [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/).

## 5. Connect the frontend to the live API

1. Once DNS has propagated, redeploy the frontend with `VITE_API_BASE_URL` set to the API’s HTTPS endpoint.
2. Confirm the Express server’s `CORS_ORIGINS` includes the final frontend URL (with and without `www`).
3. Rebuild the frontend via the hosting provider to bake the API URL into the bundle.

## 6. Post-deployment validation

1. Visit `/tools` and `/admin/mailing-list` on the production site to ensure the new “tools” grid loads correctly.
2. Complete a test subscription and verify the subscriber appears in the API host’s persisted `subscribers.json`.
3. Trigger a test newsletter from the admin dashboard to confirm SMTP credentials work (or that JSON outbox files are written).
4. Check server logs for rate-limit or CORS errors.
5. Review the CI build artifact (`frontend-dist`) generated on each push if you need a manual fallback download of the static
   assets.

## 7. Automate future deployments

1. Create a dedicated GitHub Actions workflow per provider (Render deploy hook, Netlify CLI, etc.) once you have production
   credentials stored as GitHub secrets.
2. Gate deploy steps behind the `main` branch and tag filters to prevent accidental publishes.
3. Update this runbook whenever the infrastructure changes so future contributors understand the release process.

## Quick reference checklist

- [ ] Frontend host connected to GitHub with `npm run build` → `dist`.
- [ ] `VITE_API_BASE_URL` and `VITE_SITE_URL` set in the frontend host’s environment.
- [ ] API host running `npm run server` with required environment variables.
- [ ] Persistent storage mounted for subscriber data and outbox.
- [ ] DNS records updated for frontend and API origins.
- [ ] Smoke tests completed (subscribe, admin broadcast, Gemini assistant prompts).
- [ ] CI artifact available for manual redeploys if needed.
