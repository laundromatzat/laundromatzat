#!/usr/bin/env node
/**
 * Turns one source video into an adaptive-bitrate HLS ladder that Firebase
 * Storage can serve, and writes the upload script for it.
 *
 *   npm run transcode-hls -- ~/Movies/drift-away.mov
 *
 * Why this shape:
 *
 * Firebase Storage hands out one download token per object, so an ordinary HLS
 * encode -- hundreds of numbered .ts segments -- would need hundreds of tokens
 * baked into the playlists. Instead each rendition is encoded as fMP4 with
 * `-hls_flags single_file`, so it is exactly two objects (an init segment and
 * one media file the playlist seeks into with byte ranges) plus its playlist.
 * A four-rung ladder is 13 objects total.
 *
 * Tokens are generated here rather than read back after upload, because a
 * Firebase download token is just object metadata: setting
 * `firebaseStorageDownloadTokens` at upload time makes the URL predictable, so
 * the playlists can be written with their final absolute URLs before anything
 * is uploaded.
 *
 * The generated upload.sh is not run for you -- it needs credentials for the
 * bucket, and it sets Cache-Control, which is the other half of making
 * playback fast. Read it, then run it.
 *
 * See docs/VIDEO-DELIVERY.md.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DEFAULT_BUCKET = "laundromat-zat.firebasestorage.app";
/** One year, immutable: these objects are content-addressed by slug and never edited. */
export const CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * The bitrate ladder, highest first. Rungs above the source resolution are
 * dropped rather than upscaled -- upscaling costs bandwidth and looks worse.
 */
export const LADDER = [
  { name: "1080p", height: 1080, videoBitrate: "5000k", maxrate: "5350k", bufsize: "7500k" },
  { name: "720p", height: 720, videoBitrate: "2800k", maxrate: "2996k", bufsize: "4200k" },
  { name: "480p", height: 480, videoBitrate: "1400k", maxrate: "1498k", bufsize: "2100k" },
  { name: "360p", height: 360, videoBitrate: "800k", maxrate: "856k", bufsize: "1200k" },
];

/** Mirrors src/utils/slugs.ts. */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/** Keeps the rungs the source can actually fill, always at least the smallest. */
export function selectLadder(sourceHeight) {
  const usable = LADDER.filter((rung) => rung.height <= sourceHeight);
  return usable.length > 0 ? usable : [LADDER[LADDER.length - 1]];
}

