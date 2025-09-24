import React, { useCallback, useEffect, useState } from 'react';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import PortfolioModal from './PortfolioModal';

interface ProjectGridProps {
  projects: Project[];
  gridClassName?: string;
}

function ProjectGrid({ projects, gridClassName = 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8' }: ProjectGridProps): React.ReactNode {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
      if (prev === null) {
        return prev;
      }

      if (projects.length === 0) {
        return null;
      }

      const previousIndex = (prev - 1 + projects.length) % projects.length;
      return previousIndex;
    });
  }, [projects.length]);

  const handleNext = useCallback(() => {
    setActiveIndex(prev => {
      if (prev === null) {
        return prev;
      }

      if (projects.length === 0) {
        return null;
      }

      const nextIndex = (prev + 1) % projects.length;
      return nextIndex;
    });
  }, [projects.length]);

  return (
    <>
      <div className={gridClassName}>
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} onSelect={() => handleOpen(index)} />
        ))}
      </div>
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
