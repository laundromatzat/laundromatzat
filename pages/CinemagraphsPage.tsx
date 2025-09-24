
import React from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';

function CinemagraphsPage(): React.ReactNode {
  const cinemagraphProjects = PROJECTS.filter(p => p.type === ProjectType.Cinemagraph).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    const [aMonth, aYear] = a.date.split('/');
    const [bMonth, bYear] = b.date.split('/');
    return new Date(`${bYear}-${bMonth}-01`).getTime() - new Date(`${aYear}-${aMonth}-01`).getTime();
  });

  return (
     <div className="space-y-8">
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-2">cinemagraphs</h1>
        <p className="text-lg text-brand-text-secondary">picture that breathe.</p>
      </section>
      <ProjectGrid projects={cinemagraphProjects} />
    </div>
  );
}

export default CinemagraphsPage;
