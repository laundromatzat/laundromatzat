import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import PortfolioModal from './PortfolioModal';

interface ProjectGridProps {
  projects: Project[];
  gridClassName?: string;
  emptyState?: React.ReactNode;
}

function ProjectGrid({
  projects,
  gridClassName = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
  emptyState,
}: ProjectGridProps): React.ReactNode {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const announcementId = useId();
  const announcement = useMemo(() => {
    if (projects.length === 0) {
      return 'No projects to show right now.';
    }

    if (projects.length === 1) {
      return 'Showing one project.';
    }

    return `Showing ${projects.length} projects.`;
  }, [projects.length]);

  useEffect(() => {
    setActiveIndex(null);
  }, [projects]);

  const handleOpen = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex(prev => {
      if (prev === null || projects.length === 0) {
        return prev;
      }

      const previousIndex = (prev - 1 + projects.length) % projects.length;
      return previousIndex;
    });
  }, [projects.length]);

  const handleNext = useCallback(() => {
    setActiveIndex(prev => {
      if (prev === null || projects.length === 0) {
        return prev;
      }

      const nextIndex = (prev + 1) % projects.length;
      return nextIndex;
    });
  }, [projects.length]);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" id={announcementId} className="sr-only">
        {announcement}
      </div>

      {projects.length === 0 ? (
        emptyState || (
          <div className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-6 py-8 text-center text-brand-text-secondary">
            No projects match the selected filters yet.
          </div>
        )
      ) : (
        <ul
          className={clsx(gridClassName)}
          aria-describedby={announcementId}
          data-testid="project-grid"
        >
          {projects.map((project, index) => (
            <li key={project.id} className="h-full">
              <ProjectCard project={project} onSelect={() => handleOpen(index)} />
            </li>
          ))}
        </ul>
      )}

      {activeIndex !== null && projects.length > 0 ? (
        <PortfolioModal
          projects={projects}
          currentIndex={activeIndex}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      ) : null}
    </>
  );
}

export default ProjectGrid;
