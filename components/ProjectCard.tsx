
import React from 'react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps): React.ReactNode {
  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl hover:shadow-brand-accent/20 animate-slide-in-up">
      <a href={project.projectUrl || project.imageUrl} target="_blank" rel="noopener noreferrer">
        <img className="w-full h-56 object-cover" src={project.imageUrl} alt={project.title} />
      </a>
      <div className="p-6">
        <h3 className="text-lg sm:text-xl font-bold text-brand-text mb-2">{project.title}</h3>
        <p className="text-brand-text-secondary text-sm sm:text-base mb-4">{project.description}</p>
        
      </div>
    </div>
  );
}

export default ProjectCard;
