import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ColorPaletteTool from '../components/ColorPaletteTool';
import PageMetadata from '../components/PageMetadata';

interface Bookmark {
  url: string;
  description: string;
}

type LoadState = 'idle' | 'loading' | 'success' | 'error';

const SKELETON_COUNT = 6;

function LinksPage(): React.ReactNode {
  const [links, setLinks] = useState<Bookmark[]>([]);
  const [status, setStatus] = useState<LoadState>('idle');

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

        const rows = text.split('\n');
        const linksData = rows
          .slice(1)
          .map(row => row.trim())
          .filter(row => row.length > 0)
          .map(row => {
            const [url, ...descriptionParts] = row.split(',');
            return {
              url: url.trim(),
              description: descriptionParts.join(',').trim(),
            };
          })
          .filter(link => link.url && link.description);

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

      <section className="space-y-space-4" aria-label="Featured tools">
        <Link
          to="/links/background-removal"
          className="block rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/40 p-6 shadow-layer-1 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
        >
          <div className="flex flex-col gap-3 text-brand-text">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-text-secondary">New</span>
            <h2 className="text-2xl font-semibold">Remove a background</h2>
            <p className="text-brand-text-secondary">
              Launch the in-browser background removal tool to generate a transparent PNG that&apos;s ready to download in seconds.
            </p>
            <span className="text-sm font-medium text-brand-accent">Try the background removal tool</span>
          </div>
        </Link>

        <ColorPaletteTool />
      </section>

      <section className="space-y-space-3" aria-live="polite" aria-busy={status === 'loading'}>
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
            : links.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 px-4 py-3 text-left text-brand-text-secondary transition hover:border-brand-accent hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                >
                  <span className="block text-sm font-medium text-brand-text">{link.description}</span>
                  <span className="mt-1 block text-xs text-brand-text-secondary/80">Opens in a new tab</span>
                </a>
              ))}
        </div>
      </section>
    </div>
  );
}

export default LinksPage;
