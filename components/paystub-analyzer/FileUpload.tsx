import clsx from 'clsx';
import React, { useCallback, useRef } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileProcess: (files: FileList) => void;
  isLoading: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcess, isLoading, className }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileProcess(files);
    }
    // Reset file input value to allow re-uploading the same file(s)
    if(event.target) {
        event.target.value = '';
    }
  }, [onFileProcess]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf"
        disabled={isLoading}
        multiple
      />
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className={clsx(
          "flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          className
        )}
        aria-label="Upload paystubs"
        title="Upload Paystubs"
      >
        {isLoading ? (
          <SpinnerIcon className="w-5 h-5 animate-spin" />
        ) : (
          <UploadIcon className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">Upload PDF</span>
      </button>
    </>
  );
};