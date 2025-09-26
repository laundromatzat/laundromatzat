import React, { FormEvent, useId, useState } from 'react';
import { subscribeToMailingList } from '../services/mailingListClient';

function MailingListSignup(): React.ReactNode {
  const emailId = useId();
  const nameId = useId();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      await subscribeToMailingList({
        email,
        name: name.trim() ? name.trim() : undefined,
      });

      setStatus('success');
      setMessage('Success! You are on the list. Watch your inbox for the next drop.');
      setEmail('');
      setName('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to join the list right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || email.trim().length === 0;

  return (
    <section className="bg-brand-surface/80 border border-brand-surface-highlight rounded-lg shadow-md p-4 sm:p-6 space-y-4 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-brand-text mb-1">stay in the loop</h2>
        <p className="text-sm sm:text-base text-brand-text-secondary max-w-xl">
          Join the laundromat list for new drops, behind-the-scenes experiments, and invites to upcoming collabs.
          Your address only gets used for updates from this site.
        </p>
      </div>

      <form className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-brand-text" htmlFor={emailId}>
              email
            </label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-md border border-brand-surface-highlight bg-brand-primary/60 px-3 py-2.5 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-brand-text" htmlFor={nameId}>
              name <span className="text-brand-text-tertiary">(optional)</span>
            </label>
            <input
              id={nameId}
              type="text"
              autoComplete="name"
              value={name}
              onChange={event => setName(event.target.value)}
              className="w-full rounded-md border border-brand-surface-highlight bg-brand-primary/60 px-3 py-2.5 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="laundromatzat superfan"
              maxLength={120}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="sm:col-start-2 inline-flex justify-center items-center gap-2 rounded-md bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'saving…' : 'join the list'}
        </button>
      </form>

      <ul className="text-xs sm:text-sm text-brand-text-tertiary grid gap-1 sm:grid-cols-3 sm:gap-2">
        <li className="flex items-start gap-1">
          <span aria-hidden="true">•</span>
          <span>Your info is encrypted in transit and stored securely on our server.</span>
        </li>
        <li className="flex items-start gap-1">
          <span aria-hidden="true">•</span>
          <span>Unsubscribe anytime with a single reply or by contacting the team.</span>
        </li>
        <li className="flex items-start gap-1">
          <span aria-hidden="true">•</span>
          <span>Batch announcements are BCC&apos;d so addresses stay private.</span>
        </li>
      </ul>

      {status !== 'idle' ? (
        <div
          role="status"
          className={`rounded-md border px-3 py-2.5 text-sm font-semibold ${
            status === 'success'
              ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200'
              : 'border-rose-400/60 bg-rose-400/10 text-rose-200'
          }`}
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}

export default MailingListSignup;
