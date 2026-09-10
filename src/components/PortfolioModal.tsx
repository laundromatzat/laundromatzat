import React, { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Project } from "@/types";
import { useAdaptiveVideoSource } from "@/hooks/useAdaptiveVideoSource";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { usePlayerShortcuts } from "@/hooks/usePlayerShortcuts";
import { useRememberedVolume } from "@/hooks/useRememberedVolume";
import { useScrollLock } from "@/hooks/useScrollLock";
import { AuraButton } from "./aura";
import { CloseIcon } from "./icons/CloseIcon";
import { CopyIcon } from "./icons/CopyIcon";
import { CheckIcon } from "./icons/CheckIcon";
import { PlayIcon } from "./icons/PlayIcon";
import { ChevronIcon } from "./icons/ChevronIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";

interface PortfolioModalProps {
  projects: Project[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

type PlaybackState = "loading" | "ready" | "error";

/** Horizontal travel, in px, that counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 60;

function PortfolioModal({
  projects,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: PortfolioModalProps): React.ReactNode {
  const project = projects[currentIndex];

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // A callback ref, not useRef: the hooks below have to re-run when the element
  // is swapped out, and `key={project.id}` swaps it on every paging step.
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>("loading");
  const [needsTap, setNeedsTap] = useState(false);

  const attachVideo = useCallback((element: HTMLVideoElement | null) => {
    setVideoElement(element);
  }, []);

  useAdaptiveVideoSource(videoElement, {
    streamUrl: project?.streamUrl,
    fileUrl: project?.projectUrl,
  });

  useScrollLock(true);
  useFocusTrap(dialogRef, true);
  useRememberedVolume(videoElement);
  usePlayerShortcuts({
    video: videoElement,
    stage: stageRef,
    onClose,
    onPrev,
    onNext,
  });

  useEffect(() => {
    setIsCopied(false);
    setPlayback("loading");
    setNeedsTap(false);
  }, [project]);

  // An entry with neither a stream nor a file can never load, so say so rather
  // than leaving a black rectangle spinning forever. Checked from the data, not
  // from the hook's state, which reads "none" for a moment before the <video>
  // element has even been attached.
  useEffect(() => {
    if (videoElement && !project?.streamUrl && !project?.projectUrl) {
      setPlayback("error");
    }
  }, [videoElement, project]);

  useEffect(() => {
    const video = videoElement;
    if (!video) {
      return;
    }

    const startPlayback = () => {
      setPlayback("ready");
      // Browsers block autoplay with sound unless they already trust the site,
      // and a blocked play() rejects silently. Surfacing it as a play button is
      // better than a picture that never moves.
      void video
        .play()
        .then(() => setNeedsTap(false))
        .catch(() => setNeedsTap(true));
    };

    const markReady = () => setPlayback("ready");
    const markLoading = () => setPlayback("loading");
    const markError = () => setPlayback("error");

    video.addEventListener("loadeddata", startPlayback, { once: true });
    video.addEventListener("playing", markReady);
    video.addEventListener("canplay", markReady);
    video.addEventListener("waiting", markLoading);
    video.addEventListener("error", markError);

    return () => {
      video.removeEventListener("loadeddata", startPlayback);
      video.removeEventListener("playing", markReady);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("waiting", markLoading);
      video.removeEventListener("error", markError);
    };
  }, [videoElement, project]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  }, []);

  const handleTapToPlay = useCallback(() => {
    void videoElement?.play().then(() => setNeedsTap(false));
  }, [videoElement]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    const bounds = stageRef.current?.getBoundingClientRect();

    // The native controls live along the bottom of the stage. A drag that
    // starts there is someone scrubbing, not paging.
    if (bounds && touch.clientY > bounds.bottom - 64) {
      touchStart.current = null;
      return;
    }

    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) {
        return;
      }

      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }

      if (dx > 0) {
        onPrev();
      } else {
        onNext();
      }
    },
    [onPrev, onNext],
  );

  if (!project) {
    return null;
  }

  const headingId = `player-title-${project.id}`;
  const positionLabel = `${currentIndex + 1} of ${projects.length}`;

  const pagingButton = (direction: "left" | "right") =>
    clsx(
      "absolute top-1/2 -translate-y-1/2 z-10",
      "h-11 w-11 min-h-[2.75rem] rounded-full p-0",
      "bg-black/50 text-white border-transparent",
      "hover:bg-black/80 hover:scale-105",
      "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-0",
      // Visible by default so touch devices, which never hover, can still page;
      // faded back on pointers that can hover, and always shown on focus.
      "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
      "aura-transition",
      direction === "left" ? "left-2 sm:left-3" : "right-2 sm:right-3",
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-aura-text-primary/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className={clsx(
          "relative z-10 w-full max-w-5xl outline-none",
          "px-2 sm:px-4",
          "max-h-[100svh] overflow-y-auto overscroll-contain",
          "py-[max(0.5rem,env(safe-area-inset-top))]",
        )}
      >
        <div className="bg-aura-surface rounded-2xl shadow-aura-2xl overflow-hidden border border-aura-border">
          <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-aura-border bg-aura-surface-elevated">
            <div className="min-w-0">
              <h2
                id={headingId}
                className="text-lg sm:text-2xl font-semibold text-aura-text-primary truncate"
              >
                {project.title}
              </h2>
              <p className="text-xs sm:text-sm text-aura-text-secondary mt-0.5 sm:mt-1">
                {[project.date, project.location, positionLabel]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <AuraButton
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                className={isCopied ? "text-aura-success" : ""}
                aria-label={isCopied ? "Link copied" : "Copy link to this video"}
                icon={
                  isCopied ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <CopyIcon className="h-5 w-5" />
                  )
                }
              />
              <AuraButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close"
                icon={<CloseIcon className="h-6 w-6" />}
              />
            </div>
          </div>

          <div
            ref={stageRef}
            // A minimum height, because a <video> whose media and poster have
            // both failed collapses to nothing -- taking the error panel, which
            // is positioned against this box, down with it.
            className="relative bg-black group min-h-[200px] sm:min-h-[280px] flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <video
              key={project.id}
              ref={attachVideo}
              className="w-full bg-black object-contain max-h-[65svh] landscape:max-h-[80svh]"
              controls
              playsInline
              preload="metadata"
              poster={project.imageUrl}
            >
              Your browser does not support the video tag.
            </video>

            {playback === "loading" ? (
              <div
                data-testid="player-loading"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <SpinnerIcon className="h-10 w-10 animate-spin text-white/80" />
                <span className="sr-only">Loading video</span>
              </div>
            ) : null}

            {needsTap && playback !== "error" ? (
              <button
                type="button"
                data-testid="player-tap-to-play"
                onClick={handleTapToPlay}
                aria-label={`Play ${project.title}`}
                className={clsx(
                  "absolute inset-0 flex items-center justify-center",
                  "bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white",
                )}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-aura-text-primary shadow-aura-lg">
                  <PlayIcon className="ml-1 h-7 w-7" />
                </span>
              </button>
            ) : null}

            {playback === "error" ? (
              <div
                data-testid="player-error"
                role="alert"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center text-white"
              >
                <p className="text-base font-semibold">This video would not load.</p>
                <p className="max-w-md text-sm text-white/70">
                  The file may have moved, or its link may have expired. Everything
                  else in the library should still play.
                </p>
                {project.projectUrl ? (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline underline-offset-4 hover:text-white"
                  >
                    Open the file directly
                  </a>
                ) : null}
              </div>
            ) : null}

            <AuraButton
              variant="ghost"
              onClick={onPrev}
              className={pagingButton("left")}
              aria-label="Previous video"
              icon={<ChevronIcon direction="left" className="h-6 w-6" />}
            />
            <AuraButton
              variant="ghost"
              onClick={onNext}
              className={pagingButton("right")}
              aria-label="Next video"
              icon={<ChevronIcon direction="right" className="h-6 w-6" />}
            />
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 text-aura-text-secondary text-sm sm:text-base pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p>{project.description}</p>
            {project.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-aura-text-tertiary">
                {project.tags.map((tag) => (
                  <span key={tag} className="bg-aura-accent-light px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-3 hidden text-xs text-aura-text-tertiary md:block">
              Space play · ← → seek · J L jump 10s · M mute · F fullscreen ·
              Shift + ← → change video · Esc close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioModal;
