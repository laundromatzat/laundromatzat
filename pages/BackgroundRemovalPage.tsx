import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { removeBackground } from '@imgly/background-removal';
import PageMetadata from '../components/PageMetadata';
import {
  clearBackgroundRemovalJobs,
  loadBackgroundRemovalJobs,
  persistBackgroundRemovalJob,
} from '../services/backgroundRemovalStorage';

type ProcessingState = 'idle' | 'loading' | 'success' | 'error';

type StatusMessage = {
  label: string;
  tone: 'default' | 'success' | 'error';
};

const downloadFilename = 'laundromatzat-background-removed.png';

const buildDownloadFilename = (fileName: string): string => {
  const baseName = fileName.replace(/\.[^/.]+$/, '').trim();
  if (!baseName) {
    return downloadFilename;
  }
  return `${baseName}-background-removed.png`;
};

type BackgroundRemovalJob = {
  id: string;
  fileName: string;
  sourcePreview: string;
  resultPreview: string | null;
  processingState: ProcessingState;
  statusMessage: StatusMessage;
  progressMessage: string | null;
  createdAt: number;
};

const statusToneClasses: Record<StatusMessage['tone'], string> = {
  default: 'border-brand-surface-highlight/60 bg-brand-secondary/40 text-brand-text-secondary',
  success: 'border-status-success-text/40 bg-status-success-bg text-status-success-text',
  error: 'border-status-error-text/40 bg-status-error-bg text-status-error-text',
};

