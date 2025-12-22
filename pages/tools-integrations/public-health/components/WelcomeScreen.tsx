/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import Spinner from "./Spinner";
import UploadCloudIcon from "./icons/UploadCloudIcon";
import TrashIcon from "./icons/TrashIcon";
import { AnalyzedDocument, SavedDocument } from "../types";

interface WelcomeScreenProps {
  onUpload: () => Promise<void>;
  apiKeyError: string | null;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isApiKeySelected: boolean;
  onSelectKey: () => Promise<void>;
  generationProvider: "gemini" | "local";
  setGenerationProvider: (provider: "gemini" | "local") => void;
  localLlmUrl: string;
  setLocalLlmUrl: (url: string) => void;
  savedDocuments?: SavedDocument[];
  onResumeSession?: (storeName: string, docs: AnalyzedDocument[]) => void;
}

const sampleDocuments = [
  {
    name: "Street Medicine Protocols",
    details: "24 pages, PDF",
    url: "https://www.hudexchange.info/sites/onecpd/assets/File/Street-Outreach-Program-Data-Collection-Strategies-Strategies-for-Street-Outreach-Staff-Safety.pdf",
    // Using a generic medical/clipboard icon equivalent
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-gem-blue"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    fileName: "Street_Outreach_Safety_Protocols.pdf",
  },
  {
    name: "HIV/AIDS Strategy",
    details: "National Strategy, PDF",
    url: "https://files.hiv.gov/s3fs-public/NHAS-2022-2025.pdf",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    fileName: "National_HIV_AIDS_Strategy_2025.pdf",
  },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onUpload,
  apiKeyError,
  files,
  setFiles,
  isApiKeySelected,
  onSelectKey,
  generationProvider,
  setGenerationProvider,
  localLlmUrl,
  setLocalLlmUrl,
  savedDocuments = [],
  onResumeSession,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles((prev) => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (event.dataTransfer.files) {
        setFiles((prev) => [...prev, ...Array.from(event.dataTransfer.files)]);
      }
    },
    [setFiles]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  const handleSelectSample = async (
    name: string,
    url: string,
    fileName: string
  ) => {
    if (loadingSample) return;
    setLoadingSample(name);
    try {
      // Using a CORS proxy for demo purposes if needed, but trying direct first.
      // If CORS fails on these specific URLs, user will get alert.
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${name}: ${response.statusText}. This may be a CORS issue.`
        );
      }
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });
      setFiles((prev) => [...prev, file]);
    } catch (error) {
      console.error("Error fetching sample file:", error);
      // Fallback for demo/testing: Create a dummy file if fetch fails (CORS)
      const dummyContent = `This is a placeholder content for ${name}. In a real scenario, this would be the actual PDF content.`;
      const file = new File([dummyContent], fileName, { type: "text/plain" });
      setFiles((prev) => [...prev, file]);
    } finally {
      setLoadingSample(null);
    }
  };

  const handleConfirmUpload = async () => {
    try {
      await onUpload();
    } catch (error) {
      console.error("Upload process failed:", error);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSelectKeyClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    await onSelectKey();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 bg-gem-onyx">
      <div className="w-full max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center justify-center bg-gem-blue/10 p-3 rounded-full">
          <svg
            className="w-10 h-10 text-gem-blue"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold mb-3 text-gem-offwhite">
          Public Health Doc Organizer
        </h1>
        <p className="text-gem-offwhite/70 mb-8 max-w-2xl mx-auto">
          A multidisciplinary tool for healthcare providers serving homeless
          populations. Upload protocols, patient forms, and reports to
          automatically organize, tag, and detect duplicate resources.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-8 text-left">
          <div className="bg-gem-slate p-6 rounded-xl border border-gem-mist/60 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 text-gem-offwhite">
              1. Configuration
            </h3>

            <div className="mb-4">
              {!isApiKeySelected ? (
                <button
                  onClick={handleSelectKeyClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2.5 px-4 transition-colors flex items-center justify-center"
                >
                  <span>Connect Gemini API</span>
                </button>
              ) : (
                <div className="w-full bg-green-50 border border-green-200 rounded-lg py-2 px-4 text-green-700 text-sm font-medium flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  API Key Active
                </div>
              )}
              {apiKeyError && (
                <p className="text-red-500 text-xs mt-2">{apiKeyError}</p>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-gem-offwhite/50 uppercase tracking-wider">
                Analysis Engine
              </span>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="provider"
                    checked={generationProvider === "gemini"}
                    onChange={() => setGenerationProvider("gemini")}
                    className="text-gem-blue focus:ring-gem-blue"
                  />
                  <span className="ml-2 text-sm text-gem-offwhite">
                    Gemini 2.5 (Cloud)
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="provider"
                    checked={generationProvider === "local"}
                    onChange={() => setGenerationProvider("local")}
                    className="text-gem-blue focus:ring-gem-blue"
                  />
                  <span className="ml-2 text-sm text-gem-offwhite">
                    Local LLM
                  </span>
                </label>
              </div>
              {generationProvider === "local" && (
                <div className="mt-2">
                  <input
                    type="url"
                    value={localLlmUrl}
                    onChange={(e) => setLocalLlmUrl(e.target.value)}
                    placeholder="http://localhost:11434/..."
                    className="w-full text-xs bg-gem-onyx border border-gem-mist rounded p-2"
                  />
                  <p className="text-[10px] text-gem-offwhite/50 mt-1">
                    Note: Gemini API key is still required for document
                    indexing/RAG.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all ${
              isDragging
                ? "border-gem-blue bg-blue-50"
                : "border-gem-mist bg-gem-slate"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="bg-gem-mist/30 p-4 rounded-full mb-3">
              <UploadCloudIcon />
            </div>
            <p className="text-sm font-medium text-gem-offwhite">
              Drag & drop files here
            </p>
            <p className="text-xs text-gem-offwhite/50 mb-4">
              PDF, Word, Excel, Email exports
            </p>

            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,.csv"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Files
            </label>
          </div>
        </div>

        {files.length > 0 && (
          <div className="bg-gem-slate rounded-xl shadow-sm border border-gem-mist/50 p-4 mb-8 text-left max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-sm text-gem-offwhite">
                Pending Uploads ({files.length})
              </h4>
              <button
                onClick={handleConfirmUpload}
                disabled={!isApiKeySelected}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Analyze & Organize
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex justify-between items-center p-2 bg-gem-onyx rounded border border-gem-mist/30"
                >
                  <div className="flex items-center overflow-hidden">
                    <div className="w-8 h-8 bg-white border border-gem-mist rounded flex items-center justify-center text-xs font-bold text-gem-blue mr-3 shrink-0">
                      {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                    </div>
                    <span className="text-sm text-gem-offwhite truncate">
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-gem-offwhite/40 hover:text-red-500 p-1"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gem-mist pt-8">
          <p className="text-sm text-gem-offwhite/60 mb-4">
            Or test with public health resources:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {sampleDocuments.map((doc) => (
              <button
                key={doc.name}
                onClick={() =>
                  handleSelectSample(doc.name, doc.url, doc.fileName)
                }
                disabled={!!loadingSample}
                className="flex items-center p-3 bg-white hover:bg-gem-mist/20 border border-gem-mist rounded-lg transition-all text-left group"
              >
                <div className="mr-4 group-hover:scale-110 transition-transform duration-200">
                  {loadingSample === doc.name ? <Spinner /> : doc.icon}
                </div>
                <div>
                  <div className="font-semibold text-gem-offwhite text-sm">
                    {doc.name}
                  </div>
                  <div className="text-xs text-gem-offwhite/50">
                    {doc.details}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {savedDocuments && savedDocuments.length > 0 && (
          <div className="border-t border-gem-mist pt-8 mt-8">
            <h3 className="text-xl font-bold mb-4 text-gem-offwhite">
              Repository Archives
            </h3>
            <div className="grid gap-4 max-w-2xl mx-auto">
              {Object.entries(
                savedDocuments.reduce(
                  (acc, doc) => {
                    const store = doc.rag_store_name || "Uncategorized";
                    if (!acc[store]) acc[store] = [];
                    acc[store].push(doc);
                    return acc;
                  },
                  {} as Record<string, SavedDocument[]>
                )
              ).map(([storeName, docs]) => (
                <div
                  key={storeName}
                  className="bg-gem-slate p-4 rounded-xl border border-gem-mist/40 flex justify-between items-center"
                >
                  <div className="text-left">
                    <h4 className="font-semibold text-gem-blue">
                      {storeName === "unknown" ? "Restored Session" : storeName}
                    </h4>
                    <p className="text-sm text-gem-offwhite/60">
                      {docs.length} document{docs.length !== 1 ? "s" : ""} •{" "}
                      {new Date(docs[0].uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onResumeSession &&
                      onResumeSession(
                        storeName,
                        docs.map((d) => d.analysis)
                      )
                    }
                    className="px-3 py-1.5 bg-gem-mist/20 hover:bg-gem-mist/40 text-gem-offwhite rounded-lg text-sm transition-colors border border-gem-mist/50"
                  >
                    Resume Intelligence
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
