
import React from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';

function ToolsPage(): React.ReactNode {
  const toolProjects = PROJECTS.filter(p => p.type === ProjectType.Tool).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
     <div className="space-y-8">
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-2">tools</h1>
        <p className="text-lg text-brand-text-secondary">just testing.</p>
      </section>
      <ProjectGrid projects={toolProjects} />
    </div>
  );
}

export default ToolsPage;
