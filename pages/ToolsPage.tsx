import React, { useMemo } from 'react';
import { PROJECTS } from '../constants';
import { ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import PageMetadata from '../components/PageMetadata';

function ToolsPage(): React.ReactNode {
  const toolProjects = useMemo(
    () =>
      PROJECTS.filter(project => project.type === ProjectType.Tool).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  );

  return (
    <div className="space-y-space-5">
      <PageMetadata
        title="Tools"
        description="Interactive experiments for background removal, color palettes, and other creative workflows."
        path="/tools"
        type="article"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text">Tools</h1>
        <p className="text-brand-text-secondary">
          Try in-browser experiments that streamline post-production and inspire new ideas.
        </p>
      </header>
      <ProjectGrid
        projects={toolProjects}
        emptyState={
          <div className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-brand-text">New experiments coming soon</p>
            <p className="mt-2 text-sm text-brand-text-secondary">
              Sign up for the newsletter to hear when the next creative tool goes live.
            </p>
          </div>
        }
      />
    </div>
  );
}

export default ToolsPage;
