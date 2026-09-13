import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import PortfolioModal from "@/components/PortfolioModal";
import { makeVideo, renderWithProviders } from "../utils/testUtils";

/**
 * What the player does while it still has a source left to try.
 *
 * Kept apart from the rest of the modal's tests because it needs hls.js to
 * report itself supported, which changes which path every other test would take.
 */
const hlsInstances: MockHls[] = [];

class MockHls {
  static Events = { ERROR: "hlsError", FRAG_LOADED: "hlsFragLoaded" } as const;
  static isSupported = () => true;

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

const projects = [
  makeVideo({
    id: "1",
    title: "Only Video",
    streamUrl: "https://example.com/master.m3u8",
  }),
];

function renderPlayer() {
  return renderWithProviders(
    <PortfolioModal
      projects={projects}
      currentIndex={0}
      onClose={vi.fn()}
      onPrev={vi.fn()}
      onNext={vi.fn()}
    />,
  );
}

function video(): HTMLVideoElement {
  const element = document.querySelector("video");
  if (!element) throw new Error("no video element rendered");
  return element as HTMLVideoElement;
}

describe("PortfolioModal while a fallback is still available", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    hlsInstances.length = 0;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  });

  it("says which source is in play, so a report of a dead video is diagnosable", async () => {
    renderPlayer();
    await waitFor(() => expect(video()).toHaveAttribute("data-video-source", "hls-mse"));
  });

  it("keeps quiet about an error the stream is about to recover from", async () => {
    renderPlayer();
    await waitFor(() => expect(hlsInstances).toHaveLength(1));

    // hls.js detaching its MediaSource is itself reported as an element error.
    // Reading that as final would put a failure panel over a video that is
    // about to play from the file instead.
    fireEvent(video(), new Event("error"));

    expect(screen.queryByTestId("player-error")).not.toBeInTheDocument();
    expect(screen.getByTestId("player-loading")).toBeInTheDocument();
  });

  it("reports a failure once the file is the source that failed", async () => {
    renderPlayer();
    await waitFor(() => expect(hlsInstances).toHaveLength(1));

    hlsInstances[0].emitFatalError();
    await waitFor(() =>
      expect(video()).toHaveAttribute("data-video-source", "progressive"),
    );

    fireEvent(video(), new Event("error"));

    expect(await screen.findByTestId("player-error")).toHaveTextContent(/would not load/i);
  });

  it("clears an error the abandoned source left behind", async () => {
    renderPlayer();
    await waitFor(() => expect(hlsInstances).toHaveLength(1));

    hlsInstances[0].emitFatalError();
    await waitFor(() =>
      expect(video()).toHaveAttribute("data-video-source", "progressive"),
    );
    fireEvent(video(), new Event("error"));
    expect(await screen.findByTestId("player-error")).toBeInTheDocument();

    // The file then plays after all -- a slow first byte, not a dead link.
    fireEvent(video(), new Event("canplay"));

    await waitFor(() =>
      expect(screen.queryByTestId("player-error")).not.toBeInTheDocument(),
    );
  });
});
