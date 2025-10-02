import React, { FormEvent, useId, useState } from 'react';
import clsx from 'clsx';
import { subscribeToMailingList } from '../services/mailingListClient';

function MailingListSignup(): React.ReactNode {
  const emailId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      await subscribeToMailingList({
        email: email.trim(),
        name: name.trim() ? name.trim() : undefined,
      });

      setStatus('success');
      setMessage('You are on the list. Expect a monthly roundup of new work and tools.');
      setEmail('');
      setName('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to join the newsletter right now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || email.trim().length === 0;
  const statusRole = status === 'success' ? 'status' : 'alert';

  return (
    <section
      aria-labelledby={descriptionId}
      className="rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/60 p-6 shadow-layer-1"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="space-y-2 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-text-secondary">Newsletter</p>
          <h2 id={descriptionId} className="text-2xl font-semibold text-brand-text">
            Stay in the loop
          </h2>
          <p className="text-sm text-brand-text-secondary">
            Get one email per month featuring new films, photos, and creative experiments. No spam, unsubscribe anytime.
          </p>
        </div>

        <form
          className="grid gap-4 sm:grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(13rem,auto)] md:items-end md:gap-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="space-y-1">
            <label htmlFor={emailId} className="text-sm font-medium text-brand-text">
              Email address
            </label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-radius-md border border-brand-surface-highlight/60 bg-brand-primary/60 px-3 py-3 text-brand-text placeholder:text-brand-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
            />
            <p className="text-xs text-brand-text-secondary">We&apos;ll never share your email address.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor={nameId} className="text-sm font-medium text-brand-text">
              Name <span className="text-brand-text-secondary">(optional)</span>
            </label>
            <input
              id={nameId}
              type="text"
              autoComplete="name"
              value={name}
              maxLength={120}
              onChange={event => setName(event.target.value)}
              className="w-full rounded-radius-md border border-brand-surface-highlight/60 bg-brand-primary/60 px-3 py-3 text-brand-text placeholder:text-brand-text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
            />
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="inline-flex h-12 w-full items-center justify-center rounded-radius-md bg-brand-accent px-space-4 text-sm font-semibold text-brand-on-accent transition hover:bg-brand-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:justify-self-end md:px-6"
          >
            {isSubmitting ? 'Joining…' : 'Join the newsletter'}
          </button>
        </form>

        <div aria-live="polite" aria-atomic="true" id={statusId} className="sr-only">
          {status !== 'idle' ? message : 'No newsletter status to announce.'}
        </div>

        {status !== 'idle' ? (
          <div
            role={statusRole}
            className={clsx(
              'rounded-radius-md border px-4 py-3 text-sm font-medium',
              status === 'success'
                ? 'border-status-success-text/40 bg-status-success-bg text-status-success-text'
                : 'border-status-error-text/40 bg-status-error-bg text-status-error-text',
            )}
          >
            {message}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default MailingListSignup;
