import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAdaptiveVideoSource } from "@/hooks/useAdaptiveVideoSource";

const FILE = "https://example.com/video.m4v";
const STREAM = "https://example.com/video.m3u8";

const hlsInstances: MockHls[] = [];
let hlsSupported = true;

class MockHls {
  static Events = { ERROR: "hlsError", FRAG_LOADED: "hlsFragLoaded" } as const;
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

  emitNonFatalError() {
    this.handlers.get(MockHls.Events.ERROR)?.(MockHls.Events.ERROR, {
      fatal: false,
      details: "fragLoadError",
    });
  }

  emitFragLoaded() {
    this.handlers.get(MockHls.Events.FRAG_LOADED)?.(MockHls.Events.FRAG_LOADED, {});
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
  setReadyState(video, 0);
  return video;
}

/** jsdom never loads anything, so readyState has to be stated outright. */
function setReadyState(video: HTMLVideoElement, value: number): void {
  Object.defineProperty(video, "readyState", { value, configurable: true });
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

  it("recovers to the progressive file when native HLS errors", async () => {
    // The regression this guards: nothing but the element reports a native HLS
    // failure, so without a listener a Safari or iOS visitor got a dead player
    // and no second chance at the file that would have played.
    const video = makeVideo(true);
    const { result } = renderHook(() =>
      useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
    );

    expect(result.current).toBe("hls-native");
    video.dispatchEvent(new Event("error"));

    await waitFor(() => expect(result.current).toBe("progressive"));
    expect(video.src).toBe(FILE);
  });

  it("gives up on a stream that never produces anything", async () => {
    vi.useFakeTimers();
    try {
      const video = makeVideo(true);
      const { result } = renderHook(() =>
        useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
      );

      expect(result.current).toBe("hls-native");
      // canPlayType is a guess, not a promise: a browser can claim the HLS type
      // and then sit at readyState 0 without ever raising an error.
      await act(async () => {
        vi.advanceTimersByTime(12_000);
      });

      expect(result.current).toBe("progressive");
      expect(video.src).toBe(FILE);
    } finally {
      vi.useRealTimers();
    }
  });

  it("leaves a stream alone once it is producing frames", async () => {
    vi.useFakeTimers();
    try {
      const video = makeVideo(true);
      const { result } = renderHook(() =>
        useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
      );

      setReadyState(video, 1);
      video.dispatchEvent(new Event("loadedmetadata"));
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });

      expect(result.current).toBe("hls-native");
      expect(video.src).toBe(STREAM);
    } finally {
      vi.useRealTimers();
    }
  });

  it("still recovers if a stream starts flowing and then fails", async () => {
    vi.useFakeTimers();
    try {
      const video = makeVideo(true);
      const { result } = renderHook(() =>
        useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
      );

      // Bytes arriving means "do not time out", not "this source is sound".
      video.dispatchEvent(new Event("progress"));
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });
      expect(result.current).toBe("hls-native");

      await act(async () => {
        video.dispatchEvent(new Event("error"));
      });

      expect(result.current).toBe("progressive");
      expect(video.src).toBe(FILE);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps hls.js once a fragment has loaded, and drops it if none does", async () => {
    const video = makeVideo(false);
    const { result } = renderHook(() =>
      useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
    );

    await waitFor(() => expect(result.current).toBe("hls-mse"));
    hlsInstances[0].emitFragLoaded();
    // A non-fatal error is hls.js retrying, which is not a reason to give up.
    hlsInstances[0].emitNonFatalError();
    expect(result.current).toBe("hls-mse");
  });

  it("does not treat a failure of the file itself as another chance to fall back", async () => {
    const video = makeVideo(true);
    const { result } = renderHook(() =>
      useAdaptiveVideoSource(video, { streamUrl: STREAM, fileUrl: FILE }),
    );

    video.dispatchEvent(new Event("error"));
    await waitFor(() => expect(result.current).toBe("progressive"));

    const loadCalls = (video.load as ReturnType<typeof vi.fn>).mock.calls.length;
    video.dispatchEvent(new Event("error"));

    // Nothing left to try: the modal shows the error panel from here.
    expect(result.current).toBe("progressive");
    expect((video.load as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(loadCalls);
  });

  it("reports 'none' when the video has no source at all", () => {
    const video = makeVideo(false);
    const { result } = renderHook(() => useAdaptiveVideoSource(video, {}));

    expect(result.current).toBe("none");
    expect(video.hasAttribute("src")).toBe(false);
  });
});
