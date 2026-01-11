/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Mic, Upload, Sparkles, FolderOpen, Settings2 } from "lucide-react";
import Container from "../components/Container";
import PageMetadata from "../components/PageMetadata";
import AudioRecorder from "./tools-integrations/media-insight/components/AudioRecorder";
import FileUploader from "./tools-integrations/media-insight/components/FileUploader";
import FileSystemExplorer from "./tools-integrations/media-insight/components/FileSystemExplorer";
import FileActionsPanel from "./tools-integrations/media-insight/components/FileActionsPanel";
import AnalysisDisplay from "./tools-integrations/media-insight/components/AnalysisDisplay";
import Button from "./tools-integrations/media-insight/components/Button";
import SettingsPanel from "./tools-integrations/media-insight/components/SettingsPanel";
import { analyzeMedia } from "./tools-integrations/media-insight/services/mediaInsightService";
import "./tools-integrations/media-insight/electron.d.ts";
import {
  AppStatus,
  MediaInput,
  AnalysisResult,
  MediaType,
  WorkspaceFile,
} from "./tools-integrations/media-insight/types";
import { saveAnalysis, getAnalysis } from "../services/mediaInsightStorage";

function MediaInsightPage(): React.ReactNode {
  const [mode, setMode] = useState<"record" | "upload" | "workspace">("record");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [mediaData, setMediaData] = useState<MediaInput | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Workspace State
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);

  // Storage (history panel UI to be added in follow-up)
  // const [history, setHistory] = useState<StoredAnalysis[]>([]);

  // Load history on mount (ready for history panel)
  useEffect(() => {
    loadAnalyses().catch(console.error);
  }, []);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check if running in Electron
  const isElectron =
    typeof window !== "undefined" && window.electronAPI?.isElectron === true;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === "processing") {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + (p < 50 ? 10 : 2)));
      }, 500);
    } else if (status === "success") {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleMediaReady = (data: MediaInput) => {
    setMediaData(data);
    setError(null);
    setResult(null);
  };

  const openWorkspace = async () => {
    if (isElectron && window.electronAPI) {
      // Use Electron API
      try {
        const result = await window.electronAPI.selectWorkspace();
        if (result) {
          const files: WorkspaceFile[] = result.files.map(
            (f: {
              name: string;
              path: string;
              type: string;
              modified: Date;
            }) => {
              // Check for cached analysis
              const cached = getAnalysis(f.path, f.modified.getTime());

              // Generate thumbnail if missing (async, will update state later)
              if (window.electronAPI!.generateThumbnail) {
                window.electronAPI!.generateThumbnail(f.path).then((thumb) => {
                  if (thumb) {
                    setWorkspaceFiles((prev) =>
                      prev.map((pf) =>
                        pf.path === f.path ? { ...pf, thumbnail: thumb } : pf
                      )
                    );
                    // Update cache if we have analysis but no thumbnail
                    if (cached && !cached.thumbnail) {
                      saveAnalysis(
                        f.path,
                        f.name,
                        cached.result,
                        thumb,
                        f.modified.getTime()
                      );
                    }
                  }
                });
              }

              return {
                name: f.name,
                path: f.path,
                type: f.type as MediaType,
                status: (cached ? "done" : "pending") as AppStatus,
                analysisResult: cached?.result,
                lastModified: f.modified.getTime(),
                thumbnail: cached?.thumbnail,
              };
            }
          );

          setWorkspaceFiles(files);
          setWorkspacePath(result.path);
          setMode("workspace");
          setStatus("workspace_active");
          setError(null);
        }
      } catch (err) {
        console.error("Electron workspace access failed:", err);
        setError("Failed to access workspace directory. Please try again.");
      }
    } else {
      // Browser API fallback
      if (!("showDirectoryPicker" in window)) {
        setError(
          "Workspace mode requires the File System Access API, which is currently only supported in Chrome, Edge, and Opera browsers. Please use one of these browsers to access workspace features."
        );
        return;
      }

      try {
        const handle = await (
          window as Window & {
            showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
          }
        ).showDirectoryPicker();
        const files: WorkspaceFile[] = [];

        for await (const entry of handle.values()) {
          if (entry.kind === "file") {
            const type = getMediaType(entry.name);
            if (type) {
              files.push({
                name: entry.name,
                handle: entry,
                type,
                status: "pending",
              });
            }
          }
        }
        setWorkspaceFiles(files);
        setMode("workspace");
        setStatus("workspace_active");
        setError(null);
      } catch (err) {
        console.error("Workspace access failed:", err);
        if ((err as Error).name !== "AbortError") {
          setError("Failed to access workspace directory. Please try again.");
        }
      }
    }
  };

  const getMediaType = (filename: string): MediaType | null => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["mp3", "wav", "webm", "ogg"].includes(ext!)) return "audio";
    if (["jpg", "jpeg", "png", "webp"].includes(ext!)) return "image";
    if (["mp4", "mov", "webm"].includes(ext!)) return "video";
    return null;
  };

  const selectWorkspaceFile = async (wFile: WorkspaceFile) => {
    if (wFile.status === "done" && wFile.analysisResult) {
      setResult(wFile.analysisResult);
      setSelectedFile(wFile);
      return;
    }

    setStatus("processing");
    setResult(null);

    try {
      let base64: string;
      let mimeType: string;

      if (isElectron && window.electronAPI && wFile.path) {
        // Use Electron API
        base64 = await window.electronAPI.readFile(wFile.path);
        // Get mime type from file extension
        const ext = wFile.name.split(".").pop()?.toLowerCase() || "";
        const mimeTypes: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          mp4: "video/mp4",
          mov: "video/quicktime",
          webm: "video/webm",
          mp3: "audio/mpeg",
          wav: "audio/wav",
          m4a: "audio/mp4",
          ogg: "audio/ogg",
        };
        mimeType = mimeTypes[ext] || "application/octet-stream";
      } else {
        // Browser API
        const file = await wFile.handle.getFile();
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onloadend = resolve;
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        base64 = (reader.result as string).split(",")[1];
        mimeType = file.type;
      }

      const result = await analyzeMedia(
        base64,
        mimeType,
        wFile.type,
        wFile.name
      );

      setWorkspaceFiles((prev) =>
        prev.map((f) => {
          if (f.name === wFile.name || f.path === wFile.path) {
            const updated = {
              ...f,
              status: "done" as AppStatus,
              analysisResult: result,
            };

            // Save to persistence cache
            if (f.path) {
              saveAnalysis(f.path, f.name, result, f.thumbnail, f.lastModified);
            }

            return updated;
          }
          return f;
        })
      );
      setResult(result);
      // Update selected file
      const updatedFile = {
        ...wFile,
        status: "done" as AppStatus,
        analysisResult: result,
      };
      setSelectedFile(updatedFile);
      setStatus("success");
    } catch {
      setError("Failed to process file.");
      setStatus("error");
    }
  };

  const handleOpenFile = async (wFile: WorkspaceFile) => {
    if (isElectron && window.electronAPI?.openFile && wFile.path) {
      const result = await window.electronAPI.openFile(wFile.path);
      if (!result.success) {
        console.error("Failed to open file:", result.error);
        alert(`Failed to open file: ${result.error}`);
      }
    } else {
      alert("Opening files is only supported in the desktop app.");
    }
  };

  const handleRename = async (wFile: WorkspaceFile) => {
    if (!wFile.analysisResult?.suggestedName) return;

    try {
      if (isElectron && window.electronAPI && wFile.path) {
        // Use Electron API
        const newPath = await window.electronAPI.renameFile(
          wFile.path,
          wFile.analysisResult.suggestedName
        );

        // Also set metadata
        await window.electronAPI.setMetadata(newPath, {
          tags: wFile.analysisResult.tags,
          summary: wFile.analysisResult.summary,
        });

        setWorkspaceFiles((prev) =>
          prev.map((f) =>
            f.path === wFile.path
              ? {
                  ...f,
                  name: wFile.analysisResult!.suggestedName!,
                  path: newPath,
                }
              : f
          )
        );
        alert(`Renamed and tagged: ${wFile.analysisResult.suggestedName}`);
      } else {
        // Browser API (requires Chrome 100+)
        await (
          wFile.handle as FileSystemFileHandle & {
            move: (name: string) => Promise<void>;
          }
        ).move(wFile.result.suggestedName);
        setWorkspaceFiles((prev) =>
          prev.map((f) =>
            f.name === wFile.name
              ? { ...f, name: wFile.result!.suggestedName! }
              : f
          )
        );
        alert(`Renamed to: ${wFile.result.suggestedName}`);
      }
    } catch (err) {
      console.error("Rename failed:", err);
      alert("Rename failed: " + (err as Error).message);
    }
  };

  const handleOrganize = async () => {
    if (isElectron && window.electronAPI && workspacePath) {
      // Build operations from analyzed files
      const operations = workspaceFiles
        .filter((f) => f.status === "done" && f.result)
        .map((f) => ({
          oldPath: f.path || "",
          newName: f.result!.suggestedName || f.name,
          category: f.result!.tags?.[0] || "uncategorized",
          metadata: {
            tags: f.result!.tags,
            summary: f.result!.summary,
            category: f.result!.tags?.[0],
          },
        }));

      try {
        setStatus("processing");
        const results = await window.electronAPI.organizeFiles(
          workspacePath,
          operations
        );

        const successCount = results.filter((r) => r.success).length;
        alert(`Organized ${successCount} of ${results.length} files!`);

        // Refresh workspace
        openWorkspace();
      } catch (err) {
        setError("Organization failed: " + (err as Error).message);
      } finally {
        setStatus("idle");
      }
    } else {
      alert(
        "Smart Organize requires the Desktop App for actual file movement. In browser mode, this is a simulation only."
      );
    }
  };

  const handleAnalyze = async () => {
    if (!mediaData) return;
    setStatus("processing");
    setError(null);
    try {
      const data = await analyzeMedia(
        mediaData.base64,
        mediaData.mimeType,
        mediaData.type,
        mediaData.name
      );
      setResult(data);
      setStatus("success");

      // Save to storage after successful analysis
      await persistAnalysis({
        id: `analysis-${Date.now()}`,
        mediaInput: mediaData,
        result: data,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
      setStatus("error");
    }
  };

  const mediaPreviewUrl = useMemo(
    () => (mediaData ? URL.createObjectURL(mediaData.blob) : null),
    [mediaData]
  );

  return (
    <Container className="space-y-space-5 pt-8">
      <PageMetadata
        title="MediaInsight Pro"
        description="Analyze audio, video, and images with AI-powered transcription and insights."
        path="/tools/media-insight"
        type="article"
      />

      <section className="space-y-4">
        <div className="flex items-center gap-4 text-aura-text-secondary">
          <Link to="/tools" className="text-brand-accent hover:underline">
            ← back to tools
          </Link>
          <span className="text-sm">AI-powered media analysis</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-aura-text-primary">
          MediaInsight Pro
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-lg text-aura-text-secondary max-w-2xl">
            Analyze audio, video, and images with AI-powered transcription,
            visual analysis, and intelligent tagging.
          </p>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-brand-secondary/10 rounded-lg transition-colors shrink-0"
            aria-label="Settings"
            title="AI Model Settings"
          >
            <Settings2
              size={24}
              className="text-aura-text-secondary hover:text-brand-accent"
            />
          </button>
        </div>
      </section>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar for Workspace */}
        {mode === "workspace" && (
          <aside className="lg:w-72 shrink-0">
            <FileSystemExplorer
              files={workspaceFiles}
              onSelectFile={selectWorkspaceFile}
              onRename={handleRename}
              onOrganize={handleOrganize}
              onOpenFile={handleOpenFile}
              activeFileName={result?.suggestedName}
            />
          </aside>
        )}

        <main className="flex-1 space-y-6">
          {/* Mode Switcher */}
          <div className="bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-brand-secondary/40 inline-flex transition-colors">
            <button
              onClick={() => {
                setMode("record");
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "record" ? "bg-brand-accent text-brand-on-accent" : "text-aura-text-secondary hover:text-aura-text-primary"}`}
            >
              <Mic size={16} className="inline mr-2" />
              Record
            </button>
            <button
              onClick={() => {
                setMode("upload");
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "upload" ? "bg-brand-accent text-brand-on-accent" : "text-aura-text-secondary hover:text-aura-text-primary"}`}
            >
              <Upload size={16} className="inline mr-2" />
              Upload
            </button>
            <button
              onClick={openWorkspace}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "workspace" ? "bg-brand-accent text-brand-on-accent" : "text-aura-text-secondary hover:text-aura-text-primary"}`}
            >
              <FolderOpen size={16} className="inline mr-2" />
              Workspace
            </button>
          </div>

          {mode !== "workspace" && !result && status !== "processing" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-brand-secondary/40 shadow-sm">
              {mode === "record" ? (
                <AudioRecorder
                  onAudioCaptured={(d) =>
                    handleMediaReady({
                      ...d,
                      name: "recording.webm",
                      type: "audio",
                    })
                  }
                />
              ) : (
                <FileUploader onFileSelected={handleMediaReady} />
              )}
              {mediaData && (
                <div className="mt-8 pt-6 border-t border-brand-secondary/30 flex flex-col items-center">
                  {mediaData.type === "image" && (
                    <img
                      src={mediaPreviewUrl!}
                      alt="Preview"
                      className="max-h-64 rounded-lg shadow-sm mb-4"
                    />
                  )}
                  <Button
                    onClick={handleAnalyze}
                    isLoading={status === "processing"}
                    icon={<Sparkles size={16} />}
                  >
                    Analyze File
                  </Button>
                </div>
              )}
            </div>
          )}

          {status === "processing" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-brand-secondary/40">
              <div className="w-16 h-16 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-2 text-aura-text-primary">
                Analyzing...
              </h3>
              <div className="max-w-xs mx-auto h-2 bg-brand-secondary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
              {error}
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Analysis Display - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {result.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-brand-accent/10 text-brand-accent text-xs font-bold rounded uppercase tracking-wider"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {mode !== "workspace" && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setResult(null);
                        setMediaData(null);
                        setStatus("idle");
                      }}
                    >
                      New Analysis
                    </Button>
                  )}
                </div>
                <AnalysisDisplay data={result} />
              </div>

              {/* File Actions Panel - Takes 1 column, only in workspace mode */}
              {mode === "workspace" && (
                <div className="lg:col-span-1">
                  <FileActionsPanel
                    file={selectedFile}
                    onRename={handleRename}
                    onOrganize={handleOrganize}
                    onOpenFile={handleOpenFile}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </Container>
  );
}

export default MediaInsightPage;
