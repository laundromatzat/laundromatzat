import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRememberedVolume } from "@/hooks/useRememberedVolume";

const KEY = "laundromatzat:volume";

function makeVideo(): HTMLVideoElement {
  return document.createElement("video");
}

describe("useRememberedVolume", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("applies a stored level to a newly mounted video", () => {
    localStorage.setItem(KEY, JSON.stringify({ volume: 0.3, muted: true }));
    const video = makeVideo();

    renderHook(() => useRememberedVolume(video));

    expect(video.volume).toBeCloseTo(0.3);
    expect(video.muted).toBe(true);
  });

  it("records a change so the next video starts the same way", () => {
    const video = makeVideo();
    renderHook(() => useRememberedVolume(video));

    video.volume = 0.5;
    video.dispatchEvent(new Event("volumechange"));

    expect(JSON.parse(localStorage.getItem(KEY) ?? "{}")).toMatchObject({ volume: 0.5 });
  });

  it("ignores a stored value that is not a usable level", () => {
    localStorage.setItem(KEY, JSON.stringify({ volume: "loud" }));
    const video = makeVideo();
    video.volume = 1;

    renderHook(() => useRememberedVolume(video));

    expect(video.volume).toBe(1);
  });

  it("survives storage being unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const video = makeVideo();
    expect(() => {
      renderHook(() => useRememberedVolume(video));
      video.dispatchEvent(new Event("volumechange"));
    }).not.toThrow();
  });
});
