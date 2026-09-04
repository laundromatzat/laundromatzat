import React from "react";
import { Link } from "react-router-dom";
import PageMetadata from "@/components/PageMetadata";

function NotFoundPage(): React.ReactNode {
  return (
    <div className="space-y-8 py-24 text-center">
      <PageMetadata
        title="Page not found"
        description="The page you are looking for could not be found on laundromatzat.com."
        path="/404"
      />
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-aura-text-secondary">
          404
        </p>
        <h1 className="text-3xl font-bold text-aura-text-primary">
          Page not found
        </h1>
        <p className="mx-auto max-w-xl text-aura-text-secondary">
          The URL you tried doesn&apos;t exist. Check the address for typos, or
          head back to the video library.
        </p>
        <div className="flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-aura-text-primary px-6 py-3 text-sm font-semibold text-aura-bg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-text-primary/60 focus-visible:ring-offset-2"
          >
            Back to the videos
          </Link>
        </div>
      </section>
    </div>
  );
}

export default NotFoundPage;
