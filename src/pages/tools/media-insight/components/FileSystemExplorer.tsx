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
    <div className="flex flex-col h-full mi-glass border-r-2 border-purple-200/50 rounded-l-2xl overflow-hidden shadow-lg">
      <div className="p-5 border-b border-purple-200/50 bg-gradient-to-br from-purple-50 to-pink-50">
        <h3 className="font-bold text-lg mi-gradient-text flex items-center mb-2">
          <FolderOpen size={20} className="mr-2 text-purple-600" />
          Workspace Files
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-aura-text-secondary font-medium">
            <span className="text-purple-600 font-bold">
              {files.filter((f) => f.status === "done").length}
            </span>{" "}
            / {files.length} analyzed
          </span>
          <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full text-purple-700 font-bold border border-purple-200">
            {files.length} items
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 mi-scrollbar">
        {files.length === 0 && (
          <div className="p-8 text-center text-aura-text-secondary mi-animate-fadeIn">
            <div className="mi-animate-float">
              <FolderOpen size={56} className="mx-auto mb-4 text-purple-300" />
            </div>
            <p className="text-sm font-semibold mb-2 text-purple-600">
              No media files found
            </p>
            <p className="text-xs opacity-75">
              Select a folder containing images or videos
            </p>
          </div>
        )}
        {files.map((file) => (
          <div
            key={file.name}
            onClick={() => onSelectFile(file)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelectFile(file);
              }
            }}
            className={`w-full flex items-start p-3 rounded-xl text-left transition-all duration-300 group border-2 cursor-pointer ${
              activeFileName === file.name
                ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-400 shadow-lg ring-2 ring-purple-300 scale-[1.02]"
                : "bg-white/50 hover:bg-white/80 border-transparent hover:border-purple-200 hover:shadow-md"
            }`}
          >
            <div className="mr-3 flex-shrink-0">
              {file.thumbnail ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 ring-2 ring-purple-200 shadow-sm">
                  <img
                    src={file.thumbnail}
                    alt={file.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-600/90 to-pink-600/90 rounded-tl-lg px-1.5 py-0.5">
                    {getStatusIcon(file.status)}
                  </div>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center ring-2 ring-purple-200">
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
          </div>
        ))}
      </div>

      {files.some((f) => f.status === "done") && (
        <div className="p-4 border-t border-purple-200/50 bg-gradient-to-r from-purple-50 to-pink-50">
          <p className="text-xs text-center text-purple-600 font-medium flex items-center justify-center gap-1">
            <Sparkles size={14} className="mi-animate-pulse" />
            Select a file to see actions
          </p>
        </div>
      )}
    </div>
  );
};

export default FileSystemExplorer;
