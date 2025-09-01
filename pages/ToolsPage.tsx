
import React from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectCard from '../components/ProjectCard';

function ToolsPage(): React.ReactNode {
  const toolProjects = PROJECTS.filter(p => p.type === ProjectType.Tool).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
     <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold text-brand-text mb-2">tools</h1>
        <p className="text-lg text-brand-text-secondary">just testing.</p>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {toolProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

export default ToolsPage;
