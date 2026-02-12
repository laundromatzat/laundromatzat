import React from "react";
import { Link } from "react-router-dom";
import { ClockIcon } from "@heroicons/react/24/outline";
import PageMetadata from "@/components/PageMetadata";
import Container from "@/components/Container";

interface ToolPageLayoutProps {
  /** Tool title - will be displayed in Title Case */
  title: string;
  /** Tool description text */
  description?: string;
  /** SEO meta description (defaults to description if not provided) */
  metaDescription?: string;
  /** Content for the history/gallery modal */
  historyContent?: React.ReactNode;
  /** Whether to show the history button (default: true) */
  showHistoryButton?: boolean;
  /** Custom history button label (default: "History") */
  historyButtonLabel?: string;
  /** Callback when history button is clicked */
  onHistoryClick?: () => void;
  /** Whether history panel is open */
  isHistoryOpen?: boolean;
  /** Main page content */
  children: React.ReactNode;
  /** Optional back link URL */
  backTo?: string;
  /** Optional back link label */
  backLabel?: string;
}

/**
 * Shared layout component for tool pages.
 * Provides consistent styling for headers, history button, and content area.
 */
export function ToolPageLayout({
  title,
  description,
  metaDescription,
  historyContent,
  showHistoryButton = true,
  historyButtonLabel = "History",
  onHistoryClick,
  isHistoryOpen = false,
  children,
  backTo = "/tools",
  backLabel = "back to tools",
}: ToolPageLayoutProps) {
  return (
    <>
      <PageMetadata
        title={`${title} | Laundromatzat`}
        description={metaDescription || description || `${title} tool`}
      />

      <div className="min-h-screen bg-aura-bg">
        <Container>
          <div className="py-8 md:py-12">
            {/* Header Section */}
            <div className="relative mb-8">
              {/* Back link */}
              <Link
                to={backTo}
                className="inline-flex items-center gap-1 text-sm text-aura-text-secondary hover:text-aura-text-primary mb-4 aura-transition"
              >
                ← {backLabel}
                {description && (
                  <span className="text-aura-text-secondary/60 ml-2">
                    {description.toLowerCase()}
                  </span>
                )}
              </Link>

              {/* Title and History Button Row */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-aura-text-primary mb-2">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-aura-text-secondary text-lg max-w-2xl">
                      {description}
                    </p>
                  )}
                </div>

                {/* History Button */}
                {showHistoryButton && onHistoryClick && (
                  <button
                    onClick={onHistoryClick}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-aura-sm hover:shadow-aura-md aura-transition text-aura-text-secondary hover:text-aura-text-primary"
                  >
                    <ClockIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {historyButtonLabel}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="relative">{children}</div>

            {/* History Panel Overlay */}
            {isHistoryOpen && historyContent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-aura-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                  {historyContent}
                </div>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
}

export default ToolPageLayout;
