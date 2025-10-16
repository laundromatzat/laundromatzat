import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import PageMetadata from '../components/PageMetadata';
import {
  BatchUpdateInput,
  BatchUpdateResponse,
  Subscriber,
  deleteSubscriber,
  fetchSubscribers,
  MailingListAdminError,
  sendBatchUpdate,
} from '../services/mailingListAdminClient';

interface FlashMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function AdminMailingListPage(): React.ReactNode {
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [subscriberError, setSubscriberError] = useState<string | null>(null);

  const [flash, setFlash] = useState<FlashMessage | null>(null);

  const [updateInput, setUpdateInput] = useState<BatchUpdateInput>({ subject: '', text: '', html: '' });
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<BatchUpdateResponse | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUnauthorized = useCallback((message?: string) => {
    setAdminKey(null);
    setAdminKeyInput('');
    setIsAuthenticating(false);
    setIsLoadingSubscribers(false);
    setIsSendingUpdate(false);
    setAuthError(message ?? 'The admin API key was rejected. Please try again.');
    setFlash(null);
    setSubscribers([]);
    setSubscriberError(null);
    setUpdateResult(null);
    setUpdateError(null);
    setUpdateInput({ subject: '', text: '', html: '' });
  }, []);

  useEffect(() => {
    if (!adminKey) {
      return;
    }

    let isActive = true;
    setIsLoadingSubscribers(true);
    setIsAuthenticating(true);
    setSubscriberError(null);

    fetchSubscribers(adminKey)
      .then(nextSubscribers => {
        if (!isActive) {
          return;
        }
        setSubscribers(nextSubscribers);
      })
      .catch(error => {
        if (!isActive) {
          return;
        }
        if (error instanceof MailingListAdminError && error.status === 401) {
          handleUnauthorized();
          return;
        }
        const message = error instanceof Error ? error.message : 'Unable to load subscribers.';
        setSubscriberError(message);
      })
      .finally(() => {
        if (isActive) {
          setIsAuthenticating(false);
          setIsLoadingSubscribers(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [adminKey, handleUnauthorized]);

  const handleAuthenticate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFlash(null);

    const trimmed = adminKeyInput.trim();
    if (!trimmed) {
      setAuthError('Enter the admin API key to continue.');
      return;
    }

    setAuthError(null);
    setIsAuthenticating(true);

    // Defer fetch until effect runs with the stored key to avoid duplicate calls.
    setAdminKey(trimmed);
  };

  const handleRefreshSubscribers = () => {
    if (!adminKey) {
      return;
    }

    setIsLoadingSubscribers(true);
    setSubscriberError(null);

    fetchSubscribers(adminKey)
      .then(nextSubscribers => {
        setSubscribers(nextSubscribers);
        setFlash({ type: 'info', message: 'Subscriber list refreshed.' });
      })
      .catch(error => {
        if (error instanceof MailingListAdminError && error.status === 401) {
          handleUnauthorized();
          return;
        }
        const message = error instanceof Error ? error.message : 'Unable to refresh subscribers.';
        setSubscriberError(message);
      })
      .finally(() => {
        setIsLoadingSubscribers(false);
      });
  };

  const handleDeleteSubscriber = (id: string) => {
    if (!adminKey) {
      return;
    }

    setFlash(null);
    setSubscriberError(null);

    deleteSubscriber(id, adminKey)
      .then(() => {
        setSubscribers(prev => prev.filter(subscriber => subscriber.id !== id));
        setFlash({ type: 'success', message: 'Subscriber removed.' });
      })
      .catch(error => {
        if (error instanceof MailingListAdminError && error.status === 401) {
          handleUnauthorized();
          return;
        }
        const message = error instanceof Error ? error.message : 'Unable to remove subscriber.';
        setSubscriberError(message);
      });
  };

  const handleUpdateChange = (field: keyof BatchUpdateInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setUpdateInput(prev => ({ ...prev, [field]: value }));
  };

  const handleSendUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminKey) {
      return;
    }

    setFlash(null);
    setUpdateError(null);
    setUpdateResult(null);

    const trimmedSubject = updateInput.subject.trim();
    const trimmedText = updateInput.text?.trim() ?? '';
    const trimmedHtml = updateInput.html?.trim() ?? '';

    if (!trimmedSubject) {
      setUpdateError('Enter a subject before sending.');
      return;
    }

    if (!trimmedText && !trimmedHtml) {
      setUpdateError('Add plain text or HTML content before sending.');
      return;
    }

    setIsSendingUpdate(true);

    const payload: BatchUpdateInput = {
      subject: trimmedSubject,
      text: trimmedText ? trimmedText : undefined,
      html: trimmedHtml ? trimmedHtml : undefined,
    };

    sendBatchUpdate(payload, adminKey)
      .then(result => {
        setUpdateResult(result);
        setFlash({
          type: 'success',
          message: `Update queued for ${result.recipientCount} recipient${result.recipientCount === 1 ? '' : 's'}.`,
        });
        setUpdateInput({ subject: '', text: '', html: '' });
      })
      .catch(error => {
        if (error instanceof MailingListAdminError && error.status === 401) {
          handleUnauthorized();
          return;
        }
        const message = error instanceof Error ? error.message : 'Unable to send update.';
        setUpdateError(message);
      })
      .finally(() => {
        setIsSendingUpdate(false);
      });
  };

  const hasUnlockedDashboard = Boolean(adminKey);
  const trimmedSubject = updateInput.subject.trim();
  const trimmedText = updateInput.text?.trim() ?? '';
  const trimmedHtml = updateInput.html?.trim() ?? '';
  const canSendUpdate = trimmedSubject.length > 0 && (trimmedText.length > 0 || trimmedHtml.length > 0);
  const sortedSubscribers = useMemo(
    () =>
      [...subscribers].sort((a, b) =>
        new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime(),
      ),
    [subscribers],
  );

  return (
    <div className="space-y-space-6">
      <PageMetadata
        title="Mailing list admin"
        description="Manage subscribers and send updates to the Laundromatzat mailing list."
        path="/admin/mailing-list"
        type="article"
      />

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text">Mailing list admin</h1>
        <p className="text-brand-text-secondary">
          Enter the admin API key to unlock subscriber management and batch update tools.
        </p>
      </header>

      {!hasUnlockedDashboard ? (
        <section
          aria-label="Admin authentication"
          className="max-w-xl space-y-space-4 rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/60 p-6 shadow-layer-1"
        >
          <form className="space-y-space-4" onSubmit={handleAuthenticate}>
            <div className="space-y-2">
              <label htmlFor="admin-key" className="text-sm font-medium text-brand-text">
                Admin API key
              </label>
              <input
                id="admin-key"
                name="admin-key"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-radius-md border border-brand-surface-highlight/60 bg-brand-primary px-3 py-2 text-brand-text shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                value={adminKeyInput}
                onChange={event => setAdminKeyInput(event.target.value)}
                placeholder="Enter the shared admin key"
              />
              {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-radius-md bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-on-accent shadow-layer-1 transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary"
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Unlocking…' : 'Unlock dashboard'}
            </button>
          </form>
        </section>
      ) : null}

      {hasUnlockedDashboard ? (
        <div className="space-y-space-6">
          {flash ? (
            <div
              role="status"
              className={
                flash.type === 'error'
                  ? 'rounded-radius-md border border-red-500/60 bg-red-950/40 p-4 text-sm text-red-200'
                  : flash.type === 'info'
                    ? 'rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/70 p-4 text-sm text-brand-text'
                    : 'rounded-radius-md border border-emerald-500/60 bg-emerald-950/30 p-4 text-sm text-emerald-100'
              }
            >
              {flash.message}
            </div>
          ) : null}

          <section className="space-y-space-4" aria-label="Subscriber management">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-semibold text-brand-text">Mailing list subscribers</h2>
              <button
                type="button"
                onClick={handleRefreshSubscribers}
                className="inline-flex items-center justify-center rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary px-4 py-2 text-sm font-medium text-brand-text transition hover:bg-brand-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary"
                disabled={isLoadingSubscribers}
              >
                {isLoadingSubscribers ? 'Refreshing…' : 'Refresh list'}
              </button>
            </div>

            {subscriberError ? <p className="text-sm text-red-400">{subscriberError}</p> : null}

            {isLoadingSubscribers && sortedSubscribers.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">Loading subscribers…</p>
            ) : null}

            {sortedSubscribers.length > 0 ? (
              <div className="overflow-x-auto rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/40 shadow-inner">
                <table className="min-w-full divide-y divide-brand-surface-highlight/60">
                  <thead className="bg-brand-secondary/70 text-left text-sm uppercase tracking-[0.2em] text-brand-text-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3">Email</th>
                      <th scope="col" className="px-4 py-3">Name</th>
                      <th scope="col" className="px-4 py-3">Subscribed</th>
                      <th scope="col" className="px-4 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-surface-highlight/40 text-sm">
                    {sortedSubscribers.map(subscriber => (
                      <tr key={subscriber.id}>
                        <td className="px-4 py-3 font-medium">{subscriber.email}</td>
                        <td className="px-4 py-3 text-brand-text-secondary">{subscriber.name ?? '—'}</td>
                        <td className="px-4 py-3 text-brand-text-secondary">{formatDate(subscriber.subscribedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-radius-md border border-brand-surface-highlight/60 bg-brand-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-secondary transition hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                            onClick={() => handleDeleteSubscriber(subscriber.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {!isLoadingSubscribers && sortedSubscribers.length === 0 && !subscriberError ? (
              <p className="text-sm text-brand-text-secondary">No subscribers yet. Share the public subscribe form to grow the list.</p>
            ) : null}
          </section>

          <section
            aria-label="Send batch update"
            className="space-y-space-4 rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/40 p-6 shadow-layer-1"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-brand-text">Send a batch update</h2>
              <p className="text-sm text-brand-text-secondary">
                Craft a subject and include either plain text, HTML, or both. Messages are BCC’d to all current subscribers.
              </p>
            </div>

            {updateError ? <p className="text-sm text-red-400">{updateError}</p> : null}

            <form className="space-y-space-4" onSubmit={handleSendUpdate}>
              <div className="space-y-2">
                <label htmlFor="update-subject" className="text-sm font-medium text-brand-text">
                  Subject
                </label>
                <input
                  id="update-subject"
                  name="update-subject"
                  type="text"
                  required
                  maxLength={200}
                  value={updateInput.subject}
                  onChange={handleUpdateChange('subject')}
                  className="w-full rounded-radius-md border border-brand-surface-highlight/60 bg-brand-primary px-3 py-2 text-brand-text shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="update-text" className="text-sm font-medium text-brand-text">
                    Plain text body
                  </label>
                  <textarea
                    id="update-text"
                    name="update-text"
                    rows={6}
                    value={updateInput.text ?? ''}
                    onChange={handleUpdateChange('text')}
                    className="h-full w-full rounded-radius-md border border-brand-surface-highlight/60 bg-brand-primary px-3 py-2 text-brand-text shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                    placeholder="Share studio news, upcoming releases, or links."
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="update-html" className="text-sm font-medium text-brand-text">
                    HTML body
                  </label>
                  <textarea
                    id="update-html"
                    name="update-html"
                    rows={6}
                    value={updateInput.html ?? ''}
                    onChange={handleUpdateChange('html')}
                    className="h-full w-full rounded-radius-md border border-brand-surface-highlight/60 bg-brand-primary px-3 py-2 text-brand-text shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                    placeholder="Optional HTML version. Ensure inline styles for consistent rendering."
                  />
                </div>
              </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-radius-md bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-on-accent shadow-layer-1 transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSendingUpdate || !canSendUpdate}
            >
              {isSendingUpdate ? 'Sending…' : 'Send update'}
            </button>
            </form>

            {updateResult ? (
              <div className="space-y-1 rounded-radius-md border border-brand-surface-highlight/60 bg-brand-primary/40 p-4 text-xs text-brand-text-secondary">
                <p>
                  <strong className="font-semibold text-brand-text">Queued recipients:</strong> {updateResult.recipientCount}
                </p>
                {updateResult.messageId ? (
                  <p>
                    <strong className="font-semibold text-brand-text">Message ID:</strong> {updateResult.messageId}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default AdminMailingListPage;
