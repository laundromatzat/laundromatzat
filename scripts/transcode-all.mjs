#!/usr/bin/env node
/**
 * Moves every remaining video to adaptive bitrate, in one command.
 *
 *   npm run transcode-all -- --dry-run    # what it would do
 *   npm run transcode-all -- --yes        # actually do it
 *
 * For each video in projects.json that has a `projectUrl` but no `streamUrl`,
 * this transcodes an HLS ladder, uploads it, and writes the resulting
 * `streamUrl` back into projects.json. Nothing has to be copied by hand.
 *
 * Three things make it safe to leave running:
 *
 * - It reads the source straight from its Firebase URL, so no local masters
 *   are needed and nothing is downloaded twice.
 * - projects.json is updated after each video's upload succeeds, so the run is
 *   resumable: re-running skips whatever already has a `streamUrl`.
 * - The ladder is deleted once uploaded, so peak disk use is one video's worth
 *   (roughly half the source), not the whole library's.
 *
 * It needs ffmpeg and a gcloud authenticated against the bucket. Budget about
 * two minutes of CPU per minute of 1080p video.
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { MANIFEST_NAME, slugify } from "./transcode-hls.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJECTS_FILE = process.env.PROJECTS_FILE ?? path.join(ROOT, "src", "data", "projects.json");
const TRANSCODE = path.join(ROOT, "scripts", "transcode-hls.mjs");

/** Videos worth doing first: the ones costing visitors the most. */
export function orderByPayload(projects, sizes = new Map()) {
  return [...projects].sort((a, b) => (sizes.get(b.title) ?? 0) - (sizes.get(a.title) ?? 0));
}

export function pendingVideos(projects) {
  return projects.filter((video) => video.projectUrl && !video.streamUrl);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "unknown size";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

/** Reads the object size from a ranged request, without downloading the file. */
async function probeSize(url) {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-0" } });
    const total = Number((res.headers.get("content-range") ?? "").split("/")[1]);
    return Number.isFinite(total) ? total : 0;
  } catch {
    return 0;
  }
}

function run(command, args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function readProjects() {
  return JSON.parse(await fs.readFile(PROJECTS_FILE, "utf8"));
}

/**
 * Writes the stream URL back, re-reading first.
 *
 * A run takes hours, and re-reading means an edit made to projects.json
 * meanwhile is not clobbered by a stale in-memory copy.
 */
async function recordStreamUrl(title, streamUrl) {
  const projects = await readProjects();
  const video = projects.find((entry) => entry.title === title);
  if (!video) {
    throw new Error(`"${title}" is no longer in projects.json`);
  }
  video.streamUrl = streamUrl;
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2) + "\n", "utf8");
}

function parseArgs(argv) {
  const options = { dryRun: false, confirmed: false, limit: Infinity, only: null, keep: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--yes") options.confirmed = true;
    else if (arg === "--keep") options.keep = true;
    else if (arg === "--limit") options.limit = Number(argv[++i]);
    else if (arg === "--only") options.only = argv[++i];
    else throw new Error(`Unknown flag ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const projects = await readProjects();

  let queue = pendingVideos(projects);
  if (options.only) {
    queue = queue.filter((video) => slugify(video.title) === options.only);
    if (queue.length === 0) {
      throw new Error(`No pending video with slug "${options.only}"`);
    }
  }

  if (queue.length === 0) {
    console.log("Every video already has a streamUrl. Nothing to do.");
    return;
  }

  process.stdout.write(`Measuring ${queue.length} sources... `);
  const sizes = new Map(
    await Promise.all(queue.map(async (v) => [v.title, await probeSize(v.projectUrl)])),
  );
  console.log("done\n");

  queue = orderByPayload(queue, sizes).slice(0, options.limit);
  const total = queue.reduce((sum, v) => sum + (sizes.get(v.title) ?? 0), 0);

  console.log(`${queue.length} video(s) to transcode, ${formatBytes(total)} of source:\n`);
  for (const video of queue) {
    console.log(`  ${formatBytes(sizes.get(video.title)).padStart(9)}  ${video.title}`);
  }

  if (options.dryRun || !options.confirmed) {
    console.log(
      `\n${options.dryRun ? "Dry run" : "Not confirmed"} — nothing transcoded or uploaded.` +
        "\nRe-run with --yes to go ahead. Expect roughly two minutes of CPU per" +
        "\nminute of 1080p video, and re-running later resumes where it stopped.",
    );
    return;
  }

  const workRoot = await fs.mkdtemp(path.join(os.tmpdir(), "laundromatzat-hls-"));
  let done = 0;

  try {
    for (const video of queue) {
      const slug = slugify(video.title);
      const outDir = path.join(workRoot, slug);
      console.log(`\n=== ${video.title} (${done + 1}/${queue.length}) ===`);

      await run("node", [TRANSCODE, video.projectUrl, "--slug", slug, "--out", workRoot]);
      await run("bash", [path.join(outDir, "upload.sh")]);

      const manifest = JSON.parse(await fs.readFile(path.join(outDir, MANIFEST_NAME), "utf8"));
      await recordStreamUrl(video.title, manifest.streamUrl);
      console.log(`recorded streamUrl for "${video.title}"`);

      if (!options.keep) {
        await fs.rm(outDir, { recursive: true, force: true });
      }
      done += 1;
    }
  } catch (error) {
    console.error(
      `\nStopped after ${done} of ${queue.length}: ${error.message}\n` +
        `Everything finished so far is already in projects.json.\n` +
        `Re-run the same command to pick up where this left off.` +
        (options.keep ? `\nPartial output kept in ${workRoot}` : ""),
    );
    process.exitCode = 1;
    return;
  } finally {
    if (!options.keep) {
      await fs.rm(workRoot, { recursive: true, force: true });
    }
  }

  console.log(
    `\nAll ${done} transcoded, uploaded and recorded.\n` +
      "Next: npm run check-media, then commit src/data/projects.json.",
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`transcode-all failed: ${error.message}`);
    process.exit(1);
  });
}
