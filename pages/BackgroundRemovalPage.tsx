import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { removeBackground } from '@imgly/background-removal';

type ProcessingState = 'idle' | 'loading' | 'success' | 'error';

type StatusMessage = {
  label: string;
  tone: 'default' | 'success' | 'error';
};

const downloadFilename = 'laundromatzat-background-removed.png';

function BackgroundRemovalPage(): React.ReactNode {
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProcessingState('idle');
    setStatusMessage(null);
    setProgressMessage(null);
    setResultPreview(prev => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setSourcePreview(prev => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  const showStatus = useCallback((label: string, tone: StatusMessage['tone'] = 'default') => {
    setStatusMessage({ label, tone });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    reset();
    const previewUrl = URL.createObjectURL(file);
    setSourcePreview(previewUrl);
    setProcessingState('loading');
    showStatus('Preparing your photo…');

    try {
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const percent = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgressMessage(`${key.replace(/_/g, ' ')} ${percent}%`);
        },
      });

      const resultUrl = URL.createObjectURL(blob);
      setResultPreview(resultUrl);
      setProcessingState('success');
      showStatus('Background removed! Download the PNG below.', 'success');
      setProgressMessage(null);
    } catch (error) {
      console.error('Background removal failed', error);
      setProcessingState('error');
      showStatus('Something went wrong while processing the photo. Please try another image.', 'error');
      setProgressMessage(null);
    }
  }, [reset, showStatus]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleFile(file);
      }
      event.target.value = '';
    },
    [handleFile],
  );

  const dropHandlers = useMemo(() => {
    const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) {
        void handleFile(file);
      }
    };

    const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
    };

    return { onDrop, onDragOver };
  }, [handleFile]);

  const downloadLink = useMemo(() => {
    if (!resultPreview) {
      return null;
    }

    return (
      <a
        href={resultPreview}
        download={downloadFilename}
        className="inline-flex items-center justify-center rounded-md bg-brand-accent px-4 py-2 font-medium text-brand-primary shadow-lg transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-primary"
      >
        download png
      </a>
    );
  }, [resultPreview]);

  useEffect(() => {
    return () => {
      if (sourcePreview) {
        URL.revokeObjectURL(sourcePreview);
      }
    };
  }, [sourcePreview]);

  useEffect(() => {
    return () => {
      if (resultPreview) {
        URL.revokeObjectURL(resultPreview);
      }
    };
  }, [resultPreview]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center gap-4 text-brand-text-secondary">
          <Link to="/links" className="text-brand-accent hover:underline">
            ← back to links
          </Link>
          <span className="text-sm">remove backgrounds right in the browser.</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text">background remover</h1>
        <p className="text-lg text-brand-text-secondary max-w-2xl">
          Upload a photo and our in-browser model will isolate the main subject. You&apos;ll get a transparent PNG you can drop into decks, composites, or anything else that needs a clean cutout.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <label
            htmlFor="background-remover-input"
            className="flex h-60 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-brand-secondary/60 bg-brand-secondary/20 p-6 text-center text-brand-text-secondary transition-colors hover:border-brand-accent hover:text-brand-text"
            {...dropHandlers}
          >
            <input
              id="background-remover-input"
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm uppercase tracking-wide">drop or click</span>
              <span className="text-2xl font-semibold text-brand-text">your photo</span>
            </div>
            <p className="max-w-xs text-sm text-brand-text-secondary">
              PNG and JPEG work best. We keep everything in the browser, so nothing ever leaves this page.
            </p>
          </label>

          {statusMessage && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                statusMessage.tone === 'success'
                  ? 'border-emerald-300/60 bg-emerald-400/10 text-emerald-200'
                  : statusMessage.tone === 'error'
                    ? 'border-rose-300/60 bg-rose-400/10 text-rose-200'
                    : 'border-brand-secondary/60 bg-brand-secondary/20 text-brand-text-secondary'
              }`}
            >
              {statusMessage.label}
              {progressMessage && (
                <span className="mt-1 block text-xs opacity-80">{progressMessage}</span>
              )}
            </div>
          )}

          {processingState === 'success' && downloadLink}
        </div>

        <div className="grid gap-6">
          <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-secondary">original</h2>
            <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
              {sourcePreview ? (
                <img src={sourcePreview} alt="Uploaded" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-sm text-brand-text-secondary">no image yet</span>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-secondary">background removed</h2>
            <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
              {processingState === 'loading' && (
                <span className="text-sm text-brand-text-secondary">processing… this can take a moment the first time.</span>
              )}
              {processingState === 'success' && resultPreview && (
                <img src={resultPreview} alt="Background removed result" className="max-h-full max-w-full object-contain" />
              )}
              {processingState === 'idle' && !resultPreview && (
                <span className="text-sm text-brand-text-secondary">result preview will show here</span>
              )}
              {processingState === 'error' && (
                <span className="text-sm text-rose-200">we couldn&apos;t process that image. try another one?</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BackgroundRemovalPage;
