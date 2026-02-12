import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { removeBackground } from "@imgly/background-removal";
import PageMetadata from "@/components/PageMetadata";
import Container from "@/components/Container";
import {
  saveJob,
  type BackgroundRemovalJob as ApiJob,
} from "@/services/backgroundRemovalApi";
import { DesignGallery, SortOption } from "@/components/DesignGallery";
import { ClockIcon } from "@heroicons/react/24/outline";

type ProcessingState = "idle" | "loading" | "success" | "error";

type StatusMessage = {
  label: string;
  tone: "default" | "success" | "error";
};

const downloadFilename = "laundromatzat-background-removed.png";

const buildDownloadFilename = (fileName: string): string => {
  const baseName = fileName.replace(/\.[^/.]+$/, "").trim();
  return baseName ? `${baseName}-background-removed.png` : downloadFilename;
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

const statusToneClasses: Record<StatusMessage["tone"], string> = {
  default:
    "border-brand-surface-highlight/60 bg-brand-secondary/40 text-brand-text-secondary",
  success:
    "border-status-success-text/40 bg-status-success-bg text-status-success-text",
  error:
    "border-status-error-text/40 bg-status-error-bg text-status-error-text",
};

function BackgroundRemovalPage(): React.ReactNode {
  const [jobs, setJobs] = useState<BackgroundRemovalJob[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const urlRegistry = useRef<Set<string>>(new Set());

  const registerUrl = useCallback((url: string) => {
    urlRegistry.current.add(url);
  }, []);

  const cleanupAllUrls = useCallback(() => {
    urlRegistry.current.forEach((storedUrl) => URL.revokeObjectURL(storedUrl));
    urlRegistry.current.clear();
  }, []);

  useEffect(() => () => cleanupAllUrls(), [cleanupAllUrls]);

  const processFile = useCallback(
    async (targetJob: BackgroundRemovalJob, file: File) => {
      try {
        const blob = await removeBackground(file, {
          progress: (key, current, total) => {
            const percent = total > 0 ? Math.round((current / total) * 100) : 0;
            const progressLabel = `${key.replace(/_/g, " ")} ${percent}%`;
            setJobs((prev) =>
              prev.map((job) =>
                job.id === targetJob.id
                  ? { ...job, progressMessage: progressLabel }
                  : job,
              ),
            );
          },
        });

        const resultUrl = URL.createObjectURL(blob);
        registerUrl(resultUrl);

        // Save to backend
        try {
          await saveJob({
            fileName: targetJob.fileName,
            sourceImageDataUrl: targetJob.sourcePreview,
            resultImageDataUrl: resultUrl,
          });
        } catch (storageError) {
          console.warn(
            "Failed to persist background removal result",
            storageError,
          );
        }

        setJobs((prev) =>
          prev.map((job) =>
            job.id === targetJob.id
              ? {
                  ...job,
                  resultPreview: resultUrl,
                  processingState: "success",
                  statusMessage: {
                    label: "Background removed! Download the PNG below.",
                    tone: "success",
                  },
                  progressMessage: null,
                }
              : job,
          ),
        );
      } catch (error) {
        console.error("Background removal failed", error);
        setJobs((prev) =>
          prev.map((job) =>
            job.id === targetJob.id
              ? {
                  ...job,
                  processingState: "error",
                  statusMessage: {
                    label:
                      "Something went wrong while processing the photo. Please try another image.",
                    tone: "error",
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
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files ?? []);
      if (fileArray.length === 0) return;

      const now = Date.now();
      const jobsToAdd = fileArray.map((file) => {
        const sourcePreview = URL.createObjectURL(file);
        registerUrl(sourcePreview);
        return {
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 10)}`,
          fileName: file.name,
          sourcePreview,
          resultPreview: null,
          processingState: "loading" as ProcessingState,
          statusMessage: {
            label: "Preparing your photo…",
            tone: "default" as const,
          },
          progressMessage: null,
          createdAt: now,
        } satisfies BackgroundRemovalJob;
      });

      setJobs((prev) => [...prev, ...jobsToAdd]);

      jobsToAdd.forEach((job, index) => {
        const file = fileArray[index];
        void processFile(job, file);
      });
    },
    [processFile, registerUrl],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;
      if (files && files.length > 0) void handleFiles(files);
      event.target.value = "";
    },
    [handleFiles],
  );

  const dropHandlers = useMemo(() => {
    const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const { files } = event.dataTransfer;
      if (files && files.length > 0) void handleFiles(files);
    };
    const onDragOver = (event: React.DragEvent<HTMLLabelElement>) =>
      event.preventDefault();
    return { onDrop, onDragOver };
  }, [handleFiles]);

  const clearAll = useCallback(() => {
    cleanupAllUrls();
    setJobs([]);
  }, [cleanupAllUrls]);

  const sortOptions: SortOption[] = [
    {
      label: "Newest First",
      value: "date-desc",
      compareFn: (a: unknown, b: unknown) => {
        const aDate = new Date((a as ApiJob).created_at).getTime();
        const bDate = new Date((b as ApiJob).created_at).getTime();
        return bDate - aDate;
      },
    },
    {
      label: "Oldest First",
      value: "date-asc",
      compareFn: (a: unknown, b: unknown) => {
        const aDate = new Date((a as ApiJob).created_at).getTime();
        const bDate = new Date((b as ApiJob).created_at).getTime();
        return aDate - bDate;
      },
    },
  ];

  return (
    <Container className="space-y-10 pt-8">
      <PageMetadata
        title="Background removal tool"
        description="Upload photos and quickly export transparent PNGs generated entirely in the browser."
        path="/tools/background-removal"
        type="article"
      />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-aura-text-secondary">
            <Link to="/tools" className="text-brand-accent hover:underline">
              ← back to tools
            </Link>
            <span className="text-sm">
              remove backgrounds right in the browser.
            </span>
          </div>
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white hover:bg-aura-surface text-aura-text-secondary hover:text-aura-text-primary rounded-full shadow-aura-sm hover:shadow-aura-md aura-transition"
          >
            <ClockIcon className="w-5 h-5" />
            <span className="font-medium">History</span>
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-aura-text-primary">
          Background Remover
        </h1>
        <p className="text-lg text-aura-text-secondary max-w-2xl">
          Upload one or many photos and our in-browser model will isolate the
          main subject. You&#39;ll get transparent PNGs you can drop into decks,
          composites, or anything else that needs a clean cutout.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="space-y-6">
          <label
            htmlFor="background-remover-input"
            className="flex h-60 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-brand-secondary/60 bg-brand-secondary/20 p-6 text-center text-aura-text-secondary transition-colors hover:border-brand-accent hover:text-aura-text-primary"
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
              <span className="text-sm uppercase tracking-wide">
                drop or click
              </span>
              <span className="text-2xl font-semibold text-aura-text-primary">
                your photos
              </span>
            </div>
            <p className="max-w-xs text-sm text-aura-text-secondary">
              PNG and JPEG work best. Add as many as you like — everything stays
              in the browser.
            </p>
          </label>

          {jobs.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center justify-center rounded-md border border-brand-secondary/60 bg-brand-secondary/10 px-4 py-2 text-sm font-medium text-aura-text-secondary transition-colors hover:border-brand-accent hover:bg-brand-secondary/20 hover:text-aura-text-primary"
            >
              clear all photos
            </button>
          )}
        </div>

        <div className="space-y-10">
          {jobs.length === 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-aura-text-secondary">
                  original
                </h2>
                <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
                  <span className="text-sm text-aura-text-secondary">
                    no photos yet — add some to get started.
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-aura-text-secondary">
                  background removed
                </h2>
                <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
                  <span className="text-sm text-aura-text-secondary">
                    your processed previews will appear here.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="grid gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-aura-text-secondary">
                      original
                    </h2>
                    <span
                      className="truncate text-xs font-medium text-aura-text-secondary/80"
                      title={job.fileName}
                    >
                      {job.fileName}
                    </span>
                  </div>
                  <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
                    <img
                      src={job.sourcePreview}
                      alt={`Uploaded ${job.fileName}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-brand-secondary/60 bg-brand-secondary/20 p-4">
                  <div
                    className={`mb-4 rounded-lg border px-4 py-3 text-sm ${statusToneClasses[job.statusMessage.tone]}`}
                  >
                    {job.statusMessage.label}
                    {job.progressMessage && (
                      <span className="mt-1 block text-xs opacity-80">
                        {job.progressMessage}
                      </span>
                    )}
                  </div>
                  <div className="flex h-72 items-center justify-center rounded-lg bg-brand-primary/40">
                    {job.processingState === "loading" && (
                      <span className="text-sm text-aura-text-secondary">
                        processing… this can take a moment the first time.
                      </span>
                    )}
                    {job.processingState === "success" && job.resultPreview && (
                      <img
                        src={job.resultPreview}
                        alt={`Background removed result for ${job.fileName}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                    {job.processingState === "error" && (
                      <span className="text-sm text-rose-200">
                        we couldn&apos;t process that image. try another one?
                      </span>
                    )}
                  </div>
                  {job.processingState === "success" && job.resultPreview && (
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

      {/* Design Gallery */}
      <DesignGallery
        title="Background Removal History"
        fetchEndpoint="/api/background-removal/jobs"
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoad={() => {
          // Just close gallery - jobs are displayed inline on this page
          setIsGalleryOpen(false);
        }}
        deleteEndpoint="/api/background-removal/jobs"
        emptyMessage="No background removal jobs found. Upload an image to get started."
        sortOptions={sortOptions}
        renderPreview={(item: ApiJob) => (
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Original Image
              </h3>
              <img
                src={item.source_image_data_url}
                alt={item.file_name}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Background Removed
              </h3>
              <div className="bg-[linear-gradient(45deg,#808080_25%,transparent_25%,transparent_75%,#808080_75%,#808080),linear-gradient(45deg,#808080_25%,transparent_25%,transparent_75%,#808080_75%,#808080)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] p-4 rounded-lg">
                <img
                  src={item.result_image_data_url}
                  alt={`${item.file_name} - background removed`}
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          </div>
        )}
        renderItem={(item: ApiJob) => (
          <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors cursor-pointer group">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {item.file_name}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1 p-4 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">Original</p>
                <img
                  src={item.source_image_data_url}
                  alt="Original"
                  className="w-full h-24 object-cover rounded border border-slate-200"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Result</p>
                <div className="bg-[linear-gradient(45deg,#e0e0e0_25%,transparent_25%,transparent_75%,#e0e0e0_75%,#e0e0e0),linear-gradient(45deg,#e0e0e0_25%,transparent_25%,transparent_75%,#e0e0e0_75%,#e0e0e0)] bg-[length:10px_10px] bg-[position:0_0,5px_5px] w-full h-24 rounded border border-slate-200 p-1">
                  <img
                    src={item.result_image_data_url}
                    alt="Removed background"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      />
    </Container>
  );
}

export default BackgroundRemovalPage;
