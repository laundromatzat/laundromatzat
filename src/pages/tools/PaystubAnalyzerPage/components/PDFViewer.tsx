import { Skeleton } from "@/components/ui/Skeleton";
import clsx from "clsx";
import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl?: string;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, className }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF Load Error:", error);
    setError("Failed to load PDF document");
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const goToPreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  if (!pdfUrl) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center bg-aura-bg/30 rounded-lg border border-aura-text-primary/10 p-8",
          className
        )}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-aura-text-secondary/50 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-aura-text-secondary">No PDF available</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center bg-red-500/5 rounded-lg border border-red-500/20 p-8",
          className
        )}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500/70 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-red-400 font-medium">{error}</p>
          <p className="text-xs text-red-400/70 mt-1">
            Try re-uploading the document
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex flex-col bg-aura-bg/30 rounded-lg border border-aura-text-primary/10 overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/50 border-b border-aura-text-primary/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          {numPages > 1 && (
            <>
              <button
                onClick={goToPreviousPage}
                disabled={pageNumber <= 1}
                className="p-1.5 rounded-md hover:bg-aura-text-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <svg
                  className="w-4 h-4 text-aura-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="text-xs text-aura-text-secondary font-medium px-2">
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-1.5 rounded-md hover:bg-aura-text-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <svg
                  className="w-4 h-4 text-aura-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <div className="w-px h-5 bg-aura-text-primary/10 mx-1" />
            </>
          )}

          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-md hover:bg-aura-text-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom out"
          >
            <svg
              className="w-4 h-4 text-aura-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
              />
            </svg>
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-medium text-aura-text-secondary hover:bg-aura-text-primary/5 rounded-md transition-colors"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="p-1.5 rounded-md hover:bg-aura-text-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom in"
          >
            <svg
              className="w-4 h-4 text-aura-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-aura-accent"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-aura-text-secondary font-medium">
            Original PDF
          </span>
        </div>
      </div>

      {/* PDF Document */}
      <div className="flex-1 overflow-auto bg-slate-100 p-4">
        <div className="flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="space-y-4">
                <Skeleton className="h-[600px] w-[450px] bg-white/50" />
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-aura-text-secondary">
                    <div className="w-4 h-4 border-2 border-aura-accent border-t-transparent rounded-full animate-spin" />
                    <span>Loading PDF...</span>
                  </div>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-lg"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
};
