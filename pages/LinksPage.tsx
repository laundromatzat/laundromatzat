import React, { useEffect, useMemo, useState } from 'react';
import PageMetadata from '../components/PageMetadata';

interface Bookmark {
  url: string;
  description: string;
  categories: string[];
}

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const SKELETON_COUNT = 6;

function LinksPage(): React.ReactNode {
  const [links, setLinks] = useState<Bookmark[]>([]);
  const [status, setStatus] = useState<LoadState>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLinks = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/data/links.json');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as unknown;
        if (!isMounted) {
          return;
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid links payload');
        }

        const parsedLinks: Bookmark[] = data
          .map(item => {
            if (typeof item !== 'object' || item === null) {
              return null;
            }

            const url = 'url' in item && typeof item.url === 'string' ? item.url.trim() : '';
            const description =
              'description' in item && typeof item.description === 'string'
                ? item.description.trim()
                : '';
            const rawCategories =
              'categories' in item && Array.isArray((item as { categories?: unknown }).categories)
                ? (item as { categories: unknown[] }).categories
                : [];

            const categories = rawCategories
              .map(category => (typeof category === 'string' ? category.trim() : ''))
              .filter(category => category.length > 0);

            if (!url || !description) {
              return null;
            }

            return { url, description, categories } satisfies Bookmark;
          })
          .filter((link): link is Bookmark => Boolean(link));

        setLinks(parsedLinks);
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

  const categories = useMemo(() => {
    const allCategories = links.flatMap(link => link.categories);
    return Array.from(new Set(allCategories)).sort((a, b) => a.localeCompare(b));
  }, [links]);

  const filteredLinks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return links.filter(link => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        link.description.toLowerCase().includes(normalizedSearch) ||
        link.url.toLowerCase().includes(normalizedSearch) ||
        link.categories.some(category => category.toLowerCase().includes(normalizedSearch));

      const matchesCategory = selectedCategory === null || link.categories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [links, searchTerm, selectedCategory]);

  const skeletonPlaceholders = useMemo(
    () =>
      Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="flex h-32 flex-col justify-between rounded-radius-md border border-brand-surface-highlight/30 bg-brand-secondary/40 p-4"
          aria-hidden="true"
        >
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-brand-surface-highlight/40" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-brand-surface-highlight/30" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="h-6 w-16 animate-pulse rounded-radius-sm bg-brand-surface-highlight/30" />
            <span className="h-6 w-12 animate-pulse rounded-radius-sm bg-brand-surface-highlight/20" />
          </div>
        </div>
      )),
    [],
  );

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

      <section className="space-y-space-4" aria-live="polite" aria-busy={status === 'loading'}>
        <div className="space-y-space-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-brand-text">Reading list &amp; resources</h2>
              <p className="text-sm text-brand-text-secondary">
                Filter by category or search for a specific tool, article, or experiment.
              </p>
            </div>
            <label className="flex w-full max-w-md flex-col text-sm font-medium text-brand-text md:text-right">
              <span className="sr-only">Search links</span>
              <input
                type="search"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search links or categories"
                className="w-full rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary/70 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/60"
              />
            </label>
          </div>

          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Link categories">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary ${
                  selectedCategory === null
                    ? 'border-brand-accent bg-brand-accent/20 text-brand-text'
                    : 'border-brand-surface-highlight/50 bg-brand-secondary/40 text-brand-text-secondary hover:border-brand-accent hover:text-brand-text'
                }`}
              >
                All
              </button>
              {categories.map(category => {
                const isSelected = category === selectedCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? null : category)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary ${
                      isSelected
                        ? 'border-brand-accent bg-brand-accent/20 text-brand-text'
                        : 'border-brand-surface-highlight/50 bg-brand-secondary/40 text-brand-text-secondary hover:border-brand-accent hover:text-brand-text'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

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
            : filteredLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full flex-col justify-between rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-4 py-3 text-left text-brand-text-secondary transition hover:border-brand-accent hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                >
                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-brand-text">{link.description}</span>
                    <span className="block break-all text-xs text-brand-text-secondary/80">{link.url}</span>
                  </div>
                  {link.categories.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {link.categories.map(category => (
                        <li key={`${link.url}-${category}`}>
                          <span className="inline-flex items-center rounded-full bg-brand-surface-highlight/30 px-2 py-1 text-xs font-medium text-brand-text-secondary">
                            {category}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="mt-3 inline-flex items-center rounded-full bg-brand-surface-highlight/20 px-2 py-1 text-xs font-medium text-brand-text-secondary/70">
                      Uncategorized
                    </span>
                  )}
                </a>
              ))}
        </div>

        {status === 'success' && filteredLinks.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">
            No links match your filters just yet. Try a different search term or category.
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default LinksPage;
