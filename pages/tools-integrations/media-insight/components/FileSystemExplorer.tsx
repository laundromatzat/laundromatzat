/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { FolderOpen, CheckCircle, Circle, Edit3, Tag } from "lucide-react";
import { WorkspaceFile } from "../types";

interface FileSystemExplorerProps {
  files: WorkspaceFile[];
  onSelectFile: (file: WorkspaceFile) => void;
  onRename: (file: WorkspaceFile) => void;
  onOrganize: () => void;
  activeFileName?: string;
}

const FileSystemExplorer: React.FC<FileSystemExplorerProps> = ({
  files,
  onSelectFile,
  onRename,
  onOrganize,
  activeFileName,
}) => {
  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm border-r border-brand-secondary/40 transition-colors">
      <div className="p-4 border-b border-brand-secondary/40 flex items-center justify-between">
        <h3 className="font-semibold text-aura-text-primary flex items-center">
          <FolderOpen size={18} className="mr-2 text-brand-accent" />
          Workspace
        </h3>
        <span className="text-xs bg-brand-secondary/10 px-2 py-1 rounded-full text-aura-text-secondary">
          {files.length} items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.length === 0 && (
          <div className="p-8 text-center text-aura-text-secondary text-sm italic">
            No media files found in this folder.
          </div>
        )}
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => onSelectFile(file)}
            className={`w-full flex items-center p-3 rounded-lg text-left transition-all group ${
              activeFileName === file.name
                ? "bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/20"
                : "text-aura-text-secondary hover:bg-brand-secondary/10 hover:text-aura-text-primary"
            }`}
          >
            <div className="mr-3">
              {file.status === "done" ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : file.status === "analyzing" ? (
                <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <Circle size={16} className="text-brand-secondary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs opacity-60 uppercase">{file.type}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
              {file.status === "done" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(file);
                  }}
                  className="p-1 hover:bg-brand-accent/10 rounded"
                  title="Rename using AI"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 bg-brand-secondary/5 border-t border-brand-secondary/40">
        <button
          onClick={onOrganize}
          disabled={!files.some((f) => f.status === "done")}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Tag size={16} />
          <span>Smart Organize</span>
        </button>
      </div>
    </div>
  );
};

export default FileSystemExplorer;
