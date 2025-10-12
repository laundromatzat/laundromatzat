import React, { useEffect, useMemo, useState } from 'react';
import PageMetadata from '../components/PageMetadata';
import { parseCsv } from '../utils/csv';

interface Bookmark {
  url: string;
  title: string;
  description: string;
  tags: string[];
}

type LoadState = 'idle' | 'loading' | 'success' | 'error';

type FilterState = {
  query: string;
  tags: string[];
};

const SKELETON_COUNT = 6;

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseTagList = (raw: string): string[] =>
  raw
    .split(/[;,]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

const matchesFilters = (link: Bookmark, filters: FilterState): boolean => {
  const hasQuery = filters.query.trim().length > 0;
  const hasTags = filters.tags.length > 0;

  if (!hasQuery && !hasTags) {
    return true;
  }

  if (hasQuery) {
    const haystack = normalize(`${link.title} ${link.description} ${link.url}`);
    if (!haystack.includes(normalize(filters.query))) {
      return false;
    }
  }

  if (hasTags) {
    const linkTags = link.tags.map(tag => tag.toLowerCase());
    const requiredTags = filters.tags.map(tag => tag.toLowerCase());
    const hasAllTags = requiredTags.every(tag => linkTags.includes(tag));
    if (!hasAllTags) {
      return false;
    }
  }

  return true;
};

function LinksPage(): React.ReactNode {
  const [links, setLinks] = useState<Bookmark[]>([]);
  const [status, setStatus] = useState<LoadState>('idle');
  const [filters, setFilters] = useState<FilterState>({ query: '', tags: [] });

  useEffect(() => {
    let isMounted = true;

    const loadLinks = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/data/links.csv');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const text = await response.text();
        if (!isMounted) {
          return;
        }

        const { headers, rows } = parseCsv(text);
        const headerIndex = (name: string) => headers.indexOf(name);
        const urlIndex = headerIndex('url');
        const titleIndex = headerIndex('title');
        const descriptionIndex = headerIndex('description');
        const tagsIndex = headerIndex('tags');

        const linksData = rows
          .map(row => {
            const url = row[urlIndex] ?? '';
            const title = row[titleIndex] ?? '';
            const description = row[descriptionIndex] ?? '';
            const tagsRaw = row[tagsIndex] ?? '';
            return {
              url: url.trim(),
              title: title.trim() || url.trim(),
              description: description.trim(),
              tags: parseTagList(tagsRaw),
            };
          })
          .filter(link => link.url.length > 0 && link.description.length > 0);

        setLinks(linksData);
        setStatus('success');
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to load links', error);
        }
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    void loadLinks();

    return () => {
      isMounted = false;
    };
  }, []);

  const skeletonPlaceholders = useMemo(
    () =>
      Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="h-20 rounded-radius-md border border-brand-surface-highlight/30 bg-brand-secondary/40"
          aria-hidden="true"
        />
      )),
    [],
  );

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach(link => link.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [links]);

  const filteredLinks = useMemo(
    () => links.filter(link => matchesFilters(link, filters)),
    [links, filters],
  );

  const hasActiveFilters = filters.query.trim().length > 0 || filters.tags.length > 0;

  const toggleTag = (tag: string) => {
    setFilters(prev => {
      const selected = new Set(prev.tags);
      if (selected.has(tag)) {
        selected.delete(tag);
      } else {
        selected.add(tag);
      }
      return { ...prev, tags: Array.from(selected) };
    });
  };

  const clearFilters = () => setFilters({ query: '', tags: [] });

  return (
    <div className="space-y-space-5">
      <PageMetadata
        title="Links"
        description="Curated tools, articles, and resources from around the web, plus in-house experiments to try."
        path="/links"
        type="article"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text">Links</h1>
        <p className="text-brand-text-secondary">
          A living list of resources that inform the work—creative tools, inspiration, and helpful reads.
        </p>
      </header>

      <section className="space-y-space-3" aria-live="polite" aria-busy={status === 'loading'}>
        <div className="flex flex-col gap-3 rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 p-4">
          <label className="flex flex-col gap-2 text-sm text-brand-text-secondary">
            <span className="font-semibold uppercase tracking-[0.2em] text-xs">Search</span>
            <input
              type="search"
              value={filters.query}
              onChange={event => setFilters(prev => ({ ...prev, query: event.target.value }))}
              placeholder="Search title, description, or URL"
              className="w-full rounded-radius-sm border border-brand-surface-highlight/60 bg-brand-primary/70 px-3 py-2 text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60"
            />
          </label>
          {availableTags.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-secondary">Tags</legend>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => {
                  const isActive = filters.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary ${
                        isActive
                          ? 'border-brand-accent bg-brand-accent text-brand-on-accent'
                          : 'border-brand-surface-highlight/60 bg-brand-primary/60 text-brand-text-secondary hover:border-brand-accent/60 hover:text-brand-text'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-xs font-medium text-brand-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <h2 className="text-xl font-semibold text-brand-text">Reading list &amp; resources</h2>
        {status === 'error' ? (
          <div
            role="alert"
            className="rounded-radius-md border border-status-error-text/40 bg-status-error-bg px-4 py-3 text-sm text-status-error-text"
          >
            We couldn&apos;t load the bookmarks right now. Refresh the page or try again later.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {status === 'loading'
            ? skeletonPlaceholders
            : filteredLinks.length > 0
              ? filteredLinks.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-4 py-3 text-left text-brand-text-secondary transition hover:border-brand-accent hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                  >
                    <span className="block text-sm font-medium text-brand-text">{link.title}</span>
                    <span className="mt-1 block text-xs text-brand-text-secondary/80">{link.description}</span>
                    {link.tags.length > 0 ? (
                      <span className="mt-2 block text-[11px] uppercase tracking-[0.2em] text-brand-text-secondary/70">
                        {link.tags.join(' • ')}
                      </span>
                    ) : null}
                  </a>
                ))
              : (
                  <div className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-4 py-6 text-center text-brand-text-secondary">
                    <p className="text-sm font-semibold text-brand-text">No results—try clearing filters.</p>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-2 text-xs font-medium text-brand-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                )}
        </div>
      </section>
    </div>
  );
}

export default LinksPage;
