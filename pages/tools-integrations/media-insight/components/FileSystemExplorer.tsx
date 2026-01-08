/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  FolderOpen,
  CheckCircle,
  Circle,
  Loader2,
  Sparkles,
  ExternalLink,
  FileImage,
  FileVideo,
  FileAudio,
} from "lucide-react";
import { WorkspaceFile } from "../types";

interface FileSystemExplorerProps {
  files: WorkspaceFile[];
  onSelectFile: (file: WorkspaceFile) => void;
  onRename: (file: WorkspaceFile) => void;
  onOrganize: () => void;
  onOpenFile?: (file: WorkspaceFile) => void;
  activeFileName?: string;
}

const FileSystemExplorer: React.FC<FileSystemExplorerProps> = ({
  files,
  onSelectFile,
  onOpenFile,
  activeFileName,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle size={18} className="text-green-500" />;
      case "analyzing":
        return <Loader2 size={18} className="text-brand-accent animate-spin" />;
      default:
        return <Circle size={18} className="text-brand-secondary/40" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return (
          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200">
            Analyzed
          </span>
        );
      case "analyzing":
        return (
          <span className="text-xs bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-medium border border-brand-accent/20 flex items-center">
            <Loader2 size={12} className="mr-1 animate-spin" />
            Analyzing
          </span>
        );
      default:
        return (
          <span className="text-xs bg-brand-secondary/10 text-aura-text-secondary px-2 py-0.5 rounded-full font-medium">
            Pending
          </span>
        );
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage size={16} className="text-brand-accent" />;
      case "video":
        return <FileVideo size={16} className="text-brand-accent" />;
      case "audio":
        return <FileAudio size={16} className="text-brand-accent" />;
      default:
        return <Circle size={16} className="text-brand-secondary" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm border-r border-brand-secondary/40 transition-colors">
      <div className="p-4 border-b border-brand-secondary/40 bg-gradient-to-r from-brand-accent/5 to-transparent">
        <h3 className="font-semibold text-aura-text-primary flex items-center mb-1">
          <FolderOpen size={18} className="mr-2 text-brand-accent" />
          Workspace Files
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-aura-text-secondary">
            {files.filter((f) => f.status === "done").length} / {files.length}{" "}
            analyzed
          </span>
          <span className="text-xs bg-brand-accent/10 px-2 py-1 rounded-full text-brand-accent font-medium">
            {files.length} items
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {files.length === 0 && (
          <div className="p-8 text-center text-aura-text-secondary">
            <FolderOpen size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium mb-1">No media files found</p>
            <p className="text-xs opacity-75">
              Select a folder containing images or videos
            </p>
          </div>
        )}
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => onSelectFile(file)}
            className={`w-full flex items-start p-3 rounded-lg text-left transition-all group border ${
              activeFileName === file.name
                ? "bg-brand-accent/10 text-brand-accent ring-2 ring-brand-accent/30 border-brand-accent/30 shadow-sm"
                : "text-aura-text-secondary hover:bg-brand-secondary/5 hover:text-aura-text-primary border-transparent hover:border-brand-secondary/20"
            }`}
          >
            <div className="mr-3 flex-shrink-0">
              {file.thumbnail ? (
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-brand-secondary/10">
                  <img
                    src={file.thumbnail}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 bg-black/60 rounded-tl px-1">
                    {getStatusIcon(file.status)}
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-md bg-brand-secondary/10 flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p
                  className="text-sm font-medium truncate flex-1"
                  title={file.name}
                >
                  {file.name}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {file.status === "done" && (
                    <Sparkles size={14} className="text-brand-accent" />
                  )}
                  {onOpenFile && file.path && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFile(file);
                      }}
                      className="p-1 rounded hover:bg-brand-accent/10 transition-colors"
                      title="Open file"
                    >
                      <ExternalLink
                        size={14}
                        className="text-aura-text-secondary hover:text-brand-accent"
                      />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-aura-text-secondary/75 uppercase font-medium">
                  {file.type}
                </span>
                {getStatusBadge(file.status)}
              </div>
            </div>
          </button>
        ))}
      </div>

      {files.some((f) => f.status === "done") && (
        <div className="p-3 border-t border-brand-secondary/40 bg-brand-secondary/5">
          <p className="text-xs text-center text-aura-text-secondary">
            <Sparkles size={12} className="inline mr-1" />
            Select a file to see actions
          </p>
        </div>
      )}
    </div>
  );
};

export default FileSystemExplorer;
