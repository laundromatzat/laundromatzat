import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PortfolioModal from "@/components/PortfolioModal";
import { makeVideo, renderWithProviders } from "../utils/testUtils";

const projects = [
  makeVideo({ id: "1", title: "First Video" }),
  makeVideo({ id: "2", title: "Second Video" }),
  makeVideo({ id: "3", title: "Third Video" }),
];

/** jsdom implements no media pipeline, so the element needs stubbing. */
function stubMediaElement(overrides: { playRejects?: boolean } = {}) {
  const play = vi.fn(() =>
    overrides.playRejects ? Promise.reject(new Error("blocked")) : Promise.resolve(),
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  return play;
}

function renderPlayer(overrides: Partial<React.ComponentProps<typeof PortfolioModal>> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
  };
  const result = renderWithProviders(
    <PortfolioModal projects={projects} currentIndex={1} {...handlers} {...overrides} />,
  );
  return { ...handlers, ...result };
}

function video(): HTMLVideoElement {
  const element = document.querySelector("video");
  if (!element) throw new Error("no video element rendered");
  return element as HTMLVideoElement;
}

describe("PortfolioModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    stubMediaElement();
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      configurable: true,
      get: () => 100,
    });
  });

  describe("dialog semantics", () => {
    it("is a labelled modal dialog", () => {
      renderPlayer();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAccessibleName("Second Video");
    });

    it("moves focus into the dialog on open", async () => {
      renderPlayer();
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("dialog")));
    });

    it("returns focus to whatever opened it", async () => {
      const opener = document.createElement("button");
      document.body.appendChild(opener);
      opener.focus();

      const { unmount } = renderPlayer();
      await waitFor(() => expect(document.activeElement).not.toBe(opener));

      unmount();
      await waitFor(() => expect(document.activeElement).toBe(opener));
      opener.remove();
    });

    it("keeps Tab inside the dialog", async () => {
      const user = userEvent.setup();
      renderPlayer();

      const buttons = screen.getAllByRole("button");
      buttons[buttons.length - 1].focus();
      await user.tab();

      expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    });

    it("announces which video of how many is showing", () => {
      renderPlayer();
      expect(screen.getByText(/2 of 3/)).toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("seeks with the arrow keys instead of paging", async () => {
      const { onNext, onPrev } = renderPlayer();
      video().currentTime = 50;

      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(video().currentTime).toBe(55);

      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(video().currentTime).toBe(50);

      expect(onNext).not.toHaveBeenCalled();
      expect(onPrev).not.toHaveBeenCalled();
    });

    it("pages videos with shift and the arrow keys", () => {
      const { onNext, onPrev } = renderPlayer();

      fireEvent.keyDown(window, { key: "ArrowRight", shiftKey: true });
      expect(onNext).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: "ArrowLeft", shiftKey: true });
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it("jumps ten seconds with J and L", () => {
      renderPlayer();
      video().currentTime = 50;

      fireEvent.keyDown(window, { key: "l" });
      expect(video().currentTime).toBe(60);

      fireEvent.keyDown(window, { key: "j" });
      expect(video().currentTime).toBe(50);
    });

    it("clamps seeking to the bounds of the video", () => {
      renderPlayer();

      video().currentTime = 2;
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(video().currentTime).toBe(0);

      video().currentTime = 98;
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(video().currentTime).toBe(100);
    });

    it("jumps to a percentage with the number keys", () => {
      renderPlayer();
      fireEvent.keyDown(window, { key: "3" });
      expect(video().currentTime).toBe(30);
    });

    it("toggles mute with M", () => {
      renderPlayer();
      expect(video().muted).toBe(false);
      fireEvent.keyDown(window, { key: "m" });
      expect(video().muted).toBe(true);
    });

    it("closes on Escape", () => {
      const { onClose } = renderPlayer();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("leaves shortcuts alone while someone is typing", () => {
      const { onClose } = renderPlayer();
      const input = document.createElement("input");
      document.body.appendChild(input);

      fireEvent.keyDown(input, { key: "Escape" });
      fireEvent.keyDown(input, { key: "ArrowRight" });

      expect(onClose).not.toHaveBeenCalled();
      input.remove();
    });

    it("lets Space activate a focused button rather than toggling playback", () => {
      renderPlayer();
      const close = screen.getByRole("button", { name: "Close" });
      close.focus();

      const playCalls = (HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>).mock
        .calls.length;
      fireEvent.keyDown(close, { key: " " });

      expect(
        (HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBe(playCalls);
    });
  });

  describe("playback states", () => {
    it("shows a spinner until the video has data", () => {
      renderPlayer();
      expect(screen.getByTestId("player-loading")).toBeInTheDocument();
    });

    it("clears the spinner once playback starts", async () => {
      renderPlayer();
      fireEvent(video(), new Event("playing"));
      await waitFor(() =>
        expect(screen.queryByTestId("player-loading")).not.toBeInTheDocument(),
      );
    });

    it("explains itself when the video fails to load", async () => {
      renderPlayer();
      fireEvent(video(), new Event("error"));

      const alert = await screen.findByTestId("player-error");
      expect(alert).toHaveTextContent(/would not load/i);
      expect(screen.getByRole("link", { name: /open the file directly/i })).toHaveAttribute(
        "href",
        projects[1].projectUrl,
      );
    });

    it("offers a play button when the browser blocks autoplay", async () => {
      vi.restoreAllMocks();
      stubMediaElement({ playRejects: true });

      renderPlayer();
      fireEvent(video(), new Event("loadeddata"));

      expect(await screen.findByTestId("player-tap-to-play")).toBeInTheDocument();
    });

    it("does not offer a play button when autoplay works", async () => {
      renderPlayer();
      fireEvent(video(), new Event("loadeddata"));

      await waitFor(() => expect(HTMLMediaElement.prototype.play).toHaveBeenCalled());
      expect(screen.queryByTestId("player-tap-to-play")).not.toBeInTheDocument();
    });
  });

  describe("touch", () => {
    function swipe(from: number, to: number, y = 100) {
      const stage = video().parentElement as HTMLElement;
      vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 400,
        left: 0,
        right: 800,
        width: 800,
        height: 400,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      fireEvent.touchStart(stage, { changedTouches: [{ clientX: from, clientY: y }] });
      fireEvent.touchEnd(stage, { changedTouches: [{ clientX: to, clientY: y }] });
    }

    it("pages forward on a swipe left", () => {
      const { onNext } = renderPlayer();
      swipe(300, 100);
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("pages back on a swipe right", () => {
      const { onPrev } = renderPlayer();
      swipe(100, 300);
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it("ignores a tap", () => {
      const { onNext, onPrev } = renderPlayer();
      swipe(200, 210);
      expect(onNext).not.toHaveBeenCalled();
      expect(onPrev).not.toHaveBeenCalled();
    });

    it("ignores a drag that starts on the native controls", () => {
      const { onNext } = renderPlayer();
      // Within 64px of the stage's bottom edge, where the scrubber sits.
      swipe(300, 100, 380);
      expect(onNext).not.toHaveBeenCalled();
    });
  });

  describe("paging controls", () => {
    it("keeps the previous and next buttons reachable, not hover-only", () => {
      renderPlayer();
      const next = screen.getByRole("button", { name: "Next video" });
      // Hidden-on-hover would be opacity-0 at every width; this stays visible
      // below md, which is where touch devices that cannot hover live.
      expect(next.className).toContain("opacity-100");
    });

    it("pages when clicked", async () => {
      const user = userEvent.setup();
      const { onNext, onPrev } = renderPlayer();

      await user.click(screen.getByRole("button", { name: "Next video" }));
      await user.click(screen.getByRole("button", { name: "Previous video" }));

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(onPrev).toHaveBeenCalledTimes(1);
    });
  });
});
