#!/usr/bin/env node
/**
 * Verifies every thumbnail and video in src/data/projects.json still serves bytes.
 *
 * Catches the failure modes that are invisible in a build: a revoked download
 * token, a deleted object, or a disabled Firebase billing account (HTTP 402),
 * any of which leave the site building fine but showing nothing.
 *
 * It also reports how the objects are being delivered -- size and Cache-Control
 * -- because those are the two things that decide whether the site feels fast
 * and what the bucket costs to serve. See docs/VIDEO-DELIVERY.md.
 *
 *   npm run check-media
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// PROJECTS_FILE lets the tests point at a scratch copy instead of real data.
const DATA =
  process.env.PROJECTS_FILE ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/data/projects.json");
const CONCURRENCY = 6;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "unknown size";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

/** Firebase Storage defaults to "private, max-age=0", which defeats every cache. */
function isUncacheable(cacheControl) {
  return /no-store|no-cache|private|max-age=0/i.test(cacheControl);
}

function explain(status) {
  if (status === 402) return "Firebase billing account disabled";
  if (status === 403) return "token wrong or revoked";
  if (status === 404) return "object not found";
  return "unexpected status";
}

async function check(target) {
  try {
    const res = await fetch(target.url, { headers: { Range: "bytes=0-0" } });
    if (res.status === 200 || res.status === 206) {
      // Content-Range on a ranged request reports the full object size.
      const range = res.headers.get("content-range") ?? "";
      const total = Number(range.split("/")[1]);
      return {
        ...target,
        ok: true,
        type: res.headers.get("content-type") ?? "",
        bytes: Number.isFinite(total) ? total : null,
        cacheControl: res.headers.get("cache-control") ?? "",
      };
    }
    return { ...target, ok: false, detail: `HTTP ${res.status} (${explain(res.status)})` };
  } catch (error) {
    return { ...target, ok: false, detail: error.message };
  }
}

/** Runs checks a few at a time so we do not open 50+ sockets at once. */
async function runPooled(targets) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
    while (cursor < targets.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await check(targets[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const projects = JSON.parse(await readFile(DATA, "utf8"));

  const targets = [];
  for (const project of projects) {
    if (project.imageUrl) {
      targets.push({ title: project.title, kind: "thumb", url: project.imageUrl });
    }
    if (project.projectUrl) {
      targets.push({ title: project.title, kind: "video", url: project.projectUrl });
    }
  }

  console.log(`Checking ${targets.length} URLs across ${projects.length} videos...\n`);
  const results = await runPooled(targets);
  const failures = results.filter((r) => !r.ok);

  for (const failure of failures) {
    console.error(`FAIL  ${failure.kind.padEnd(5)}  ${failure.title} — ${failure.detail}`);
  }

  const videos = results.filter((r) => r.ok && r.kind === "video");
  if (videos.length > 0) {
    const totalBytes = videos.reduce((sum, v) => sum + (v.bytes ?? 0), 0);
    const largest = [...videos].sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0)).slice(0, 3);
    console.log(
      `\nVideo payloads: ${formatBytes(totalBytes)} across ${videos.length} files, ` +
        `largest ${largest.map((v) => `${v.title} (${formatBytes(v.bytes)})`).join(", ")}.`,
    );
  }

  const uncacheable = results.filter((r) => r.ok && isUncacheable(r.cacheControl));
  if (uncacheable.length > 0) {
    console.log(
      `\n${uncacheable.length} of ${results.filter((r) => r.ok).length} objects are served ` +
        `uncacheable (e.g. "${uncacheable[0].cacheControl}"), so every play and every page view ` +
        "re-downloads them from Firebase in full.\n" +
        "Fix with one command over the bucket — see docs/VIDEO-DELIVERY.md.",
    );
  }

  const missingThumb = projects.filter((p) => !p.imageUrl);
  if (missingThumb.length > 0) {
    console.log(
      `\n${missingThumb.length} video(s) have no thumbnail and fall back to a placeholder tile: ` +
        missingThumb.map((p) => p.title).join(", "),
    );
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} of ${targets.length} URLs failed.`);
    process.exit(1);
  }
  console.log(`All ${targets.length} URLs OK.`);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
