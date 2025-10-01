import React, { useMemo, useState } from 'react';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import ChatAssistant from '../components/ChatAssistant';
import MailingListSignup from '../components/MailingListSignup';
import PageMetadata from '../components/PageMetadata';

function HomePage(): React.ReactNode {
  const featuredProjects = useMemo(
    () =>
      PROJECTS.filter(project => project.title === 'Sea of Love' || project.title === 'Seasons of Love')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [],
  );
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>(featuredProjects);

  const handleAiSearch = (projects: Project[]) => {
    setDisplayedProjects(projects.length > 0 ? projects : featuredProjects);
  };

  const isShowingFeatured = displayedProjects === featuredProjects;

  return (
    <div className="space-y-space-6 lg:space-y-space-7">
      <PageMetadata
        title="Home"
        description="Explore laundromatzat’s latest films, photos, cinemagraphs, and interactive creative tools."
        path="/"
      />

      <section className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-text-secondary">Creative portfolio</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-brand-text">
          laundromatzat.com
        </h1>
        <p className="mx-auto max-w-2xl text-base text-brand-text-secondary">
          Films, photos, and experimental tools from Michael Laundromatzat. Browse featured pieces below or ask the AI assistant
          to surface projects by theme, location, or collaborator.
        </p>
      </section>

      <section className="space-y-4" aria-label={isShowingFeatured ? 'Featured projects' : 'Search results'}>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-brand-text">
              {isShowingFeatured ? 'Featured releases' : 'Search results'}
            </h2>
            <p className="text-sm text-brand-text-secondary">
              {isShowingFeatured
                ? 'Hand-picked highlights from the archive.'
                : 'Updated based on your latest search in the assistant.'}
            </p>
          </div>
          {!isShowingFeatured ? (
            <button
              type="button"
              onClick={() => setDisplayedProjects(featuredProjects)}
              className="hidden text-sm font-medium text-brand-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary md:inline-flex"
            >
              Reset to featured
            </button>
          ) : null}
        </div>

        <ProjectGrid
          projects={displayedProjects}
          gridClassName="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          emptyState={
            <div className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-brand-text">No matches yet</p>
              <p className="mt-2 text-sm text-brand-text-secondary">
                Try another search or reset to the featured collection to keep exploring the portfolio.
              </p>
              <button
                type="button"
                onClick={() => setDisplayedProjects(featuredProjects)}
                className="mt-4 inline-flex items-center rounded-radius-md bg-brand-accent px-space-4 py-3 text-sm font-semibold text-brand-on-accent transition hover:bg-brand-accent-strong"
              >
                View featured work
              </button>
            </div>
          }
        />
      </section>

      <MailingListSignup />

      <ChatAssistant onSearch={handleAiSearch} />
    </div>
  );
}

export default HomePage;
