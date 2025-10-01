import React from 'react';
import { Link } from 'react-router-dom';
import PageMetadata from '../components/PageMetadata';

function ToolsPage(): React.ReactNode {
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

      <section className="space-y-space-4" aria-label="Featured tools">
        <Link
          to="/tools/background-removal"
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

                <Link
          to="/tools/color-palette"
          className="block rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/40 p-6 shadow-layer-1 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
        >
          <div className="flex flex-col gap-3 text-brand-text">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-text-secondary">New</span>
            <h2 className="text-2xl font-semibold">Extract a color palette</h2>
            <p className="text-brand-text-secondary">
              Upload an image and instantly generate a five-color palette with copy-ready values.
            </p>
            <span className="text-sm font-medium text-brand-accent">Try the color palette tool</span>
          </div>
        </Link>
      </section>
    </div>
  );
}

export default ToolsPage;