
import React from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectCard from '../components/ProjectCard';

function VideosPage(): React.ReactNode {
  const videoProjects = PROJECTS.filter(p => p.type === ProjectType.Video);

  return (
     <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold text-brand-text mb-2">videos</h1>
        <p className="text-lg text-brand-text-secondary">welcome.</p>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videoProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

export default VideosPage;
