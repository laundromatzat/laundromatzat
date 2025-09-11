import React, { useEffect, useState } from 'react';

interface Link {
  url: string;
  description: string;
}

function LinksPage(): React.ReactNode {
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    fetch('/data/links.csv')
      .then(response => response.text())
      .then(text => {
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        const linksData = rows.slice(1).map(row => {
          const values = row.split(',');
          return {
            url: values[0],
            description: values[1]
          };
        });
        setLinks(linksData);
      });
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-2">links</h1>
        <p className="text-lg text-brand-text-secondary">a collection of bookmarks.</p>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {links.map(link => (
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-brand-text-secondary hover:text-brand-text">
            {link.description}
          </a>
        ))}
      </div>
    </div>
  );
}

export default LinksPage;
