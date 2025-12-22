import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import clsx from "clsx";
import { Project } from "../types";
import { getProjectSlug } from "../utils/slugs";
import ProjectCard from "./ProjectCard";
import PortfolioModal from "./PortfolioModal";

interface ProjectGridProps {
  projects: Project[];
  gridClassName?: string;
  emptyState?: React.ReactNode;
  activeSlug?: string;
  onSlugChange?: (slug: string | null) => void;
}

function ProjectGrid({
  projects,
  gridClassName = "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
  emptyState,
  activeSlug,
  onSlugChange,
}: ProjectGridProps): React.ReactNode {
  // Internal state for uncontrolled usage
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | null>(
    null
  );

  const isControlled =
    typeof activeSlug !== "undefined" && typeof onSlugChange === "function";

  // Derived active index based on mode
  const activeIndex = useMemo(() => {
    if (isControlled) {
      if (!activeSlug) return null;
      const index = projects.findIndex((p) => getProjectSlug(p) === activeSlug);
      return index !== -1 ? index : null;
    }
    return internalActiveIndex;
  }, [isControlled, activeSlug, projects, internalActiveIndex]);

  const announcementId = useId();
  const announcement = useMemo(() => {
    if (projects.length === 0) {
      return "No projects to show right now.";
    }

    if (projects.length === 1) {
      return "Showing one project.";
    }

    return `Showing ${projects.length} projects.`;
  }, [projects.length]);

  useEffect(() => {
    if (!isControlled) {
      setInternalActiveIndex(null);
    }
  }, [projects, isControlled]);

  const handleOpen = useCallback(
    (index: number) => {
      if (isControlled) {
        onSlugChange(getProjectSlug(projects[index]));
      } else {
        setInternalActiveIndex(index);
      }
    },
    [isControlled, onSlugChange, projects]
  );

  const handleClose = useCallback(() => {
    if (isControlled) {
      onSlugChange(null);
    } else {
      setInternalActiveIndex(null);
    }
  }, [isControlled, onSlugChange]);

  const handlePrev = useCallback(() => {
    if (activeIndex === null || projects.length === 0) return;

    const previousIndex = (activeIndex - 1 + projects.length) % projects.length;

    if (isControlled) {
      onSlugChange(getProjectSlug(projects[previousIndex]));
    } else {
      setInternalActiveIndex(previousIndex);
    }
  }, [activeIndex, projects, isControlled, onSlugChange]);

  const handleNext = useCallback(() => {
    if (activeIndex === null || projects.length === 0) return;

    const nextIndex = (activeIndex + 1) % projects.length;

    if (isControlled) {
      onSlugChange(getProjectSlug(projects[nextIndex]));
    } else {
      setInternalActiveIndex(nextIndex);
    }
  }, [activeIndex, projects, isControlled, onSlugChange]);

  return (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        id={announcementId}
        className="sr-only"
      >
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
              <ProjectCard
                project={project}
                onSelect={() => handleOpen(index)}
              />
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
