import React, { useEffect, useMemo, useRef } from 'react';
import { Project, ProjectType } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface PortfolioModalProps {
  projects: Project[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function PortfolioModal({ projects, currentIndex, onClose, onPrev, onNext }: PortfolioModalProps): React.ReactNode {
  const project = projects[currentIndex];
  const mediaContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const mediaSrc = useMemo(() => project?.projectUrl || project?.imageUrl, [project]);
  const isVideo = project?.type === ProjectType.Video || project?.type === ProjectType.Cinemagraph;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'ArrowLeft') {
        onPrev();
      }

      if (event.key === 'ArrowRight') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    videoRef.current?.load();
  }, [project]);

  if (!project) {
    return null;
  }

  const handleFullscreen = () => {
    const container = mediaContainerRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    }) | null;

    const requestFullscreen = container?.requestFullscreen
      || container?.webkitRequestFullscreen
      || container?.mozRequestFullScreen
      || container?.msRequestFullscreen;

    if (requestFullscreen) {
      requestFullscreen.call(container);
      return;
    }

    if (mediaSrc) {
      window.open(mediaSrc, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-5xl px-4">
        <div className="bg-brand-secondary rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-start justify-between px-6 py-4 border-b border-brand-accent/20">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-brand-text">{project.title}</h2>
              <p className="text-sm text-brand-text-secondary mt-1">
                {[project.date, project.location].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 rounded-full p-1"
              aria-label="Close"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>

          <div ref={mediaContainerRef} className="relative bg-black">
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

            <button
              type="button"
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60"
              aria-label="Previous project"
            >
              <span className="text-2xl leading-none">&#8249;</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60"
              aria-label="Next project"
            >
              <span className="text-2xl leading-none">&#8250;</span>
            </button>

            <button
              type="button"
              onClick={handleFullscreen}
              className="absolute bottom-4 right-4 bg-brand-accent text-white px-4 py-2 rounded-full shadow hover:bg-brand-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60"
            >
              view fullscreen
            </button>
          </div>

          <div className="px-6 py-4 text-brand-text-secondary text-sm sm:text-base">
            <p>{project.description}</p>
            {project.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-brand-text-secondary/80">
                {project.tags.map(tag => (
                  <span key={tag} className="bg-brand-primary/20 px-3 py-1 rounded-full">
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
