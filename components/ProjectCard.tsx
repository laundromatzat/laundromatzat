
import React from 'react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onSelect?: () => void;
}

function ProjectCard({ project, onSelect }: ProjectCardProps): React.ReactNode {
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
    <button
      type="button"
      onClick={handleClick}
      className="bg-brand-secondary rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl hover:shadow-brand-accent/20 animate-slide-in-up focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/60 w-full text-left"
    >
      <img className="w-full h-56 object-cover" src={project.imageUrl} alt={project.title} />
      <div className="p-6">
        <h3 className="text-lg sm:text-xl font-bold text-brand-text mb-2">{project.title}</h3>
        <p className="text-brand-text-secondary text-sm sm:text-base mb-4">{project.description}</p>
      </div>
    </button>
  );
}

export default ProjectCard;