export function firebaseUrl(bucket, objectPath, token) {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media&token=${token}`;
}

export function contentTypeFor(filename) {
  if (filename.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  return "video/mp4";
}

/**
 * Rewrites every relative URI in a playlist to its final absolute URL.
 *
 * Two kinds of line carry a URI: a bare line that is not a comment, and the
 * quoted URI="..." inside #EXT-X-MAP (and #EXT-X-I-FRAME-STREAM-INF, which the
 * master playlist can carry).
 */
export function rewritePlaylist(text, resolveUri) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === "") {
        return line;
      }

      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (match, uri) => {
          const resolved = resolveUri(uri);
          return resolved ? `URI="${resolved}"` : match;
        });
      }

      return resolveUri(trimmed) ?? line;
    })
    .join("\n");
}

/** The gcloud invocation that puts one file in the bucket with its token. */
export function uploadCommand({ bucket, objectPath, localFile, token }) {
  return [
    "gcloud storage cp",
    JSON.stringify(localFile),
    JSON.stringify(`gs://${bucket}/${objectPath}`),
    `--cache-control=${JSON.stringify(CACHE_CONTROL)}`,
    `--content-type=${JSON.stringify(contentTypeFor(objectPath))}`,
    `--custom-metadata=${JSON.stringify(`firebaseStorageDownloadTokens=${token}`)}`,
  ].join(" \\\n    ");
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${command} exited ${code}\n${stderr.slice(-2000)}`));
      }
    });
  });
}

async function requireTool(name) {
  try {
    await run(name, ["-version"]);
  } catch {
    throw new Error(
      `${name} is not installed. Install ffmpeg (macOS: "brew install ffmpeg") and try again.`,
    );
  }
}

async function probe(input) {
  const raw = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_type,height",
    "-of", "json",
    input,
  ]);
  const streams = JSON.parse(raw).streams ?? [];
  const video = streams.find((stream) => stream.codec_type === "video");
  if (!video) {
    throw new Error(`${input} has no video stream.`);
  }
  return { height: Number(video.height), hasAudio: streams.some((s) => s.codec_type === "audio") };
}

/** Builds the single ffmpeg invocation that writes the whole ladder. */
export function buildFfmpegArgs({ input, outDir, rungs, hasAudio }) {
  const split = `[0:v]split=${rungs.length}${rungs.map((_, i) => `[v${i}]`).join("")}`;
  const scales = rungs.map((rung, i) => `[v${i}]scale=-2:${rung.height}[v${i}out]`);

  const args = ["-y", "-i", input, "-filter_complex", [split, ...scales].join(";")];

  rungs.forEach((rung, i) => {
    args.push(
      "-map", `[v${i}out]`,
      `-c:v:${i}`, "libx264",
      `-b:v:${i}`, rung.videoBitrate,
      `-maxrate:v:${i}`, rung.maxrate,
      `-bufsize:v:${i}`, rung.bufsize,
    );
  });

  if (hasAudio) {
    rungs.forEach((_, i) => {
      args.push("-map", "a:0", `-c:a:${i}`, "aac", `-b:a:${i}`, "128k", `-ac:a:${i}`, "2");
    });
  }

  args.push(
    "-preset", "medium",
    "-profile:v", "main",
    "-crf", "20",
    // A fixed 2-second GOP with no scene-cut keyframes keeps the renditions
    // aligned, so a player can switch rungs at any segment boundary.
    "-g", "48",
    "-keyint_min", "48",
    "-sc_threshold", "0",
    "-f", "hls",
    "-hls_time", "6",
    "-hls_playlist_type", "vod",
    "-hls_segment_type", "fmp4",
    "-hls_flags", "single_file",
    "-hls_fmp4_init_filename", "%v-init.mp4",
    "-hls_segment_filename", path.join(outDir, "%v.m4s"),
    "-master_pl_name", "master.m3u8",
    "-var_stream_map",
    rungs
      .map((rung, i) => (hasAudio ? `v:${i},a:${i},name:${rung.name}` : `v:${i},name:${rung.name}`))
      .join(" "),
    path.join(outDir, "%v.m3u8"),
  );

  return args;
}

function parseArgs(argv) {
  const options = { input: undefined, slug: undefined, out: undefined, bucket: DEFAULT_BUCKET };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--slug") options.slug = argv[++i];
    else if (arg === "--out") options.out = argv[++i];
    else if (arg === "--bucket") options.bucket = argv[++i];
    else if (!options.input) options.input = arg;
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.input) {
    console.error("usage: npm run transcode-hls -- <input-video> [--slug s] [--out dir] [--bucket b]");
    process.exit(1);
  }

  await requireTool("ffmpeg");
  await requireTool("ffprobe");

  const slug = options.slug ?? slugify(path.basename(options.input, path.extname(options.input)));
  if (!slug) {
    throw new Error("Could not derive a slug from the filename; pass --slug.");
  }

  const outDir = path.resolve(options.out ?? path.join(ROOT, "hls-out"), slug);
  await fs.mkdir(outDir, { recursive: true });

  const { height, hasAudio } = await probe(options.input);
  const rungs = selectLadder(height);
  console.log(
    `${slug}: source is ${height}p, encoding ${rungs.map((r) => r.name).join(", ")}` +
      `${hasAudio ? "" : " (no audio track)"}`,
  );

  await run("ffmpeg", buildFfmpegArgs({ input: options.input, outDir, rungs, hasAudio }));

  // One token per object, decided here so the playlists can carry final URLs.
  const files = (await fs.readdir(outDir)).filter((name) => name !== "upload.sh").sort();
  const tokens = new Map(files.map((name) => [name, crypto.randomUUID()]));
  const objectPath = (name) => `streams/${slug}/${name}`;
  const urlFor = (name) =>
    tokens.has(name) ? firebaseUrl(options.bucket, objectPath(name), tokens.get(name)) : null;

  for (const name of files.filter((file) => file.endsWith(".m3u8"))) {
    const full = path.join(outDir, name);
    const rewritten = rewritePlaylist(await fs.readFile(full, "utf8"), urlFor);
    await fs.writeFile(full, rewritten, "utf8");
  }

  const uploads = files
    .map((name) =>
      uploadCommand({
        bucket: options.bucket,
        objectPath: objectPath(name),
        localFile: path.join(outDir, name),
        token: tokens.get(name),
      }),
    )
    .join("\n\n");

  const uploadScript = `#!/usr/bin/env bash
# Generated by scripts/transcode-hls.mjs for "${slug}".
# Review, then run. Needs gcloud authenticated against the bucket's project.
set -euo pipefail

${uploads}

echo "Uploaded. Add this to the video's entry in src/data/projects.json:"
echo '  "streamUrl": "${urlFor("master.m3u8")}"'
`;

  const scriptPath = path.join(outDir, "upload.sh");
  await fs.writeFile(scriptPath, uploadScript, { mode: 0o755 });

  console.log(`\nWrote ${files.length} files to ${outDir}`);
  console.log(`Next: review and run ${scriptPath}, then set in projects.json:`);
  console.log(`  "streamUrl": "${urlFor("master.m3u8")}"`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`transcode-hls failed: ${error.message}`);
    process.exit(1);
  });
}
