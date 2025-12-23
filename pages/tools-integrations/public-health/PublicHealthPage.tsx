/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
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
import PageMetadata from "../../../components/PageMetadata";

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
    null
  );

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [files, setFiles] = useState<File[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);

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
      const res = await fetch("/api/public-health/docs", {
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
      `${message}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ""}`
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
        fileNames
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
          const res = await fetch("/api/public-health/docs", {
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
        })
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

      // We need a state for "User selecting files from Dashboard"
      // Re-using WelcomeScreen or a Modal would be best.
      // For simplicity, let's use a conditional in Dashboard or a specific status.
      // Let's add specific status for "SelectingFiles" if needed, or just let WelcomeScreen handle it?
      // Actually, WelcomeScreen IS the upload screen essentially.
      case AppStatus.UploadingStateInput: // Custom internal status mapping
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
          <div className="flex flex-col items-center justify-center h-full bg-red-900/20 text-red-300">
            <h1 className="text-3xl font-bold mb-4">Error</h1>
            <p>{error}</p>
            <button
              onClick={() => setStatus(AppStatus.Welcome)}
              className="mt-4 px-4 py-2 bg-slate-200 rounded"
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
    <div className="h-[calc(100vh-theme(spacing.20))] bg-slate-900 text-white font-sans rounded-xl overflow-hidden shadow-2xl">
      <PageMetadata
        title="Public Health Organizer"
        description="Unified Knowledge Base for Public Health"
      />
      {renderContent()}
    </div>
  );
};

export default PublicHealthPage;
