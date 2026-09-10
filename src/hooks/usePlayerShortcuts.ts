import { useEffect, RefObject } from "react";

interface Options {
  video: HTMLVideoElement | null;
  /**
   * Element to put into fullscreen, so the overlays go with the picture.
   *
   * A ref rather than the element: it is only read when a key is actually
   * pressed, by which time the ref is populated, whereas passing
   * `stageRef.current` would capture null from the first render.
   */
  stage?: RefObject<HTMLElement | null>;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  enabled?: boolean;
}

const SEEK_SMALL = 5;
const SEEK_LARGE = 10;
const VOLUME_STEP = 0.1;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/** Space and Enter belong to whatever button the visitor has focused. */
function isActivatable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "BUTTON" || target.tagName === "A")
  );
}

function seekBy(video: HTMLVideoElement, seconds: number): void {
  const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
  video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), duration);
}

function toggleFullscreen(stage: HTMLElement | null, video: HTMLVideoElement): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen?.();
    return;
  }

  const target = stage ?? video;
  if (typeof target.requestFullscreen === "function") {
    void target.requestFullscreen().catch(() => {
      // Some browsers refuse fullscreen on a container but allow it on the
      // element itself; iOS Safari only ever allows the video.
      void video.requestFullscreen?.();
    });
    return;
  }

  // iOS Safari exposes only this non-standard entry point.
  (video as HTMLVideoElement & { webkitEnterFullscreen?: () => void })
    .webkitEnterFullscreen?.();
}

/**
 * The keyboard model people already know from every other video player.
 *
 * Space/K play, arrows seek, J/L jump ten seconds, M mutes, F is fullscreen,
 * digits jump to a percentage of the way through. Paging to the previous or
 * next video moves to Shift+arrow, because plain arrows seeking is the
 * stronger convention once a video is on screen.
 */
export function usePlayerShortcuts({
  video,
  stage,
  onClose,
  onPrev,
  onNext,
  enabled = true,
}: Options): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.shiftKey && event.key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
        return;
      }

      if (event.shiftKey && event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
        return;
      }

      if (!video) {
        return;
      }

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          if (event.key === " " && isActivatable(event.target)) {
            return;
          }
          event.preventDefault();
          if (video.paused) {
            void video.play().catch(() => undefined);
          } else {
            video.pause();
          }
          return;
        case "ArrowLeft":
          event.preventDefault();
          seekBy(video, -SEEK_SMALL);
          return;
        case "ArrowRight":
          event.preventDefault();
          seekBy(video, SEEK_SMALL);
          return;
        case "j":
        case "J":
          event.preventDefault();
          seekBy(video, -SEEK_LARGE);
          return;
        case "l":
        case "L":
          event.preventDefault();
          seekBy(video, SEEK_LARGE);
          return;
        case "ArrowUp":
          event.preventDefault();
          video.volume = Math.min(video.volume + VOLUME_STEP, 1);
          return;
        case "ArrowDown":
          event.preventDefault();
          video.volume = Math.max(video.volume - VOLUME_STEP, 0);
          return;
        case "m":
        case "M":
          event.preventDefault();
          video.muted = !video.muted;
          return;
        case "f":
        case "F":
          event.preventDefault();
          toggleFullscreen(stage?.current ?? null, video);
          return;
        default:
          break;
      }

      if (/^[0-9]$/.test(event.key) && Number.isFinite(video.duration)) {
        event.preventDefault();
        video.currentTime = (Number(event.key) / 10) * video.duration;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [video, stage, onClose, onPrev, onNext, enabled]);
}
