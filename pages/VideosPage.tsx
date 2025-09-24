
import React from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';

function VideosPage(): React.ReactNode {
  const videoProjects = PROJECTS.filter(p => p.type === ProjectType.Video).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    const [aMonth, aYear] = a.date.split('/');
    const [bMonth, bYear] = b.date.split('/');
    return new Date(`${bYear}-${bMonth}-01`).getTime() - new Date(`${aYear}-${aMonth}-01`).getTime();
  });

  return (
     <div className="space-y-8">
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-2">videos</h1>
        <p className="text-lg text-brand-text-secondary">welcome.</p>
      </section>
      <ProjectGrid projects={videoProjects} />
    </div>
  );
}

export default VideosPage;
