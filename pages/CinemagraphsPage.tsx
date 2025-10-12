import React, { useMemo } from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import PageMetadata from '../components/PageMetadata';
import { toComparableDate } from '../services/projectOrdering';

function CinemagraphsPage(): React.ReactNode {
  const cinemagraphProjects = useMemo(
    () =>
      PROJECTS.filter(project => project.type === ProjectType.Cinemagraph).sort((a, b) => {
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
        title="Cinemagraphs"
        description="Looping living photos that blend still imagery with subtle motion."
        path="/cinemagraphs"
        type="article"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text">Cinemagraphs</h1>
        <p className="text-brand-text-secondary">
          Living photographs where motion and stillness meet—perfect for ambient displays and storytelling.
        </p>
      </header>
      <ProjectGrid projects={cinemagraphProjects} />
    </div>
  );
}

export default CinemagraphsPage;
