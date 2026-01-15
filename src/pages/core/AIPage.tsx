import React from 'react';
import { Link } from 'react-router-dom';
import PageMetadata from '../components/PageMetadata';
import aiApps from '../data/ai-apps.json';

function AIAppsPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <PageMetadata
        title="AI Apps"
        description="A collection of AI-powered applications."
        path="/ai-apps"
      />
      <header className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-brand-text">
          AI Apps
        </h1>
        <p className="mx-auto max-w-2xl text-base text-brand-text-secondary">
          A collection of AI-powered applications.
        </p>
      </header>
      <div className="space-y-4">
        {aiApps.map((app) => (
          <Link to={app.url} key={app.id} className="block p-4 border rounded-lg hover:bg-gray-100">
            <h2 className="text-xl font-bold">{app.title}</h2>
            <p>{app.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AIAppsPage;
