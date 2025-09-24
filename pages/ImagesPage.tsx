
import React from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';

function ImagesPage(): React.ReactNode {
  const photoProjects = PROJECTS.filter(p => p.type === ProjectType.Photo).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    const [aMonth, aYear] = a.date.split('/');
    const [bMonth, bYear] = b.date.split('/');
    return new Date(`${bYear}-${bMonth}-01`).getTime() - new Date(`${aYear}-${aMonth}-01`).getTime();
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-2">images</h1>
        <p className="text-lg text-brand-text-secondary">static moments.</p>
      </section>
      <ProjectGrid projects={photoProjects} />
    </div>
  );
}

export default ImagesPage;
