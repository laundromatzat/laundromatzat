import React, { useCallback, useMemo, useState } from 'react';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import ChatAssistant from '../components/ChatAssistant';
import MailingListSignup from '../components/MailingListSignup';
import PageMetadata from '../components/PageMetadata';
import ProjectFilters, { Filters } from '../components/ProjectFilters';
import { compareProjectsByDateDesc } from '../utils/projectDates';
import { analytics } from '../lib/analytics';

const FEATURED_TITLES = new Set(['Sea of Love', 'Seasons of Love']);

const createDefaultFilters = (): Filters => ({ type: [], yearRange: null, tags: [] });

type ViewState = 'featured' | 'filters' | 'assistant';

type AvailableFilters = {
  types: string[];
  years: number[];
  tags: string[];
};

const hasActiveFilters = (filters: Filters): boolean => {
  return Boolean(
    (filters.type && filters.type.length > 0) ||
    filters.yearRange ||
    (filters.tags && filters.tags.length > 0),
  );
};

const applyFilters = (projects: Project[], filters: Filters): Project[] => {
  const normalizedTypes = filters.type ?? [];
  const normalizedTags = filters.tags ?? [];
  const [fromYear, toYear] = filters.yearRange ?? [undefined, undefined];

  return projects
    .filter(project => {
      if (normalizedTypes.length > 0 && !normalizedTypes.includes(project.type)) {
        return false;
      }

      if (filters.yearRange) {
        if (typeof fromYear === 'number' && project.year < fromYear) {
          return false;
        }
        if (typeof toYear === 'number' && project.year > toYear) {
          return false;
        }
      }

      if (normalizedTags.length > 0) {
        const tags = project.tags ?? [];
        const hasAllTags = normalizedTags.every(tag => tags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    })
    .sort(compareProjectsByDateDesc);
};

function HomePage(): React.ReactNode {
  const sortedProjects = useMemo(
    () => [...PROJECTS].sort(compareProjectsByDateDesc),
    [],
  );

  const featuredProjects = useMemo(
    () => sortedProjects.filter(project => FEATURED_TITLES.has(project.title)),
    [sortedProjects],
  );

  const [filters, setFilters] = useState<Filters>(() => createDefaultFilters());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>(featuredProjects);
  const [viewState, setViewState] = useState<ViewState>('featured');

  const availableFilters = useMemo<AvailableFilters>(() => {
    const types = new Set<string>();
    const years = new Set<number>();
    const tags = new Set<string>();

    sortedProjects.forEach(project => {
      types.add(project.type);
      years.add(project.year);
      (project.tags ?? []).forEach(tag => tags.add(tag));
    });

    return {
      types: Array.from(types).sort((a, b) => a.localeCompare(b)),
      years: Array.from(years).sort((a, b) => a - b),
      tags: Array.from(tags).sort((a, b) => a.localeCompare(b)),
    };
  }, [sortedProjects]);

  const resetFilters = useCallback((source: 'filters' | 'assistant') => {
    const defaults = createDefaultFilters();
    setFilters(defaults);
    setDisplayedProjects(featuredProjects);
    setViewState('featured');
    analytics.track('onReset', { source });
  }, [featuredProjects]);

  const handleFilterChange = useCallback((next: Filters) => {
    setFilters(next);
    if (hasActiveFilters(next)) {
      const results = applyFilters(sortedProjects, next);
      setDisplayedProjects(results);
      setViewState('filters');
      analytics.track('onFilterApplied', { filters: next, resultCount: results.length });
      return;
    }

    if (viewState !== 'assistant') {
      setDisplayedProjects(featuredProjects);
      setViewState('featured');
    }
  }, [featuredProjects, sortedProjects, viewState]);

  const handleAiSearch = useCallback((projects: Project[]) => {
    const defaults = createDefaultFilters();
    setFilters(defaults);

    if (projects.length === 0) {
      setDisplayedProjects(featuredProjects);
      setViewState('featured');
    } else {
      const sortedResults = [...projects].sort(compareProjectsByDateDesc);
      setDisplayedProjects(sortedResults);
      setViewState('assistant');
    }

    analytics.track('onChatQuery', { resultCount: projects.length });
  }, [featuredProjects]);

  const isShowingFeatured = viewState === 'featured';

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

      <ProjectFilters
        value={filters}
        onChange={handleFilterChange}
        onReset={() => resetFilters('filters')}
        available={availableFilters}
      />

      <section className="space-y-4" aria-label={isShowingFeatured ? 'Featured projects' : 'Search results'}>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-brand-text">
              {isShowingFeatured ? 'Featured releases' : viewState === 'filters' ? 'Filtered results' : 'Search results'}
            </h2>
            <p className="text-sm text-brand-text-secondary">
              {isShowingFeatured
                ? 'Hand-picked highlights from the archive.'
                : viewState === 'filters'
                  ? 'Refined by the filters above. Adjust or reset to explore more.'
                  : 'Updated based on your latest search in the assistant.'}
            </p>
          </div>
          {!isShowingFeatured ? (
            <button
              type="button"
              onClick={() => resetFilters('filters')}
              className="hidden text-sm font-medium text-brand-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary md:inline-flex"
            >
              Reset to featured
            </button>
          ) : null}
        </div>

        <ProjectGrid
          projects={displayedProjects}
          gridClassName="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          emptyState={(
            <div className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-brand-text">No results just yet</p>
              <p className="mt-2 text-sm text-brand-text-secondary">
                Try clearing filters or asking the assistant for another suggestion to keep exploring the portfolio.
              </p>
              <button
                type="button"
                onClick={() => resetFilters('filters')}
                className="mt-4 inline-flex items-center rounded-radius-md bg-brand-accent px-space-4 py-3 text-sm font-semibold text-brand-on-accent transition hover:bg-brand-accent-strong"
              >
                Clear filters
              </button>
            </div>
          )}
        />
      </section>

      <MailingListSignup />

      <ChatAssistant onSearch={handleAiSearch} onReset={() => resetFilters('assistant')} />
    </div>
  );
}

export default HomePage;
