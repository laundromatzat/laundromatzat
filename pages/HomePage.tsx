import React, { useCallback, useMemo, useState } from 'react';
import { PROJECTS } from '../constants';
import { Project, ProjectType } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import ChatAssistant from '../components/ChatAssistant';
import MailingListSignup from '../components/MailingListSignup';
import PageMetadata from '../components/PageMetadata';
import ProjectFilters, { ProjectFiltersValue } from '../components/ProjectFilters';
import { searchProjects } from '../services/geminiService';

const TYPE_ORDER: ProjectFiltersValue['type'][] = ['Video', 'Photo', 'Cinemagraph'];

function HomePage(): React.ReactNode {
  const featuredProjects = useMemo(
    () =>
      PROJECTS.filter(project => project.title === 'Sea of Love' || project.title === 'Seasons of Love')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [],
  );
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>(featuredProjects);

  const createEmptyFilters = useCallback(
    (): ProjectFiltersValue => ({
      type: undefined,
      yearFrom: undefined,
      yearTo: undefined,
      tags: [],
    }),
    [],
  );

  const [filters, setFilters] = useState<ProjectFiltersValue>(() => createEmptyFilters());

  const availableTypes = useMemo(
    () =>
      Array.from(
        PROJECTS.reduce((acc, project) => {
          switch (project.type) {
            case ProjectType.Video:
              acc.add('Video');
              break;
            case ProjectType.Photo:
              acc.add('Photo');
              break;
            case ProjectType.Cinemagraph:
              acc.add('Cinemagraph');
              break;
            default:
              break;
          }
          return acc;
        }, new Set<ProjectFiltersValue['type']>()),
      ).sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b)),
    [],
  );

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    PROJECTS.forEach(project => {
      project.tags?.forEach(tag => {
        if (tag) tagSet.add(tag);
      });
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, []);

  const emitInteraction = useCallback((source: 'assistant' | 'filters', event: string, data?: Record<string, unknown>) => {
    const detail = { source, event, data };
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('portfolio-analytics', { detail }));
    }
    // eslint-disable-next-line no-console
    console.info(`[analytics] ${source}:${event}`, data ?? {});
  }, []);

  const resetFilters = useCallback(
    (options?: { silent?: boolean }) => {
      const nextFilters = createEmptyFilters();
      setFilters(nextFilters);
      if (!options?.silent) {
        emitInteraction('filters', 'reset');
      }
      return nextFilters;
    },
    [createEmptyFilters, emitInteraction],
  );

  const handleClearFilters = useCallback(() => {
    resetFilters();
    setDisplayedProjects(featuredProjects);
  }, [featuredProjects, resetFilters]);

  const handleFilterChange = useCallback(
    (nextFilters: ProjectFiltersValue) => {
      const sanitized: ProjectFiltersValue = {
        type: nextFilters.type,
        yearFrom: nextFilters.yearFrom?.trim() || undefined,
        yearTo: nextFilters.yearTo?.trim() || undefined,
        tags: [...nextFilters.tags],
      };

      setFilters(sanitized);

      const includeTags = sanitized.tags.filter(Boolean);
      const hasActiveFilters = Boolean(
        sanitized.type || sanitized.yearFrom || sanitized.yearTo || includeTags.length,
      );

      if (!hasActiveFilters) {
        setDisplayedProjects(featuredProjects);
        emitInteraction('filters', 'cleared');
        return;
      }

      const results = searchProjects('', {
        type: sanitized.type,
        dateFrom: sanitized.yearFrom,
        dateTo: sanitized.yearTo,
        includeTags: includeTags.length ? includeTags : undefined,
      });

      setDisplayedProjects(results);
      emitInteraction('filters', 'applied', {
        filters: {
          type: sanitized.type,
          dateFrom: sanitized.yearFrom,
          dateTo: sanitized.yearTo,
          includeTags,
        },
        results: results.length,
      });
    },
    [emitInteraction, featuredProjects],
  );

  const handleAiSearch = useCallback(
    (projects: Project[]) => {
      resetFilters({ silent: true });

      const event = projects.length > 0 ? 'search-results' : 'search-reset';
      emitInteraction('assistant', event, { results: projects.length });

      setDisplayedProjects(projects.length > 0 ? projects : featuredProjects);
    },
    [emitInteraction, featuredProjects, resetFilters],
  );

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
              onClick={handleClearFilters}
              className="hidden text-sm font-medium text-brand-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary md:inline-flex"
            >
              Reset to featured
            </button>
          ) : null}
        </div>

        <ProjectFilters
          types={availableTypes.map(label => ({ label, value: label }))}
          tags={availableTags}
          value={filters}
          onChange={handleFilterChange}
          onReset={handleClearFilters}
        />

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
                onClick={handleClearFilters}
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
