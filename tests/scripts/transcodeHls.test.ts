import { describe, expect, it } from "vitest";
import { getProjectSlug } from "@/utils/slugs";
import { VIDEOS } from "@/constants";
import {
  CACHE_CONTROL,
  LADDER,
  buildFfmpegArgs,
  contentTypeFor,
  firebaseUrl,
  rewritePlaylist,
  selectLadder,
  slugify,
  uploadCommand,
} from "../../scripts/transcode-hls.mjs";

const BUCKET = "laundromat-zat.firebasestorage.app";

describe("selectLadder", () => {
  it("never upscales past the source", () => {
    expect(selectLadder(540).map((r) => r.name)).toEqual(["480p", "360p"]);
    expect(selectLadder(720).map((r) => r.name)).toEqual(["720p", "480p", "360p"]);
    expect(selectLadder(1080).map((r) => r.name)).toEqual([
      "1080p",
      "720p",
      "480p",
      "360p",
    ]);
  });

  it("still produces one rung for a source smaller than the whole ladder", () => {
    expect(selectLadder(240)).toEqual([LADDER[LADDER.length - 1]]);
  });

  it("orders rungs highest first, as a master playlist expects", () => {
    const heights = selectLadder(1080).map((r) => r.height);
    expect([...heights].sort((a, b) => b - a)).toEqual(heights);
  });
});

describe("firebaseUrl", () => {
  it("percent-encodes the object path the way the download API requires", () => {
    expect(firebaseUrl(BUCKET, "streams/drift-away/master.m3u8", "tok")).toBe(
      `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/` +
        "streams%2Fdrift-away%2Fmaster.m3u8?alt=media&token=tok",
    );
  });

  it("matches the URL shape already in projects.json", () => {
    const existing = VIDEOS.find((video) => video.projectUrl)?.projectUrl ?? "";
    const [prefix] = existing.split("/o/");
    expect(firebaseUrl(BUCKET, "streams/x/master.m3u8", "tok").startsWith(prefix)).toBe(
      true,
    );
  });
});

describe("rewritePlaylist", () => {
  const resolve = (uri: string) =>
    uri.endsWith(".m3u8") || uri.endsWith(".m4s") ? `https://cdn/${uri}?token=t` : null;

  it("rewrites bare segment URIs", () => {
    const out = rewritePlaylist("#EXTINF:6.0,\n360p.m4s\n", resolve);
    expect(out).toContain("https://cdn/360p.m4s?token=t");
  });

  it("rewrites the quoted URI inside EXT-X-MAP without touching its byte range", () => {
    const out = rewritePlaylist(
      '#EXT-X-MAP:URI="360p.m4s",BYTERANGE="1368@0"\n',
      resolve,
    );
    expect(out).toBe('#EXT-X-MAP:URI="https://cdn/360p.m4s?token=t",BYTERANGE="1368@0"\n');
  });

  it("leaves other tags and blank lines alone", () => {
    const input = "#EXTM3U\n#EXT-X-VERSION:7\n\n#EXT-X-BYTERANGE:455357@1368\n";
    expect(rewritePlaylist(input, resolve)).toBe(input);
  });

  it("leaves a URI it cannot resolve untouched rather than emitting a broken one", () => {
    expect(rewritePlaylist("unknown.ts\n", resolve)).toBe("unknown.ts\n");
    expect(rewritePlaylist('#EXT-X-MAP:URI="unknown.ts"\n', resolve)).toBe(
      '#EXT-X-MAP:URI="unknown.ts"\n',
    );
  });
});

describe("uploadCommand", () => {
  const command = uploadCommand({
    bucket: BUCKET,
    objectPath: "streams/drift-away/master.m3u8",
    localFile: "/tmp/hls/drift-away/master.m3u8",
    token: "abc-123",
  });

  it("sets the download token so the generated URLs actually resolve", () => {
    expect(command).toContain("firebaseStorageDownloadTokens=abc-123");
  });

  it("sets a long immutable cache lifetime", () => {
    expect(command).toContain(CACHE_CONTROL);
    expect(CACHE_CONTROL).toMatch(/public/);
    expect(CACHE_CONTROL).toMatch(/immutable/);
  });

  it("labels playlists and media with the right content type", () => {
    expect(command).toContain("application/vnd.apple.mpegurl");
    expect(contentTypeFor("360p.m4s")).toBe("video/mp4");
  });

  it("quotes every path, so a slug or directory with a space cannot split the command", () => {
    const risky = uploadCommand({
      bucket: BUCKET,
      objectPath: "streams/x/master.m3u8",
      localFile: "/tmp/my videos/master.m3u8",
      token: "t",
    });
    expect(risky).toContain('"/tmp/my videos/master.m3u8"');
  });
});

describe("buildFfmpegArgs", () => {
  const rungs = selectLadder(1080);
  const args = buildFfmpegArgs({
    input: "/tmp/in.mov",
    outDir: "/tmp/out",
    rungs,
    hasAudio: true,
  });

  it("maps one video and one audio stream per rung", () => {
    expect(args.filter((a) => a === "-map")).toHaveLength(rungs.length * 2);
    expect(args.join(" ")).toContain(
      "v:0,a:0,name:1080p v:1,a:1,name:720p v:2,a:2,name:480p v:3,a:3,name:360p",
    );
  });

  it("omits audio mapping entirely for a silent source", () => {
    const silent = buildFfmpegArgs({
      input: "/tmp/in.mov",
      outDir: "/tmp/out",
      rungs,
      hasAudio: false,
    });
    expect(silent).not.toContain("a:0");
    expect(silent.join(" ")).toContain("v:0,name:1080p");
  });

  it("emits single-file fMP4 so each rung is one object in the bucket", () => {
    expect(args).toContain("fmp4");
    expect(args).toContain("single_file");
  });

  it("pins a fixed GOP so rungs stay switchable", () => {
    expect(args).toContain("-sc_threshold");
    expect(args[args.indexOf("-g") + 1]).toBe("48");
  });
});

describe("slugify", () => {
  it("agrees with the app, so stream paths line up with video slugs", () => {
    for (const video of VIDEOS) {
      expect(slugify(video.title)).toBe(getProjectSlug(video));
    }
  });
});
