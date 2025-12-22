import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PROJECTS } from "../constants";
import { Project } from "../types";
import ProjectGrid from "../components/ProjectGrid";
import PageMetadata from "../components/PageMetadata";
import ProjectFilters, { Filters } from "../components/ProjectFilters";
import { compareProjectsByDateDesc } from "../utils/projectDates";
import { trackFilterApplied, trackReset } from "../lib/analytics";
import { useSearchParams } from "react-router-dom";

const FEATURED_TITLES = new Set(["Sea of Love", "Seasons of Love"]);

const createDefaultFilters = (): Filters => ({
  type: [],
  yearRange: null,
  tags: [],
});

const sortUnique = (values: string[]): string[] => {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
};

const normalizeFilters = (filters: Filters): Filters => {
  const normalized: Filters = {};

  if (filters.type && filters.type.length > 0) {
    normalized.type = sortUnique(filters.type);
  }

  if (filters.tags && filters.tags.length > 0) {
    normalized.tags = sortUnique(filters.tags);
  }

  if (filters.yearRange && filters.yearRange.length === 2) {
    const [from, to] = filters.yearRange;
    if (typeof from === "number" || typeof to === "number") {
      const start = typeof from === "number" ? from : to;
      const end = typeof to === "number" ? to : from;
      const sortedRange: [number, number] = [
        Math.min(start, end),
        Math.max(start, end),
      ];
      normalized.yearRange = sortedRange;
    }
  }

  return normalized;
};

