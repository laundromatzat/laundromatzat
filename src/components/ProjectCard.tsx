import React, { useId } from "react";
import { Project } from "@/types";
import { AuraCard } from "./aura";

interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
}

function ProjectCard({ project, onSelect }: ProjectCardProps): React.ReactNode {
  const titleId = useId();
  const descriptionId = useId();

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
            <img
              src={project.imageUrl}
              alt={project.title}
              loading="lazy"
              decoding="async"
              width={1280}
              height={960}
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
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
