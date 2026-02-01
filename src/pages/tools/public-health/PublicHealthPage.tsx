/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/utils/api";
import WelcomeScreen from "./components/WelcomeScreen";
import OrganizationResultView from "./components/OrganizationResultView";
import ProgressBar from "./components/ProgressBar";
import {
  AppStatus,
  ChatMessage,
  AnalysisResult,
  AnalyzedDocument,
  SavedDocument,
} from "./types";
import * as geminiService from "./services/geminiService";
import ChatInterface from "./components/ChatInterface";
import PageMetadata from "@/components/PageMetadata";
import {
  DesignGallery,
  SortOption,
  FilterConfig,
} from "@/components/DesignGallery";
import { ClockIcon } from "@heroicons/react/24/outline";

declare global {
  interface AIStudio {
    openSelectKey: () => Promise<void>;
    hasSelectedApiKey: () => Promise<boolean>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const PublicHealthPage: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.Initializing);
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    message?: string;
    fileName?: string;
  } | null>(null);

  // Unified Store State
  const [activeRagStoreName, setActiveRagStoreName] = useState<string | null>(
    null,
  );

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [files, setFiles] = useState<File[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Initialization & Auth
  const checkApiKey = useCallback(async () => {
    // (Existing Auth Logic remains same, simplified here for brevity in diff but keeping full logic)
    if (window.aistudio?.hasSelectedApiKey) {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      } catch (e) {
        console.error("Error checking for API key:", e);
        if (!isApiKeySelected) {
          const envKey =
            import.meta.env.VITE_GEMINI_API_KEY ||
            import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
            import.meta.env.VITE_API_KEY;
          if (envKey) setIsApiKeySelected(true);
        }
      }
    } else {
      const envKey =
        import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
        import.meta.env.VITE_API_KEY;
      setIsApiKeySelected(!!envKey);
    }
  }, [isApiKeySelected]);

  useEffect(() => {
    checkApiKey();
    window.addEventListener("focus", checkApiKey);
    return () => window.removeEventListener("focus", checkApiKey);
  }, [checkApiKey]);

  // Load Saved Docs & Initialize Store
  const fetchSavedDocs = useCallback(async () => {
    try {
      setIsLoadingDocs(true);
      const res = await fetch(getApiUrl("/api/public-health/docs"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedDocuments(data.docs || []);

        // If we have docs, we assume the store exists or will be found.
        if (data.docs.length > 0) {
          setStatus(AppStatus.Welcome); // Dashboard logic handles "Welcome" vs "Dashboard" internally or we switch here
        }
      }
    } catch (e) {
      console.error("Failed to load saved docs", e);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    try {
      geminiService.initialize(); // Ensure API is ready
    } catch {
      console.warn("API Key not ready yet, checking saved config...");
    }
    fetchSavedDocs();
    setStatus(AppStatus.Welcome);
  }, [fetchSavedDocs]);

  // We DO NOT delete the store on unload anymore because it is persistent.

  const handleError = (message: string, err: unknown) => {
    console.error(message, err);
    setError(
      `${message}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ""}`,
    );
    setStatus(AppStatus.Error);
  };

  const handleUploadAndAnalyze = async () => {
    if (!isApiKeySelected && window.aistudio) {
      setApiKeyError("Please select your Gemini API Key first.");
      return;
    }
    if (files.length === 0) return;
    setApiKeyError(null);

    try {
      setStatus(AppStatus.Uploading);
      setUploadProgress({
        current: 0,
        total: files.length + 2,
        message: "Connecting to Knowledge Base...",
      });

      // 1. Ensure Main Store Exists
      const ragStoreName = await geminiService.ensureMainRagStore();
      setActiveRagStoreName(ragStoreName);

      setUploadProgress({
        current: 1,
        total: files.length + 2,
        message: "Indexing documents...",
      });

      const fileNames = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress((prev) => ({
          ...prev!,
          current: i + 1,
          message: `Indexing ${files[i].name}...`,
          fileName: files[i].name,
        }));
        await geminiService.uploadToRagStore(ragStoreName, files[i]);
        fileNames.push(files[i].name);
      }

      setStatus(AppStatus.Analyzing);
      setUploadProgress({
        current: files.length + 1,
        total: files.length + 2,
        message: "Analyzing structure & content...",
        fileName: "",
      });

      const analysis = await geminiService.analyzeDocumentBatch(
        ragStoreName,
        fileNames,
      );
      setAnalysisResult(analysis);
      setUploadProgress({
        current: files.length + 2,
        total: files.length + 2,
        message: "Done!",
        fileName: "",
      });

      await new Promise((r) => setTimeout(r, 800));
      setStatus(AppStatus.Results); // Show review screen before saving
    } catch (err) {
      handleError("Failed to process documents", err);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSaveOrganization = async (docs: AnalyzedDocument[]) => {
    try {
      await Promise.all(
        docs.map(async (doc) => {
          const res = await fetch(getApiUrl("/api/public-health/docs"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({
              filename: doc.filename,
              rag_store_name: activeRagStoreName || "unified-store",
              analysis_result_json: doc,
              tags: doc.tags,
              category: doc.category,
              version: doc.detected_version,
            }),
          });
          if (!res.ok) throw new Error("Failed to save doc metadata");
          return res.json();
        }),
      );
      await fetchSavedDocs();
      setFiles([]);
      setStatus(AppStatus.Welcome); // Return to Dashboard
    } catch (e) {
      console.error(e);
      alert("Failed to save to backend database.");
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!activeRagStoreName) {
      // Try to get store if missing
      try {
        const store = await geminiService.ensureMainRagStore();
        setActiveRagStoreName(store);
      } catch (e) {
        handleError("Could not connect to Knowledge Base", e);
        return;
      }
    }

    const currentStore =
      activeRagStoreName || (await geminiService.ensureMainRagStore());
    if (!activeRagStoreName) setActiveRagStoreName(currentStore);

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: message }],
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setIsQueryLoading(true);

    try {
      const result = await geminiService.fileSearch(currentStore, message);
      const modelMessage: ChatMessage = {
        role: "model",
        parts: [{ text: result.text }],
        groundingChunks: result.groundingChunks,
      };
      setChatHistory((prev) => [...prev, modelMessage]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "model", parts: [{ text: "Error fetching response." }] },
      ]);
    } finally {
      setIsQueryLoading(false);
    }
  };

  const handleStartChat = async () => {
    const store = await geminiService.ensureMainRagStore();
    setActiveRagStoreName(store);
    setStatus(AppStatus.Chatting);
  };

  const handleLoadGalleryItem = (item: {
    rag_store_name: string;
    analysis?: unknown;
  }) => {
    // Relate this doc back to other docs in the same store if possible,
    // or just restore this single context.
    // For now, let's restore the session with the related store.
    const storeName = item.rag_store_name;

    // Filter saved docs to find others in this store (session)
    const sessionDocs = savedDocuments.filter(
      (d) => d.rag_store_name === storeName,
    );
    // Convert SavedDocument to AnalyzedDocument compatible format if needed
    // The API returns 'analysis_result_json' in 'analysis_result_json' column.
    // We can assume 'item' has the structure of the API response.
    // Let's assume the API response includes analysis_result_json merged at top level or as property.
    // Actually fetching from API returns:
    // { id, filename, rag_store_name, analysis, tags, category, version, timestamp }
    // where 'analysis' is the JSON object.

    // So we reconstruct the valid docs list
    const docsToLoad = sessionDocs.length > 0 ? sessionDocs : [item];

    setActiveRagStoreName(storeName);
    setAnalysisResult({
      batch_summary: "Restored Session",
      documents: docsToLoad.map((d: SavedDocument | typeof item) =>
        "analysis" in d ? d.analysis : d,
      ) as AnalyzedDocument[], // Handle potential shape diffs
      proposed_hierarchy_changes: "",
      archive_recommendations: [],
      notes_for_user: "",
    });
    setStatus(AppStatus.Chatting);
    setIsGalleryOpen(false);
  };

  const renderContent = () => {
    switch (status) {
      case AppStatus.Initializing:
      case AppStatus.Welcome:
        return (
          <WelcomeScreen
            onUpload={handleUploadAndAnalyze}
            apiKeyError={apiKeyError}
            files={files}
            setFiles={setFiles}
            isApiKeySelected={isApiKeySelected}
            onSelectKey={async () => {
              await window.aistudio?.openSelectKey();
            }}
            generationProvider="gemini"
            setGenerationProvider={() => {}}
            localLlmUrl=""
            setLocalLlmUrl={() => {}}
            savedDocuments={savedDocuments}
            isLoadingDocs={isLoadingDocs}
            onResumeSession={(storeName: string, docs: AnalyzedDocument[]) => {
              // Hydrate state from saved session
              setActiveRagStoreName(storeName);
              setAnalysisResult({
                batch_summary: "Restored Session",
                documents: docs,
                proposed_hierarchy_changes: "",
                archive_recommendations: [],
                notes_for_user: "",
              });
              setStatus(AppStatus.Chatting);
            }}
          />
        );

      case AppStatus.UploadingStateInput:
        return (
          <WelcomeScreen
            onUpload={handleUploadAndAnalyze}
            apiKeyError={apiKeyError}
            files={files}
            setFiles={setFiles}
            isApiKeySelected={isApiKeySelected}
            onSelectKey={async () => {
              await window.aistudio?.openSelectKey();
            }}
            generationProvider="gemini"
            setGenerationProvider={() => {}}
            localLlmUrl=""
            setLocalLlmUrl={() => {}}
            savedDocuments={[]} // Hide list in this mode
          />
        );

      case AppStatus.Uploading:
      case AppStatus.Analyzing:
        return (
          <ProgressBar
            progress={uploadProgress?.current || 0}
            total={uploadProgress?.total || 1}
            message={uploadProgress?.message || "Processing..."}
          />
        );
      case AppStatus.Results:
        return (
          <OrganizationResultView
            result={analysisResult}
            existingDocuments={savedDocuments}
            uploadedFiles={files}
            onStartChat={handleStartChat}
            onReset={() => setStatus(AppStatus.Welcome)}
            onSave={handleSaveOrganization}
          />
        );
      case AppStatus.Chatting:
        return (
          <ChatInterface
            documentName="Public Health Knowledge Base"
            history={chatHistory}
            isQueryLoading={isQueryLoading}
            onSendMessage={handleSendMessage}
            onNewChat={() => setStatus(AppStatus.Welcome)}
            exampleQuestions={[
              "What protocols are available?",
              "Summarize recent reports.",
            ]}
          />
        );
      case AppStatus.Error:
        return (
          <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-600">
            <h1 className="text-3xl font-bold mb-4">Error</h1>
            <p>{error}</p>
            <button
              onClick={() => setStatus(AppStatus.Welcome)}
              className="mt-4 px-4 py-2 bg-white border border-red-200 rounded shadow-sm hover:bg-red-50 transition-colors"
            >
              Back
            </button>
          </div>
        );
      default:
        return <div>Unknown State</div>;
    }
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.20))] bg-aura-bg text-aura-text-primary font-sans rounded-xl overflow-hidden shadow-2xl border border-aura-text-primary/10 relative">
      <PageMetadata
        title="Public Health Organizer"
        description="Unified Knowledge Base for Public Health"
      />

      {/* Absolute Header Button for Gallery */}
      <div className="absolute top-4 right-6 z-20">
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white hover:bg-aura-surface text-aura-text-secondary hover:text-aura-text-primary rounded-full shadow-aura-sm hover:shadow-aura-md aura-transition"
        >
          <ClockIcon className="w-5 h-5" />
          <span className="font-medium">Saved Docs</span>
        </button>
      </div>

      {renderContent()}

      <DesignGallery
        title="Saved Documents Library"
        fetchEndpoint="/api/public-health/docs"
        deleteEndpoint="/api/public-health/docs"
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoad={handleLoadGalleryItem}
        sortOptions={
          [
            {
              label: "Newest First",
              value: "date-desc",
              compareFn: (a: unknown, b: unknown) => {
                const aDate = new Date(
                  (a as { uploaded_at?: string }).uploaded_at || 0,
                ).getTime();
                const bDate = new Date(
                  (b as { uploaded_at?: string }).uploaded_at || 0,
                ).getTime();
                return bDate - aDate;
              },
            },
            {
              label: "Oldest First",
              value: "date-asc",
              compareFn: (a: unknown, b: unknown) => {
                const aDate = new Date(
                  (a as { uploaded_at?: string }).uploaded_at || 0,
                ).getTime();
                const bDate = new Date(
                  (b as { uploaded_at?: string }).uploaded_at || 0,
                ).getTime();
                return aDate - bDate;
              },
            },
            {
              label: "By Category",
              value: "category",
              compareFn: (a: unknown, b: unknown) => {
                const aCat = (a as { category?: string }).category || "";
                const bCat = (b as { category?: string }).category || "";
                return aCat.localeCompare(bCat);
              },
            },
          ] as SortOption[]
        }
        filterConfig={
          [
            {
              type: "select",
              label: "Category",
              key: "category",
              options: [
                { label: "Protocol", value: "protocol" },
                { label: "Report", value: "report" },
                { label: "Guideline", value: "guideline" },
                { label: "General", value: "general" },
              ],
            },
          ] as FilterConfig[]
        }
        renderPreview={(item: {
          id: number;
          filename: string;
          uploaded_at: string;
          analysis: DocumentAnalysis;
          category?: string;
          tags?: string[];
        }) => (
          <div className="flex flex-col h-full gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <span className="block text-xs uppercase tracking-widest text-slate-500 mb-1">
                  Document Name
                </span>
                <p className="font-medium text-white break-all">
                  {item.filename}
                </p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <span className="block text-xs uppercase tracking-widest text-slate-500 mb-1">
                  Category
                </span>
                <p className="font-medium text-white capitalize">
                  {item.category || "General"}
                </p>
              </div>
            </div>

            {item.analysis && (
              <div className="flex-1 bg-slate-800 p-6 rounded-lg border border-slate-700 overflow-y-auto">
                <h4 className="text-lg font-bold text-white mb-4">
                  Analysis Summary
                </h4>
                <p className="text-slate-300 leading-relaxed mb-6">
                  {item.analysis.summary}
                </p>

                {item.analysis.keyPoints &&
                  item.analysis.keyPoints.length > 0 && (
                    <div>
                      <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Key Points
                      </h5>
                      <ul className="list-disc list-inside space-y-2 text-slate-300">
                        {item.analysis.keyPoints.map(
                          (point: string, i: number) => (
                            <li key={i}>{point}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
        renderItem={(item: {
          id: number;
          filename: string;
          version?: string;
          category?: string;
          tags?: string[];
        }) => (
          <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-blue-300 transition-colors cursor-pointer relative group">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100">
              <span className="bg-white border border-slate-200 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider text-slate-500">
                {item.category || "General"}
              </span>
            </div>
            <div className="mb-3">
              <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 mb-2 shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4
                className="font-bold text-slate-800 line-clamp-1 text-sm"
                title={item.filename}
              >
                {item.filename}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                v{item.version || "1.0"}
              </p>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-1 mt-2">
                {(item.tags || []).slice(0, 3).map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
                {(item.tags || []).length > 3 && (
                  <span className="text-[10px] text-slate-400 px-1">
                    +{(item.tags?.length || 0) - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default PublicHealthPage;
