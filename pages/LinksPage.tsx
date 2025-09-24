import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Bookmark {
  url: string;
  description: string;
}

function LinksPage(): React.ReactNode {
  const [links, setLinks] = useState<Bookmark[]>([]);

  useEffect(() => {
    fetch('/data/links.csv')
      .then(response => response.text())
      .then(text => {
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
      })
      .catch(error => {
        console.error('Failed to load links', error);
      });
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-2">links</h1>
        <p className="text-lg text-brand-text-secondary">a collection of bookmarks.</p>
      </section>
      <section className="space-y-6">
        <Link
          to="/links/background-removal"
          className="block rounded-2xl border border-brand-secondary/60 bg-brand-secondary/20 p-6 shadow-sm transition-transform duration-150 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex flex-col gap-3 text-brand-text">
            <span className="text-xs uppercase tracking-[0.2em] text-brand-text-secondary">new</span>
            <h2 className="text-2xl font-semibold">remove a background</h2>
            <p className="text-brand-text-secondary">
              Try our in-browser background remover to turn any portrait or product photo into a transparent PNG ready for download.
            </p>
            <span className="text-sm font-medium text-brand-accent">open tool →</span>
          </div>
        </Link>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 px-4 py-3 text-brand-text-secondary transition-colors hover:border-brand-accent hover:text-brand-text"
            >
              {link.description}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default LinksPage;