function BackgroundRemovalPage(): React.ReactNode {
  const [jobs, setJobs] = useState<BackgroundRemovalJob[]>([]);
  const urlRegistry = useRef<Set<string>>(new Set());

  const registerUrl = useCallback((url: string) => {
    urlRegistry.current.add(url);
  }, []);

  const cleanupAllUrls = useCallback(() => {
    urlRegistry.current.forEach(storedUrl => {
      URL.revokeObjectURL(storedUrl);
    });
    urlRegistry.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      cleanupAllUrls();
    };
  }, [cleanupAllUrls]);

  const processFile = useCallback(
    async (jobId: string, file: File, createdAt: number) => {
      try {
        const blob = await removeBackground(file, {
          progress: (key, current, total) => {
            const percent = total > 0 ? Math.round((current / total) * 100) : 0;
            const progressLabel = `${key.replace(/_/g, ' ')} ${percent}%`;
            setJobs(previousJobs =>
              previousJobs.map(job =>
                job.id === jobId
                  ? {
                      ...job,
                      progressMessage: progressLabel,
                    }
                  : job,
              ),
            );
          },
        });

        const resultUrl = URL.createObjectURL(blob);
        registerUrl(resultUrl);

        setJobs(previousJobs =>
          previousJobs.map(job =>
            job.id === jobId
              ? {
                  ...job,
                  resultPreview: resultUrl,
                  processingState: 'success',
                  statusMessage: {
                    label: 'Background removed! Download the PNG below.',
                    tone: 'success',
                  },
                  progressMessage: null,
                }
              : job,
          ),
        );

        const sourceBlob = file.slice(0, file.size, file.type);

        try {
          await persistBackgroundRemovalJob({
            id: jobId,
            fileName: file.name,
            createdAt,
            sourceBlob,
            resultBlob: blob,
          });
        } catch (storageError) {
          console.warn('Failed to persist background removal result', storageError);
        }
      } catch (error) {
        console.error('Background removal failed', error);
        setJobs(previousJobs =>
          previousJobs.map(job =>
            job.id === jobId
              ? {
                  ...job,
                  processingState: 'error',
                  statusMessage: {
                    label: 'Something went wrong while processing the photo. Please try another image.',
                    tone: 'error',
                  },
                  progressMessage: null,
                }
              : job,
          ),
        );
      }
    },
    [registerUrl],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files ?? []);
      if (fileArray.length === 0) {
        return;
      }

      const jobsToAdd = fileArray.map(file => {
        const sourcePreview = URL.createObjectURL(file);
        registerUrl(sourcePreview);

        return {
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 10)}`,
          fileName: file.name,
          sourcePreview,
          resultPreview: null,
          processingState: 'loading' as ProcessingState,
          statusMessage: { label: 'Preparing your photo…', tone: 'default' as const },
          progressMessage: null,
          createdAt: Date.now(),
        } satisfies BackgroundRemovalJob;
      });

      setJobs(previousJobs => [...previousJobs, ...jobsToAdd]);

      jobsToAdd.forEach((job, index) => {
        const file = fileArray[index];
        void processFile(job.id, file, job.createdAt);
      });
    },
    [processFile, registerUrl],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      event.target.value = '';
    },
    [handleFiles],
  );

  const dropHandlers = useMemo(() => {
    const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const { files } = event.dataTransfer;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    };

    const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
    };

    return { onDrop, onDragOver };
  }, [handleFiles]);

  const clearAll = useCallback(() => {
    cleanupAllUrls();
    setJobs([]);
    void clearBackgroundRemovalJobs().catch(error => {
      console.warn('Failed to clear stored background removal jobs', error);
    });
  }, [cleanupAllUrls]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const storedJobs = await loadBackgroundRemovalJobs();
        if (!isMounted || storedJobs.length === 0) {
          return;
        }

        const restoredJobs = storedJobs
          .map(storedJob => {
            const sourcePreview = URL.createObjectURL(storedJob.sourceBlob);
            registerUrl(sourcePreview);

            const resultPreview = storedJob.resultBlob ? URL.createObjectURL(storedJob.resultBlob) : null;
            if (resultPreview) {
              registerUrl(resultPreview);
            }

            return {
              id: storedJob.id,
              fileName: storedJob.fileName,
              sourcePreview,
              resultPreview,
              processingState: resultPreview ? ('success' as ProcessingState) : ('idle' as ProcessingState),
              statusMessage: resultPreview
                ? ({
                    label: 'Background removed! Download the PNG below.',
                    tone: 'success' as const,
                  } satisfies StatusMessage)
                : ({
                    label: 'Preparing your photo…',
                    tone: 'default' as const,
                  } satisfies StatusMessage),
              progressMessage: null,
              createdAt: storedJob.createdAt,
            } satisfies BackgroundRemovalJob;
          })
          .sort((a, b) => a.createdAt - b.createdAt);

        setJobs(previousJobs => {
          const existingIds = new Set(previousJobs.map(job => job.id));
          const mergedJobs = [...previousJobs];

          restoredJobs.forEach(restoredJob => {
            if (!existingIds.has(restoredJob.id)) {
              mergedJobs.push(restoredJob);
            }
          });

          return mergedJobs.sort((a, b) => a.createdAt - b.createdAt);
        });
      } catch (error) {
        console.error('Failed to restore stored background removal jobs', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [registerUrl]);

  return (
    <div className="space-y-10">
      <PageMetadata
        title="Background removal tool"
        description="Upload photos and quickly export transparent PNGs generated entirely in the browser."
        path="/links/background-removal"
        type="article"
      />
      <section className="space-y-4">
        <div className="flex items-center gap-4 text-brand-text-secondary">
          <Link to="/links" className="text-brand-accent hover:underline">
            ← back to links
          </Link>
          <span className="text-sm">remove backgrounds right in the browser.</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text">background remover</h1>
        <p className="text-lg text-brand-text-secondary max-w-2xl">
          Upload one or many photos and our in-browser model will isolate the main subject. You&apos;ll get transparent PNGs you can drop into decks, composites, or anything else that needs a clean cutout.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
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
              multiple
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm uppercase tracking-wide">drop or click</span>
              <span className="text-2xl font-semibold text-brand-text">your photos</span>
            </div>
            <p className="max-w-xs text-sm text-brand-text-secondary">
              PNG and JPEG work best. Add as many as you like — everything stays in the browser.
            </p>
          </label>

          {jobs.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center justify-center rounded-md border border-brand-secondary/60 bg-brand-secondary/10 px-4 py-2 text-sm font-medium text-brand-text-secondary transition-colors hover:border-brand-accent hover:bg-brand-secondary/20 hover:text-brand-text"
            >
              clear all photos
            </button>
          )}
        </div>

        <div className="space-y-10">
          {jobs.length === 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-secondary">original</h2>
                <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
                  <span className="text-sm text-brand-text-secondary">no photos yet — add some to get started.</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text-secondary">background removed</h2>
                <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
                  <span className="text-sm text-brand-text-secondary">your processed previews will appear here.</span>
                </div>
              </div>
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="grid gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-text-secondary">original</h2>
                    <span className="truncate text-xs font-medium text-brand-text-secondary/80" title={job.fileName}>
                      {job.fileName}
                    </span>
                  </div>
                  <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
                    <img src={job.sourcePreview} alt={`Uploaded ${job.fileName}`} className="max-h-full max-w-full object-contain" />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
                  <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${statusToneClasses[job.statusMessage.tone]}`}>
                    {job.statusMessage.label}
                    {job.progressMessage && (
                      <span className="mt-1 block text-xs opacity-80">{job.progressMessage}</span>
                    )}
                  </div>
                  <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
                    {job.processingState === 'loading' && (
                      <span className="text-sm text-brand-text-secondary">processing… this can take a moment the first time.</span>
                    )}
                    {job.processingState === 'success' && job.resultPreview && (
                      <img
                        src={job.resultPreview}
                        alt={`Background removed result for ${job.fileName}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                    {job.processingState === 'error' && (
                      <span className="text-sm text-rose-200">we couldn&apos;t process that image. try another one?</span>
                    )}
                  </div>
                  {job.processingState === 'success' && job.resultPreview && (
                    <a
                      href={job.resultPreview}
                      download={buildDownloadFilename(job.fileName)}
                      className="mt-4 inline-flex items-center justify-center rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-primary shadow-lg transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-primary"
                    >
                      download png
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default BackgroundRemovalPage;
