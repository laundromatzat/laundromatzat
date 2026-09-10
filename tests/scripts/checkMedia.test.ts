import { describe, expect, it } from "vitest";
import { extractPlaylistUrls } from "../../scripts/check-media.mjs";
import { rewritePlaylist } from "../../scripts/transcode-hls.mjs";

const HOST = "https://firebasestorage.googleapis.com/v0/b/bucket/o";

describe("extractPlaylistUrls", () => {
  it("pulls variant URLs out of a master playlist", () => {
    const master = [
      "#EXTM3U",
      "#EXT-X-VERSION:7",
      '#EXT-X-STREAM-INF:BANDWIDTH=5640800,RESOLUTION=1920x1080,CODECS="avc1.4d4028"',
      `${HOST}/streams%2Fx%2F1080p.m3u8?alt=media&token=a`,
      "",
      '#EXT-X-STREAM-INF:BANDWIDTH=1020800,RESOLUTION=640x360,CODECS="avc1.4d401e"',
      `${HOST}/streams%2Fx%2F360p.m3u8?alt=media&token=b`,
    ].join("\n");

    expect(extractPlaylistUrls(master)).toEqual([
      `${HOST}/streams%2Fx%2F1080p.m3u8?alt=media&token=a`,
      `${HOST}/streams%2Fx%2F360p.m3u8?alt=media&token=b`,
    ]);
  });

  it("pulls the media URL out of EXT-X-MAP as well as the segment lines", () => {
    const variant = [
      "#EXTM3U",
      `#EXT-X-MAP:URI="${HOST}/streams%2Fx%2F360p.m4s?alt=media&token=c",BYTERANGE="1368@0"`,
      "#EXTINF:6.000000,",
      "#EXT-X-BYTERANGE:455357@1368",
      `${HOST}/streams%2Fx%2F360p.m4s?alt=media&token=c`,
    ].join("\n");

    // One URL, not two: a single-file rendition is the same object every time.
    expect(extractPlaylistUrls(variant)).toEqual([
      `${HOST}/streams%2Fx%2F360p.m4s?alt=media&token=c`,
    ]);
  });

  it("ignores tags, blank lines, and unresolved relative URIs", () => {
    const playlist = [
      "#EXTM3U",
      "#EXT-X-TARGETDURATION:6",
      "",
      "#EXT-X-PLAYLIST-TYPE:VOD",
      "360p.m4s",
    ].join("\n");

    expect(extractPlaylistUrls(playlist)).toEqual([]);
  });

  it("reads back exactly what transcode-hls writes", () => {
    // The two scripts are the write and read halves of the same format, so a
    // change to one that the other cannot follow is a silent gap in coverage.
    const written = rewritePlaylist(
      [
        "#EXTM3U",
        '#EXT-X-MAP:URI="360p.m4s",BYTERANGE="1368@0"',
        "#EXTINF:6.000000,",
        "360p.m4s",
      ].join("\n"),
      (uri: string) => `${HOST}/streams%2Fx%2F${uri}?alt=media&token=t`,
    );

    expect(extractPlaylistUrls(written)).toEqual([
      `${HOST}/streams%2Fx%2F360p.m4s?alt=media&token=t`,
    ]);
  });
});
