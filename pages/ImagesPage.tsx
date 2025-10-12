import React, { useMemo } from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import PageMetadata from '../components/PageMetadata';
import { toComparableDate } from '../services/projectOrdering';

function ImagesPage(): React.ReactNode {
  const photoProjects = useMemo(
    () =>
      PROJECTS.filter(project => project.type === ProjectType.Photo).sort((a, b) => {
        const aDate = toComparableDate(a);
        const bDate = toComparableDate(b);

        if (aDate === null) return 1;
        if (bDate === null) return -1;

        return bDate - aDate;
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
