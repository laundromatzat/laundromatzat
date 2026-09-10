import React, { useId, useState } from "react";
import { Project } from "@/types";
import { AuraCard } from "./aura";

interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
}

function ProjectCard({ project, onSelect }: ProjectCardProps): React.ReactNode {
  const titleId = useId();
  const descriptionId = useId();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  // A video can be added without a thumbnail, and a token can be revoked after
  // the fact, so the card has to render sensibly with no usable poster image.
  const showPlaceholder = !project.imageUrl || thumbnailFailed;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
      return;
    }

    const targetUrl = project.projectUrl || project.imageUrl;
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article className="group relative h-full">
      <AuraCard
        variant="interactive"
        padding="none"
        onClick={handleClick}
        className="h-full flex flex-col overflow-hidden"
      >
        <div className="relative w-full overflow-hidden bg-aura-accent-light">
          <div className="aspect-[4/3] w-full relative">
            {showPlaceholder ? (
              <div
                data-testid="thumbnail-placeholder"
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-aura-accent-light"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-10 w-10 text-aura-text-secondary/50"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor" />
                </svg>
              </div>
            ) : (
              <img
                src={project.imageUrl}
                alt={project.title}
                loading="lazy"
                decoding="async"
                width={1280}
                height={960}
                onError={() => setThumbnailFailed(true)}
                className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3
            id={titleId}
            className="text-base font-semibold text-aura-text-primary"
          >
            {project.title}
          </h3>
          <p id={descriptionId} className="text-sm text-aura-text-secondary">
            {project.description}
          </p>
        </div>
      </AuraCard>
    </article>
  );
}

export default ProjectCard;
