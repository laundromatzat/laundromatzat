/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileAudio,
  FileImage,
  FileVideo,
  X,
  AlertCircle,
} from "lucide-react";
import { MediaInput, MediaType } from "../types";

interface FileUploaderProps {
  onFileSelected: (mediaData: MediaInput) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  disabled,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<MediaType>("audio");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const determineMediaType = (mimeType: string): MediaType | null => {
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    return null;
  };

  const processFile = (file: File) => {
    setError(null);
    const type = determineMediaType(file.type);

    if (!type) {
      setError("Please upload a valid audio, image, or video file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size exceeds 20MB limit.");
      return;
    }

    setFileName(file.name);
    setFileType(type);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(",")[1];

      onFileSelected({
        blob: file,
        base64,
        mimeType: file.type,
        type,
        name: file.name,
      });
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Keyboard support for activating the file input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case "image":
        return <FileImage size={24} />;
      case "video":
        return <FileVideo size={24} />;
      default:
        return <FileAudio size={24} />;
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="audio/*,video/*,image/*"
        onChange={handleChange}
        disabled={disabled}
      />

      {!fileName ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload file"
          className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent focus:ring-offset-aura-bg ${
            dragActive
              ? "border-brand-accent bg-brand-accent/10"
              : "border-brand-secondary/40 bg-white/80 backdrop-blur-sm hover:border-brand-accent/60 hover:bg-white/90"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={handleKeyDown}
        >
          <div className="p-4 bg-brand-accent/10 text-brand-accent rounded-full mb-4">
            <UploadCloud size={32} />
          </div>
          <p className="text-lg font-medium text-aura-text-primary mb-1">
            Click to upload or drag & drop
          </p>
          <p className="text-sm text-aura-text-secondary">
            Audio, Image, or Video files (Max 20MB)
          </p>
          {error && (
            <div className="mt-4 flex items-center text-red-600 text-sm bg-red-50 px-3 py-1.5 rounded-lg">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border border-brand-secondary/40 rounded-xl p-6 flex items-center justify-between shadow-sm transition-colors duration-300">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-brand-accent/10 text-brand-accent rounded-lg">
              {getFileIcon()}
            </div>
            <div>
              <p className="font-medium text-aura-text-primary truncate max-w-[200px] sm:max-w-md">
                {fileName}
              </p>
              <p className="text-xs text-aura-text-secondary capitalize">
                Ready to analyze {fileType}
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 text-aura-text-secondary hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={disabled}
            aria-label="Remove file"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