const parseFiltersFromSearchParams = (params: URLSearchParams): Filters => {
  const types = params
    .getAll("type")
    .map((value) => value.trim())
    .filter(Boolean);
  const tags = params
    .getAll("tag")
    .map((value) => value.trim())
    .filter(Boolean);

  const parseYear = (value: string | null): number | null => {
    if (!value) {
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const fromYear = parseYear(params.get("from"));
  const toYear = parseYear(params.get("to"));

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

  if (tags.length > 0) {
    result.tags = sortUnique(tags);
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

  normalized.type?.forEach((type) => {
    params.append("type", type);
  });

  normalized.tags?.forEach((tag) => {
    params.append("tag", tag);
  });

  if (normalized.yearRange) {
    params.set("from", String(normalized.yearRange[0]));
    params.set("to", String(normalized.yearRange[1]));
  }

  return params;
};

const createFiltersKey = (filters: Filters): string => {
  const normalized = normalizeFilters(filters);
  return JSON.stringify({
    type: normalized.type ?? [],
    yearRange: normalized.yearRange ?? null,
    tags: normalized.tags ?? [],
  });
};

type ViewState = "featured" | "filters" | "assistant";

type AvailableFilters = {
  types: string[];
  years: number[];
  tags: string[];
};

const hasActiveFilters = (filters: Filters): boolean => {
  return Boolean(
    (filters.type && filters.type.length > 0) ||
      filters.yearRange ||
      (filters.tags && filters.tags.length > 0)
  );
};

const applyFilters = (projects: Project[], filters: Filters): Project[] => {
  const normalizedTypes = filters.type ?? [];
  const normalizedTags = filters.tags ?? [];
  const [fromYear, toYear] = filters.yearRange ?? [undefined, undefined];

  return projects
    .filter((project) => {
      if (
        normalizedTypes.length > 0 &&
        !normalizedTypes.includes(project.type)
      ) {
        return false;
      }

      if (filters.yearRange) {
        if (typeof fromYear === "number" && project.year < fromYear) {
          return false;
        }
        if (typeof toYear === "number" && project.year > toYear) {
          return false;
        }
      }

      if (normalizedTags.length > 0) {
        const tags = project.tags ?? [];
        const hasAllTags = normalizedTags.every((tag) => tags.includes(tag));
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
    []
  );

  const featuredProjects = useMemo(
    () =>
      sortedProjects.filter((project) => FEATURED_TITLES.has(project.title)),
    [sortedProjects]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );
  const filtersKey = useMemo(() => createFiltersKey(filters), [filters]);
  const [displayedProjects, setDisplayedProjects] =
    useState<Project[]>(featuredProjects);
  const [viewState, setViewState] = useState<ViewState>("featured");
  const previousFiltersKeyRef = useRef<string>("");

  const availableFilters = useMemo<AvailableFilters>(() => {
    const types = new Set<string>();
    const years = new Set<number>();
    const tags = new Set<string>();

    sortedProjects.forEach((project) => {
      types.add(project.type);
      years.add(project.year);
      (project.tags ?? []).forEach((tag) => tags.add(tag));
    });

    return {
      types: Array.from(types).sort((a, b) => a.localeCompare(b)),
      years: Array.from(years).sort((a, b) => a - b),
      tags: Array.from(tags).sort((a, b) => a.localeCompare(b)),
    };
  }, [sortedProjects]);

  const resetFilters = useCallback(
    (source: "filters" | "assistant") => {
      setSearchParams(new URLSearchParams());
      setDisplayedProjects(featuredProjects);
      setViewState("featured");
      previousFiltersKeyRef.current = "";
      trackReset(source);
    },
    [featuredProjects, setSearchParams]
  );

  const handleFilterChange = useCallback(
    (next: Filters) => {
      setSearchParams(filtersToSearchParams(next));
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (!hasActiveFilters(filters)) {
      previousFiltersKeyRef.current = "";
      if (viewState !== "assistant") {
        setDisplayedProjects(featuredProjects);
        setViewState("featured");
      }
      return;
    }

    const results = applyFilters(sortedProjects, filters);
    setDisplayedProjects(results);

    if (viewState !== "filters") {
      setViewState("filters");
    }

    if (previousFiltersKeyRef.current !== filtersKey) {
      previousFiltersKeyRef.current = filtersKey;
      trackFilterApplied(filters, results.length);
    }
  }, [filters, filtersKey, featuredProjects, sortedProjects, viewState]);

  const isShowingFeatured = viewState === "featured";

  return (
    <div className="space-y-space-6 lg:space-y-space-7">
      <PageMetadata
        title="Home"
        description="Explore laundromatzat’s latest films, photos, cinemagraphs, and interactive creative tools."
        path="/"
      />

      <section className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-text-secondary">
          Creative portfolio
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-brand-text">
          laundromatzat.com
        </h1>
        <p className="mx-auto max-w-2xl text-base text-brand-text-secondary">
          Films, photos, and experimental tools from Michael Laundromatzat.
          Browse featured pieces below or ask the AI assistant to surface
          projects by theme, location, or collaborator.
        </p>
      </section>

      <ProjectFilters
        value={filters}
        onChange={handleFilterChange}
        onReset={() => resetFilters("filters")}
        available={availableFilters}
      />

      <section
        className="space-y-4"
        aria-label={isShowingFeatured ? "Featured projects" : "Search results"}
      >
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-brand-text">
              {isShowingFeatured
                ? "Featured releases"
                : viewState === "filters"
                  ? "Filtered results"
                  : "Search results"}
            </h2>
            <p className="text-sm text-brand-text-secondary">
              {isShowingFeatured
                ? "Hand-picked highlights from the archive."
                : viewState === "filters"
                  ? "Refined by the filters above. Adjust or reset to explore more."
                  : "Updated based on your latest search in the assistant."}
            </p>
          </div>
          {!isShowingFeatured ? (
            <button
              type="button"
              onClick={() => resetFilters("filters")}
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
              <p className="text-lg font-semibold text-brand-text">
                No results just yet
              </p>
              <p className="mt-2 text-sm text-brand-text-secondary">
                Try clearing filters or asking the assistant for another
                suggestion to keep exploring the portfolio.
              </p>
              <button
                type="button"
                onClick={() => resetFilters("filters")}
                className="mt-4 inline-flex items-center rounded-radius-md bg-brand-accent px-space-4 py-3 text-sm font-semibold text-brand-on-accent transition hover:bg-brand-accent-strong"
              >
                Clear filters
              </button>
            </div>
          }
        />
      </section>

      {/* Footer / Contact */}
      <footer className="py-24 border-t border-white/5 bg-black/60 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-white/40 text-sm">
              &copy; {new Date().getFullYear()} Laundromatzat. All rights
              reserved.
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://instagram.com/laundromatzat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors duration-300"
              >
                Instagram
              </a>
              <a
                href="mailto:studio@laundromatzat.com"
                className="text-white/40 hover:text-white transition-colors duration-300"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
