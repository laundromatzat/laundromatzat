import React from 'react';
import { Link } from 'react-router-dom';
import PageMetadata from '../components/PageMetadata';

function NotFoundPage(): React.ReactNode {
  return (
    <div className="space-y-8 text-center">
      <PageMetadata
        title="Page not found"
        description="The page you are looking for could not be found on laundromatzat.com."
        path="/404"
      />
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-text-secondary">404</p>
        <h1 className="text-3xl font-bold text-brand-text">Page not found</h1>
        <p className="mx-auto max-w-xl text-brand-text-secondary">
          The URL you tried doesn&apos;t exist. Check the address for typos or head back to the homepage to continue exploring the
          portfolio.
        </p>
        <div className="flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center rounded-radius-lg bg-brand-accent px-space-4 py-space-3 text-sm font-semibold text-brand-on-accent transition hover:bg-brand-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            Return home
          </Link>
        </div>
      </section>
    </div>
  );
}

export default NotFoundPage;
