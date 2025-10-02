import React, { useMemo } from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import PageMetadata from '../components/PageMetadata';

function ImagesPage(): React.ReactNode {
  const photoProjects = useMemo(
    () =>
      PROJECTS.filter(project => project.type === ProjectType.Photo).sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        const [aMonth, aYear] = a.date.split('/');
        const [bMonth, bYear] = b.date.split('/');
        return new Date(`${bYear}-${bMonth}-01`).getTime() - new Date(`${aYear}-${aMonth}-01`).getTime();
      }),
    [],
  );

  return (
    <div className="space-y-space-5">
      <PageMetadata
        title="Images"
        description="Browse still photography captured across Alaska, California, and beyond."
        path="/images"
        type="article"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text">Images</h1>
        <p className="text-brand-text-secondary">
          Still moments from the road—glaciers, coastlines, and everyday slices of life.
        </p>
      </header>
      <ProjectGrid projects={photoProjects} />
    </div>
  );
}

export default ImagesPage;
