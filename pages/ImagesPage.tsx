
import React from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectCard from '../components/ProjectCard';

function ImagesPage(): React.ReactNode {
  const photoProjects = PROJECTS.filter(p => p.type === ProjectType.Photo);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold text-brand-text mb-2">images</h1>
        <p className="text-lg text-brand-text-secondary">static moments.</p>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {photoProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

export default ImagesPage;
