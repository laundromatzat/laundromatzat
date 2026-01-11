/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { SavedDocument } from "@/types";
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface DashboardProps {
  savedDocuments: SavedDocument[];
  onUploadClick: () => void;
  onChatClick: () => void;
  onDocumentClick: (doc: SavedDocument) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  savedDocuments,
  onUploadClick,
  onChatClick,
  onDocumentClick,
}) => {
  const stats = useMemo(() => {
    const totalDocs = savedDocuments.length;
    const categories = new Set(
      savedDocuments.map((d) => d.analysis.category || "Uncategorized")
    ).size;
    const lastUpdate =
      totalDocs > 0
        ? new Date(savedDocuments[0].uploaded_at).toLocaleDateString()
        : "N/A";
    return { totalDocs, categories, lastUpdate };
  }, [savedDocuments]);

  // Group by broad tags or category for a "Knowledge Graph" feel (simplified)
  const recentDocs = savedDocuments.slice(0, 5);

  return (
    <div className="flex flex-col h-full bg-gem-onyx p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gem-offwhite mb-2">
            Public Health Intelligence
          </h1>
          <p className="text-gem-offwhite/60">
            Unified Knowledge Base & Decision Support
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onUploadClick}
            className="flex items-center px-4 py-2 bg-gem-blue/10 hover:bg-gem-blue/20 text-gem-blue rounded-lg transition-colors border border-gem-blue/30"
          >
            <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
            Add Knowledge
          </button>
          <button
            onClick={onChatClick}
            className="flex items-center px-4 py-2 bg-gem-blue text-white rounded-lg hover:bg-gem-blue/90 transition-colors shadow-lg shadow-gem-blue/20"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Start Assistant
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gem-slate p-5 rounded-xl border border-gem-mist/30">
          <div className="text-gem-offwhite/50 text-sm font-medium mb-1">
            Total Documents
          </div>
          <div className="text-3xl font-bold text-gem-offwhite">
            {stats.totalDocs}
          </div>
        </div>
        <div className="bg-gem-slate p-5 rounded-xl border border-gem-mist/30">
          <div className="text-gem-offwhite/50 text-sm font-medium mb-1">
            Active Categories
          </div>
          <div className="text-3xl font-bold text-gem-offwhite">
            {stats.categories}
          </div>
        </div>
        <div className="bg-gem-slate p-5 rounded-xl border border-gem-mist/30">
          <div className="text-gem-offwhite/50 text-sm font-medium mb-1">
            Last Updated
          </div>
          <div className="text-3xl font-bold text-gem-offwhite">
            {stats.lastUpdate}
          </div>
        </div>
      </div>

      {/* Recent Activity / Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <div className="lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-semibold text-gem-offwhite mb-4 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2 text-gem-blue" />
            Recent Ingestions
          </h3>
          <div className="bg-gem-slate rounded-xl border border-gem-mist/30 flex-1 overflow-hidden flex flex-col">
            {recentDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gem-offwhite/40 p-8">
                <MagnifyingGlassIcon className="w-12 h-12 mb-2" />
                <p>
                  No documents yet. Upload files to build your knowledge base.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto p-2">
                {recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onDocumentClick(doc)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        onDocumentClick(doc);
                    }}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-gem-mist/10 rounded-lg cursor-pointer transition-colors border-b border-gem-mist/10 last:border-0"
                  >
                    <div className="flex items-start mb-2 sm:mb-0">
                      <div className="p-2 bg-gem-mist/20 rounded-lg mr-3 group-hover:bg-gem-blue/20 group-hover:text-gem-blue transition-colors text-gem-offwhite/70">
                        <DocumentTextIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gem-offwhite group-hover:text-gem-blue transition-colors">
                          {doc.filename}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {doc.analysis.category && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gem-mist/20 text-gem-offwhite/60">
                              {doc.analysis.category}
                            </span>
                          )}
                          {doc.analysis.detected_version && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {doc.analysis.detected_version}
                            </span>
                          )}
                          {(
                            JSON.parse(
                              JSON.stringify(doc.analysis.tags || [])
                            ) as string[]
                          )
                            .slice(0, 2)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-gem-blue/10 text-gem-blue"
                              >
                                #{tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gem-offwhite/40 whitespace-nowrap sm:text-right">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {savedDocuments.length > 5 && (
              <div className="p-3 border-t border-gem-mist/20 text-center">
                <button className="text-xs text-gem-blue hover:text-gem-blue/80 font-medium">
                  View All {savedDocuments.length} Documents
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action / Context Panel */}
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gem-offwhite mb-4">
            Quick Actions
          </h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gem-blue/20 to-purple-500/10 p-5 rounded-xl border border-gem-blue/20">
              <h4 className="font-medium text-gem-blue mb-2">New Protocol?</h4>
              <p className="text-sm text-gem-offwhite/70 mb-4">
                Upload new guidelines to instantly update the assistant&apos;s
                context.
              </p>
              <button
                onClick={onUploadClick}
                className="w-full py-2 bg-gem-blue text-white rounded-lg text-sm font-medium hover:bg-gem-blue/90"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
