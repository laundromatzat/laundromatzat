#!/usr/bin/env node
/**
 * Verifies every thumbnail and video in src/data/projects.json still serves bytes.
 *
 * Catches the failure modes that are invisible in a build: a revoked download
 * token, a deleted object, or a disabled Firebase billing account (HTTP 402),
 * any of which leave the site building fine but showing nothing.
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
      return { ...target, ok: true, type: res.headers.get("content-type") ?? "" };
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
