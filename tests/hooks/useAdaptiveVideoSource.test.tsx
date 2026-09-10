import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAdaptiveVideoSource } from "@/hooks/useAdaptiveVideoSource";

const FILE = "https://example.com/video.m4v";
const STREAM = "https://example.com/video.m3u8";

const hlsInstances: MockHls[] = [];
let hlsSupported = true;

class MockHls {
  static Events = { ERROR: "hlsError" } as const;
  static isSupported = () => hlsSupported;

  loadSource = vi.fn();
  attachMedia = vi.fn();
  destroy = vi.fn();
  private handlers = new Map<string, (event: string, data: unknown) => void>();

  constructor() {
    hlsInstances.push(this);
  }

  on(event: string, handler: (event: string, data: unknown) => void) {
    this.handlers.set(event, handler);
  }

  emitFatalError() {
    this.handlers.get(MockHls.Events.ERROR)?.(MockHls.Events.ERROR, {
      fatal: true,
      details: "manifestLoadError",
    });
  }
}

vi.mock("hls.js/light", () => ({ default: MockHls }));

/** A <video> whose canPlayType we control, since jsdom always returns "". */
function makeVideo(nativeHls: boolean): HTMLVideoElement {
  const video = document.createElement("video");
  video.canPlayType = ((type: string) =>
    nativeHls && type === "application/vnd.apple.mpegurl"
      ? "maybe"
      : "") as HTMLVideoElement["canPlayType"];
  video.load = vi.fn();
  return video;
}

describe("useAdaptiveVideoSource", () => {
  beforeEach(() => {
    hlsInstances.length = 0;
    hlsSupported = true;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("uses the progressive file when there is no stream", () => {
    const video = makeVideo(false);
    const { result } = renderHook(() =>
      useAdaptiveVideoSource(video, { fileUrl: FILE }),
    );

    expect(result.current).toBe("progressive");
    expect(video.src).toBe(FILE);
    expect(hlsInstances).toHaveLength(0);
  });

  it("plays HLS natively where the browser supports it, without loading hls.js", () => {
    const video = makeVideo(true);
    const { result } = renderHook(() =>
      useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
    );

    expect(result.current).toBe("hls-native");
    expect(video.src).toBe(STREAM);
    expect(hlsInstances).toHaveLength(0);
  });

  it("falls back to hls.js where the browser has no native HLS", async () => {
    const video = makeVideo(false);
    const { result } = renderHook(() =>
      useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
    );

    await waitFor(() => expect(result.current).toBe("hls-mse"));
    expect(hlsInstances).toHaveLength(1);
    expect(hlsInstances[0].loadSource).toHaveBeenCalledWith(STREAM);
    expect(hlsInstances[0].attachMedia).toHaveBeenCalledWith(video);
  });

  it("recovers to the progressive file when HLS fails fatally", async () => {
    const video = makeVideo(false);
    const { result } = renderHook(() =>
      useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
    );

    await waitFor(() => expect(hlsInstances).toHaveLength(1));
    hlsInstances[0].emitFatalError();

    await waitFor(() => expect(result.current).toBe("progressive"));
    expect(video.src).toBe(FILE);
    expect(hlsInstances[0].destroy).toHaveBeenCalled();
  });

  it("uses the progressive file when MSE is unavailable", async () => {
    hlsSupported = false;
    const video = makeVideo(false);
    const { result } = renderHook(() =>
      useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
    );

    await waitFor(() => expect(result.current).toBe("progressive"));
    expect(video.src).toBe(FILE);
  });

  it("tears the hls.js instance down on unmount", async () => {
    const video = makeVideo(false);
    const { unmount } = renderHook(() =>
      useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
    );

    await waitFor(() => expect(hlsInstances).toHaveLength(1));
    unmount();
    expect(hlsInstances[0].destroy).toHaveBeenCalled();
  });

  it("reports 'none' when the video has no source at all", () => {
    const video = makeVideo(false);
    const { result } = renderHook(() => useAdaptiveVideoSource(video, {}));

    expect(result.current).toBe("none");
    expect(video.hasAttribute("src")).toBe(false);
  });
});
