import React from "react";
import { Project } from "../types";
import clsx from "clsx";

interface MasonryGridProps {
  projects: Project[];
  onProjectSelect: (index: number) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({
  projects,
  onProjectSelect,
}) => {
  return (
    <div className="w-full max-w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {projects.map((project, index) => {
        // Create a pseudo-random pattern for grid spans based on index
        const isLarge = index % 5 === 0;
        const isTall = index % 5 === 2;

        return (
          <div
            key={project.id}
            className={clsx(
              "group relative overflow-hidden rounded-2xl bg-zinc-100 min-h-[300px]",
              isLarge && "md:col-span-2 md:row-span-2",
              isTall && "md:row-span-2",
              !isLarge && !isTall && "md:col-span-1 md:row-span-1"
            )}
          >
            <img
              src={project.imageUrl}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500" />

            <div className="absolute inset-0 p-8 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <span className="text-xs font-medium uppercase tracking-widest text-white/80 mb-2">
                {project.type}
              </span>
              <h3 className="text-2xl font-serif text-white mb-2">
                {project.title}
              </h3>
              <p className="text-sm text-white/90 line-clamp-2 mb-4">
                {project.description}
              </p>
              <button
                onClick={() => onProjectSelect(index)}
                className="inline-flex items-center text-sm font-semibold text-white uppercase tracking-wider hover:underline decoration-1 underline-offset-4"
              >
                View Project
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MasonryGrid;
