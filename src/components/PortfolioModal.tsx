import React, { useEffect, useMemo, useRef, useState } from "react";
import { Project, ProjectType } from "@/types";
import { AuraButton } from "./aura";
import { CloseIcon } from "./icons/CloseIcon";
import { CopyIcon } from "./icons/CopyIcon";
import { CheckIcon } from "./icons/CheckIcon";

interface PortfolioModalProps {
  projects: Project[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function PortfolioModal({
  projects,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: PortfolioModalProps): React.ReactNode {
  const project = projects[currentIndex];
  const mediaContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const mediaSrc = useMemo(
    () => project?.projectUrl || project?.imageUrl,
    [project]
  );
  const isVideo =
    project?.type === ProjectType.Video ||
    project?.type === ProjectType.Cinemagraph;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        onPrev();
      }

      if (event.key === "ArrowRight") {
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    videoRef.current?.load();
    setIsCopied(false);
  }, [project]);

  if (!project) {
    return null;
  }

  const handleFullscreen = () => {
    const container = mediaContainerRef.current as
      | (HTMLDivElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        })
      | null;

    const requestFullscreen =
      container?.requestFullscreen ||
      container?.webkitRequestFullscreen ||
      container?.mozRequestFullScreen ||
      container?.msRequestFullscreen;

    if (requestFullscreen) {
      requestFullscreen.call(container);
      return;
    }

    if (mediaSrc) {
      window.open(mediaSrc, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-aura-text-primary/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-5xl px-4">
        <div className="bg-aura-surface rounded-2xl shadow-aura-2xl overflow-hidden border border-aura-border">
          <div className="flex items-start justify-between px-6 py-4 border-b border-aura-border bg-aura-surface-elevated">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-aura-text-primary">
                {project.title}
              </h2>
              <p className="text-sm text-aura-text-secondary mt-1">
                {[project.date, project.location].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AuraButton
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                className={isCopied ? "text-aura-success" : ""}
                aria-label="Copy link to project"
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

          <div ref={mediaContainerRef} className="relative bg-black group">
            {isVideo ? (
              <video
                key={project.id}
                ref={videoRef}
                className="w-full max-h-[70vh] object-contain bg-black"
                controls
                autoPlay
                poster={project.imageUrl}
              >
                {mediaSrc && <source src={mediaSrc} />}
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                key={project.id}
                src={mediaSrc}
                alt={project.title}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
            )}

            <AuraButton
              variant="ghost"
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100"
              aria-label="Previous project"
            >
              <span className="text-2xl leading-none">&#8249;</span>
            </AuraButton>
            <AuraButton
              variant="ghost"
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100"
              aria-label="Next project"
            >
              <span className="text-2xl leading-none">&#8250;</span>
            </AuraButton>

            {!isVideo && (
              <AuraButton
                variant="ghost"
                onClick={handleFullscreen}
                className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white shadow-lg border border-white/20 hover:bg-black/80 opacity-0 group-hover:opacity-100"
              >
                view fullscreen
              </AuraButton>
            )}
          </div>

          <div className="px-6 py-4 text-aura-text-secondary text-sm sm:text-base">
            <p>{project.description}</p>
            {project.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-aura-text-tertiary">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-aura-accent-light px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioModal;
