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
  const [isMinimized, setIsMinimized] = useState(false);

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
    <section className="bg-brand-surface/60 border border-brand-surface-highlight/50 rounded-sm shadow-sm p-2 sm:p-3 space-y-1 animate-fade-in text-xs">
      <div className="flex justify-end -mt-2 -mb-2">
        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-xxs text-brand-text-secondary hover:text-brand-text"
        >
          <span aria-hidden="true">{isMinimized ? '◂' : '▾'}</span>
        </button>
      </div>

      {!isMinimized && (
        <>
          <div>
            <h2 className="text-xxs font-extralight text-brand-text mt-1.5 mb-1.5 ml-1">stay in the loop - SUBSCRIBE TO UPDATES!</h2>
          </div>

          <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={handleSubmit} noValidate>
            <div className="space-y-0.5">
              <input
                id={emailId}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full rounded-md border border-brand-surface-highlight bg-brand-primary/60 px-2 py-1.5 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="email"
              />
            </div>

            <div className="space-y-0.5">
              <input
                id={nameId}
                type="text"
                autoComplete="name"
                value={name}
                onChange={event => setName(event.target.value)}
                className="w-full rounded-md border border-brand-surface-highlight bg-brand-primary/60 px-2 py-1.5 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="name (optional)"
                maxLength={120}
              />
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              className="sm:col-start-3 inline-flex justify-center items-center gap-1 rounded bg-brand-accent/80 px-3 py-1.5 text-xs font-medium text-brand-primary transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'saving…' : 'join the list'}
            </button>
          </form>

          {status !== 'idle' ? (
            <div
              role="status"
              className={`rounded-md border px-3 py-2.5 text-xs font-semibold ${
                status === 'success'
                  ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200'
                  : 'border-rose-400/60 bg-rose-400/10 text-rose-200'
              }`}
            >
              {message}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export default MailingListSignup;
