import React from 'react';
import PageMetadata from '../components/PageMetadata';

function AdminMailingListPage(): React.ReactNode {
  return (
    <div className="space-y-space-6">
      <PageMetadata
        title="Mailing list admin"
        description="Manage subscribers and send updates to the Laundromatzat mailing list."
        path="/admin/mailing-list"
        type="article"
      />

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-aura-text-primary">Mailing list admin</h1>
        <p className="text-aura-text-secondary">
          This feature has been disabled in the simplified static version of the site.
        </p>
      </header>

      <div className="rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/60 p-6 shadow-layer-1">
        <p className="text-aura-text-primary">
          The backend server has been removed to simplify the architecture.
          Mailing list management is no longer available in this version.
        </p>
      </div>
    </div>
  );
}

export default AdminMailingListPage;
