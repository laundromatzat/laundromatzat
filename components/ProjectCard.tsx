import React, { useId } from 'react';
import clsx from 'clsx';
import { Project } from '../types';

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
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article className="group relative h-full">
      <button
        type="button"
        onClick={handleClick}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={clsx(
          'flex h-full w-full flex-col overflow-hidden rounded-radius-lg bg-brand-secondary text-left shadow-layer-1 transition duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary',
          'hover:-translate-y-1 hover:shadow-lg',
        )}
      >
        <div className="relative w-full overflow-hidden bg-brand-primary/50">
          <div className="aspect-[4/3] w-full">
            <picture>
              <img
                src={project.imageUrl}
                alt={project.title}
                loading="lazy"
                decoding="async"
                width={1280}
                height={960}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
              />
            </picture>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 px-6 py-5">
          <h3 id={titleId} className="text-lg font-semibold text-brand-text">
            {project.title}
          </h3>
          <p id={descriptionId} className="text-sm text-brand-text-secondary">
            {project.description}
          </p>
        </div>
      </button>
    </article>
  );
}

export default ProjectCard;
