import React, { useMemo } from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import PageMetadata from '../components/PageMetadata';

function VideosPage(): React.ReactNode {
  const videoProjects = useMemo(
    () =>
      PROJECTS.filter(project => project.type === ProjectType.Video).sort((a, b) => {
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
        title="Videos"
        description="Road films, holiday epics, and family travelogues spanning two decades."
        path="/videos"
        type="article"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text">Videos</h1>
        <p className="text-brand-text-secondary">
          Narrative travel films and yearly recaps that celebrate the people, places, and songs that inspire the journey.
        </p>
      </header>
      <ProjectGrid projects={videoProjects} />
    </div>
  );
}

export default VideosPage;
