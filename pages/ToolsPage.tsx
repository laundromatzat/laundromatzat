import React from 'react';
import { Link } from 'react-router-dom';
import PageMetadata from '../components/PageMetadata';

const TOOL_LINKS = [
  {
    to: '/tools/background-removal',
    ariaLabel: 'Remove a background',
    title: 'Remove a background',
    description: "Launch the in-browser background removal tool to generate a transparent PNG that's ready to download in seconds.",
    cta: 'Try the background removal tool',
    badge: 'Core tool',
  },
  {
    to: '/tools/color-palette',
    ariaLabel: 'Extract a color palette',
    title: 'Extract a color palette',
    description: 'Upload an image and instantly generate a five-color palette with copy-ready values.',
    cta: 'Try the color palette tool',
    badge: 'Core tool',
  },
  {
    to: '/tools/nylon-fabric-designer',
    ariaLabel: 'Nylon Fabric Designer Service',
    title: 'Nylon Fabric Designer Service',
    description:
      'Generate custom sewing plans, cutting templates, and visual previews for nylon projects like stuff sacks, pouches, and aprons.',
    cta: 'Open the nylon designer',
    badge: 'New service',
  },
  {
    to: '/tools/intelligent-ideas-board',
    ariaLabel: 'Intelligent Ideas Service',
    title: 'Intelligent Ideas Service',
    description:
      'Brain-dump thoughts, todos, and notes—then let the assistant cluster, prioritize, and summarize everything for you.',
    cta: 'Open the intelligent ideas board',
    badge: 'New service',
  },
];

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
        {TOOL_LINKS.map(tool => (
          <Link
            key={tool.to}
            to={tool.to}
            aria-label={tool.ariaLabel}
            className="block rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/40 p-6 shadow-layer-1 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            <div className="flex flex-col gap-3 text-brand-text">
              {tool.badge ? (
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-text-secondary">
                  {tool.badge}
                </span>
              ) : null}
              <h2 className="text-2xl font-semibold">{tool.title}</h2>
              <p className="text-brand-text-secondary">{tool.description}</p>
              <span className="text-sm font-medium text-brand-accent">{tool.cta}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default ToolsPage;
