/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Edit3,
  Tag,
  FolderTree,
  Sparkles,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { AuraButton, AuraCard, AuraBadge } from "@/components/aura";
import { WorkspaceFile } from "../types";

interface FileActionsPanelProps {
  file: WorkspaceFile | null;
  onRename: (file: WorkspaceFile) => void;
  onOrganize: () => void;
  onOpenFile?: (file: WorkspaceFile) => void;
}

const FileActionsPanel: React.FC<FileActionsPanelProps> = ({
  file,
  onRename,
  onOrganize,
  onOpenFile,
}) => {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [customTags, setCustomTags] = useState("");

  if (!file || file.status !== "done" || !file.analysisResult) {
    return (
      <AuraCard variant="glass" padding="lg">
        <div className="text-center text-aura-text-secondary">
          <div className="animate-bounce mb-4">
            <Sparkles size={56} className="mx-auto text-purple-300" />
          </div>
          <p className="text-sm font-semibold text-purple-600">
            Select and analyze a file to see available actions
          </p>
        </div>
      </AuraCard>
    );
  }

  const suggestedName = file.analysisResult.suggestedName || "No suggestion";
  const tags = file.analysisResult.tags || [];

  return (
    <AuraCard variant="glass" padding="md" className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-1 flex items-center">
          <Sparkles size={22} className="mr-2 text-purple-600 animate-pulse" />
          File Actions
        </h3>
        <p className="text-xs text-aura-text-secondary">
          Perform operations on this file
        </p>
      </div>

      {/* File Preview */}
      {file.thumbnail && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wide block mb-3">
            File Preview
          </div>
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white shadow-lg ring-2 ring-purple-300 mb-3">
            <img
              src={file.thumbnail}
              alt={file.name}
              className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
            />
          </div>
          {onOpenFile && file.path && (
            <AuraButton
              onClick={() => onOpenFile(file)}
              variant="secondary"
              icon={<ExternalLink size={16} />}
              className="w-full justify-center"
              size="sm"
            >
              Open in Default App
            </AuraButton>
          )}
        </div>
      )}

      {/* Current Filename */}
      <div className="bg-brand-secondary/5 rounded-lg p-4 border border-brand-secondary/20">
        <div className="text-xs font-semibold text-aura-text-secondary uppercase tracking-wide block mb-2">
          Current Filename
        </div>
        <p className="text-sm font-mono text-aura-text-primary break-all">
          {file.name}
        </p>
      </div>

      {/* AI Suggested Name */}
      <div className="bg-brand-accent/5 rounded-lg p-4 border border-brand-accent/20">
        <div className="text-xs font-semibold text-brand-accent uppercase tracking-wide block mb-2 flex items-center">
          <Sparkles size={14} className="mr-1" />
          AI Suggested Name
        </div>
        <p className="text-sm font-medium text-aura-text-primary break-all">
          {suggestedName}
        </p>
      </div>

      {/* Rename Button */}
      <AuraButton
        onClick={() => onRename(file)}
        variant="primary"
        icon={<Edit3 size={20} />}
        className="w-full justify-center py-6"
        size="lg"
      >
        Rename File with AI Suggestion
      </AuraButton>

      {/* Tags Section */}
      <div className="border-t border-brand-secondary/20 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-aura-text-secondary uppercase tracking-wide flex items-center">
            <Tag size={14} className="mr-1" />
            Finder Tags
          </div>
          {!isEditingTags && (
            <button
              onClick={() => setIsEditingTags(true)}
              className="text-xs text-brand-accent hover:text-brand-accent/80 font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingTags ? (
          <div className="space-y-2">
            <input
              type="text"
              value={customTags}
              onChange={(e) => setCustomTags(e.target.value)}
              placeholder="Enter tags separated by commas"
              className="w-full px-3 py-2 border border-brand-secondary/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            />
            <div className="flex gap-2">
              <AuraButton
                onClick={() => {
                  // TODO: Apply custom tags
                  setIsEditingTags(false);
                }}
                variant="accent"
                size="sm"
                icon={<Check size={14} />}
                className="flex-1 justify-center"
              >
                Apply
              </AuraButton>
              <AuraButton
                onClick={() => {
                  setCustomTags("");
                  setIsEditingTags(false);
                }}
                variant="ghost"
                size="sm"
                icon={<X size={14} />}
                className="flex-1 justify-center"
              >
                Cancel
              </AuraButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag, i) => (
                <AuraBadge key={i} variant="neutral" size="sm">
                  {tag}
                </AuraBadge>
              ))
            ) : (
              <p className="text-xs text-aura-text-secondary italic">
                No tags suggested
              </p>
            )}
          </div>
        )}
      </div>

      {/* Organize Button */}
      <div className="border-t border-brand-secondary/20 pt-6">
        <AuraButton
          onClick={onOrganize}
          variant="secondary"
          icon={<FolderTree size={18} />}
          className="w-full justify-center"
        >
          Organize All Files
        </AuraButton>
        <p className="text-xs text-aura-text-secondary mt-2 text-center">
          Move files into categorized folders
        </p>
      </div>
    </AuraCard>
  );
};

export default FileActionsPanel;
