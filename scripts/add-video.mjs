#!/usr/bin/env node
/**
 * Adds a video to src/data/projects.json from its Firebase Storage download URL.
 *
 * Get the URL in the Firebase console: Storage -> click the file -> copy the
 * "Download URL" (it already contains the ?alt=media&token=... needed to play).
 *
 *   npm run add-video -- \
 *     --video "https://firebasestorage.googleapis.com/v0/b/.../o/videos%2Ffoo.m4v?alt=media&token=..." \
 *     --thumb "https://firebasestorage.googleapis.com/v0/b/.../o/thumbnails%2Ffoo.webp?alt=media&token=..." \
 *     --title "Foo" --date 05/2026
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// PROJECTS_FILE lets the tests point at a scratch copy instead of real data.
const DATA =
  process.env.PROJECTS_FILE ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/data/projects.json");
const HOST = "firebasestorage.googleapis.com";

const FLAGS = [
  "video", "thumb", "title", "date",
  "description", "location", "gps", "tags",
];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const name = arg.slice(2);
    if (!FLAGS.includes(name)) {
      throw new Error(`Unknown flag --${name}. Known flags: ${FLAGS.join(", ")}`);
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`--${name} needs a value`);
    }
    out[name] = value;
    i += 1;
  }
  return out;
}

/** Pulls the bucket and object path out of a Firebase download URL. */
function parseFirebaseUrl(raw, label) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`--${label} is not a valid URL`);
  }
  if (url.hostname !== HOST) {
    throw new Error(`--${label} must be a ${HOST} URL, got ${url.hostname}`);
  }
  const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
  if (!match) {
    throw new Error(`--${label} is not a Firebase object URL (expected /v0/b/<bucket>/o/<path>)`);
  }
  if (!url.searchParams.get("token")) {
    throw new Error(
      `--${label} has no ?token=. Copy the full "Download URL" from the Firebase console, not the object path.`,
    );
  }
  return { bucket: match[1], objectPath: decodeURIComponent(match[2]) };
}

/** Mirrors slugify() in src/utils/slugs.ts, which derives the /vids/<slug> route. */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/** Confirms the URL actually serves bytes, so a bad or revoked token fails here. */
async function verifyReachable(url, label) {
  let res;
  try {
    res = await fetch(url, { headers: { Range: "bytes=0-0" } });
  } catch (error) {
    throw new Error(`--${label} could not be fetched: ${error.message}`);
  }
  if (res.status !== 200 && res.status !== 206) {
    let detail = "";
    if (res.status === 402) detail = " (Firebase billing account is disabled)";
    if (res.status === 403) detail = " (token wrong or revoked)";
    if (res.status === 404) detail = " (no such object)";
    throw new Error(`--${label} returned HTTP ${res.status}${detail}`);
  }
  return res.headers.get("content-type") ?? "";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  for (const required of ["video", "title", "date"]) {
    if (!args[required]) throw new Error(`--${required} is required`);
  }
  if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(args.date)) {
    throw new Error(`--date must be MM/YYYY (e.g. 05/2026), got "${args.date}"`);
  }

  const projects = JSON.parse(await readFile(DATA, "utf8"));

  // Every existing entry shares one bucket; a new video must too, or the
  // Content-Security-Policy in index.html would block it.
  const buckets = new Set(
    projects.map((p) => parseFirebaseUrl(p.projectUrl, "existing projectUrl").bucket),
  );
  if (buckets.size !== 1) {
    throw new Error(`Expected one bucket across projects.json, found: ${[...buckets].join(", ")}`);
  }
  const [expectedBucket] = [...buckets];

  const video = parseFirebaseUrl(args.video, "video");
  if (video.bucket !== expectedBucket) {
    throw new Error(
      `--video points at bucket "${video.bucket}" but the site uses "${expectedBucket}". ` +
        `Serving from another bucket also needs the CSP in index.html widened.`,
    );
  }

  let thumb = null;
  if (args.thumb) {
    thumb = parseFirebaseUrl(args.thumb, "thumb");
    if (thumb.bucket !== expectedBucket) {
      throw new Error(`--thumb points at bucket "${thumb.bucket}" but the site uses "${expectedBucket}"`);
    }
  }

  const slug = slugify(args.title);
  if (!slug) throw new Error(`--title "${args.title}" produces an empty URL slug`);

  const clash = projects.find((p) => slugify(p.title) === slug);
  if (clash) {
    throw new Error(
      `Slug "${slug}" is already used by "${clash.title}" (id ${clash.id}). ` +
        `Slugs are the /vids/<slug> permalink, so titles must be distinct.`,
    );
  }
  if (projects.some((p) => p.projectUrl === args.video)) {
    throw new Error("That video URL is already in projects.json");
  }

  // The filename does not have to match the slug, but a mismatch is usually a typo.
  const videoBasename = path.basename(video.objectPath).replace(/\.[^.]+$/, "");
  if (videoBasename !== slug) {
    console.warn(
      `note: video file is "${videoBasename}" but the title slugs to "${slug}"; ` +
        `the permalink will be /vids/${slug}`,
    );
  }

  console.log("Verifying media is reachable...");
  console.log(`  video: ${await verifyReachable(args.video, "video")}`);
  if (args.thumb) console.log(`  thumb: ${await verifyReachable(args.thumb, "thumb")}`);

  const entry = {
    id: Math.max(...projects.map((p) => Number(p.id))) + 1,
    type: "video",
    title: args.title,
    description: args.description ?? "",
    ...(args.thumb ? { imageUrl: args.thumb } : {}),
    projectUrl: args.video,
    date: args.date,
    ...(args.location ? { location: args.location } : {}),
    ...(args.gps ? { gpsCoords: args.gps } : {}),
    ...(args.tags
      ? { tags: args.tags.split(",").map((t) => t.trim()).filter(Boolean) }
      : {}),
  };

  // Newest first, matching how the grid sorts at runtime.
  const sortKey = (p) => `${p.date.slice(3)}${p.date.slice(0, 2)}`;
  const updated = [...projects, entry].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

  await writeFile(DATA, `${JSON.stringify(updated, null, 2)}\n`);

  console.log(`\nAdded "${entry.title}" (id ${entry.id}) -> /vids/${slug}`);
  if (!args.thumb) {
    console.log("No --thumb given; the card will show a placeholder tile instead of a poster image.");
  }
  console.log(`${updated.length} videos now in projects.json.`);
}

main().catch((error) => {
  console.error(`\nerror: ${error.message}`);
  process.exit(1);
});
