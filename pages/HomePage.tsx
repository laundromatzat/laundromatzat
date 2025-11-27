import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import ChatAssistant from '../components/ChatAssistant';
import PageMetadata from '../components/PageMetadata';
import ProjectFilters, { Filters } from '../components/ProjectFilters';
import { compareProjectsByDateDesc } from '../utils/projectDates';
import { trackFilterApplied, trackReset, trackChatQuery } from '../lib/analytics';
import { useSearchParams } from 'react-router-dom';

const FEATURED_TITLES = new Set(['Sea of Love', 'Seasons of Love']);

const createDefaultFilters = (): Filters => ({ type: [], yearRange: null, tags: [] });

const sortUnique = (values: string[]): string[] => {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
};

const normalizeFilters = (filters: Filters): Filters => {
  const normalized: Filters = {};

  if (filters.type && filters.type.length > 0) {
    normalized.type = sortUnique(filters.type);
  }


  if (filters.yearRange && filters.yearRange.length === 2) {
    const [from, to] = filters.yearRange;
    if (typeof from === 'number' || typeof to === 'number') {
      const start = typeof from === 'number' ? from : to;
      const end = typeof to === 'number' ? to : from;
      const sortedRange: [number, number] = [Math.min(start, end), Math.max(start, end)];
      normalized.yearRange = sortedRange;
    }
  }

  return normalized;
};

const parseFiltersFromSearchParams = (params: URLSearchParams): Filters => {
  const types = params.getAll('type').map(value => value.trim()).filter(Boolean);

  const parseYear = (value: string | null): number | null => {
    if (!value) {
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const fromYear = parseYear(params.get('from'));
  const toYear = parseYear(params.get('to'));

  let yearRange: [number, number] | null = null;
  if (fromYear !== null || toYear !== null) {
    const start = fromYear ?? toYear ?? 0;
    const end = toYear ?? fromYear ?? start;
    yearRange = [Math.min(start, end), Math.max(start, end)];
  }

  const result: Filters = {};

  if (types.length > 0) {
    result.type = sortUnique(types);
  }

  if (yearRange) {
    result.yearRange = yearRange;
  }

  if (!result.type && !result.tags && !result.yearRange) {
    return createDefaultFilters();
  }

  return result;
};

const filtersToSearchParams = (filters: Filters): URLSearchParams => {
  const normalized = normalizeFilters(filters);
  const params = new URLSearchParams();

  normalized.type?.forEach(type => {
    params.append('type', type);
  });


  if (normalized.yearRange) {
    params.set('from', String(normalized.yearRange[0]));
    params.set('to', String(normalized.yearRange[1]));
  }

  return params;
};

const createFiltersKey = (filters: Filters): string => {
  const normalized = normalizeFilters(filters);
  return JSON.stringify({
    type: normalized.type ?? [],
    yearRange: normalized.yearRange ?? null,
  });
};

type ViewState = 'featured' | 'filters' | 'assistant';

type AvailableFilters = {
  types: string[];
  years: number[];
  tags: string[];
};

const hasActiveFilters = (filters: Filters): boolean => {
  return Boolean(
    (filters.type && filters.type.length > 0) ||
    filters.yearRange,
  );
};

const applyFilters = (projects: Project[], filters: Filters): Project[] => {
  const normalizedTypes = filters.type ?? [];
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

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);
  const filtersKey = useMemo(() => createFiltersKey(filters), [filters]);
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>(featuredProjects);
  const [viewState, setViewState] = useState<ViewState>('featured');
  const previousFiltersKeyRef = useRef<string>('');

  const availableFilters = useMemo<AvailableFilters>(() => {
    const types = new Set<string>();
    const years = new Set<number>();

    sortedProjects.forEach(project => {
      types.add(project.type);
      years.add(project.year);
    });

    return {
      types: Array.from(types).sort((a, b) => a.localeCompare(b)),
      years: Array.from(years).sort((a, b) => a - b),
      tags: [],
    };
  }, [sortedProjects]);

  const resetFilters = useCallback((source: 'filters' | 'assistant') => {
    setSearchParams(new URLSearchParams());
    setDisplayedProjects(featuredProjects);
    setViewState('featured');
    previousFiltersKeyRef.current = '';
    trackReset(source);
  }, [featuredProjects, setSearchParams]);

  const handleFilterChange = useCallback((next: Filters) => {
    setSearchParams(filtersToSearchParams(next));
  }, [setSearchParams]);

  const handleAiSearch = useCallback((projects: Project[]) => {
    setSearchParams(new URLSearchParams());

    if (projects.length === 0) {
      setDisplayedProjects(featuredProjects);
      setViewState('featured');
    } else {
      const sortedResults = [...projects].sort(compareProjectsByDateDesc);
      setDisplayedProjects(sortedResults);
      setViewState('assistant');
    }

    trackChatQuery(projects.length);
  }, [featuredProjects, setSearchParams]);

  useEffect(() => {
    if (!hasActiveFilters(filters)) {
      previousFiltersKeyRef.current = '';
      if (viewState !== 'assistant') {
        setDisplayedProjects(featuredProjects);
        setViewState('featured');
      }
      return;
    }

    const results = applyFilters(sortedProjects, filters);
    setDisplayedProjects(results);

    if (viewState !== 'filters') {
      setViewState('filters');
    }

    if (previousFiltersKeyRef.current !== filtersKey) {
      previousFiltersKeyRef.current = filtersKey;
      trackFilterApplied(filters, results.length);
    }
  }, [filters, filtersKey, featuredProjects, sortedProjects, viewState]);

  const isShowingFeatured = viewState === 'featured';

  return (
    <div className="space-y-space-6 lg:space-y-space-7">
      <PageMetadata
        title="Home"
        description="Explore laundromatzat’s latest films, photos, cinemagraphs, and interactive creative tools."
        path="/"
      />

      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter text-brand-text sm:text-5xl md:text-6xl">
          laundromatzat
        </h1>
        <p className="mx-auto max-w-2xl text-base text-brand-text-secondary">
          A collection of films, photos, and experimental tools.
        </p>
      </section>

      <ProjectFilters
        value={filters}
        onChange={handleFilterChange}
        onReset={() => resetFilters('filters')}
        available={availableFilters}
      />

      <section className="space-y-4" aria-label={isShowingFeatured ? 'Featured projects' : 'Search results'}>
        <ProjectGrid
          projects={displayedProjects}
          gridClassName="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          emptyState={(
            <div className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-brand-text">No results</p>
              <p className="mt-2 text-sm text-brand-text-secondary">
                Try clearing the filters or asking the assistant for another suggestion.
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

      <ChatAssistant onSearch={handleAiSearch} onReset={() => resetFilters('assistant')} />
    </div>
  );
}

export default HomePage;
