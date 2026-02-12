import React, { useState, useRef } from "react";
import PageMetadata from "@/components/PageMetadata";
import { AppState, AnalysisResult, UserPreferences } from "./types";
import { AnalysisDisplay } from "./components/AnalysisDisplay";
import { ComparisonView } from "./components/ComparisonView";
import { Loader } from "./components/Loader";
import { DesignGallery, SortOption } from "@/components/DesignGallery";
import { ClockIcon } from "@heroicons/react/24/outline";
import {
  analyzeRoom,
  generateNeuroaestheticImage,
} from "./services/geminiService";
import { getApiUrl } from "@/utils/api";

const NeuroaestheticPage: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);
  const [base64Images, setBase64Images] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [improvedImageBase64, setImprovedImageBase64] = useState<string | null>(
    null,
  );
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [preferences] = useState<UserPreferences>({
    sensitivities: "",
    colorPreferences: "",
    designGoals: "General Well-being",
  });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setAppState(AppState.ANALYZING);

    // Convert to base64
    const srcs: string[] = [];
    const b64: string[] = [];

    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      srcs.push(dataUrl);
      const base64Part = dataUrl.split(",")[1];
      b64.push(base64Part);
    }

    setImageSrcs(srcs);
    setBase64Images(b64);

    // Analyze
    try {
      const result = await analyzeRoom(b64, preferences);
      setAnalysis(result);
      setAppState(AppState.RESULTS);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. Please try again.");
      setAppState(AppState.UPLOAD);
    }
  };

  const saveToHistory = async (
    originalImg: string,
    generatedImg: string,
    analysisData: AnalysisResult,
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // User not logged in, skip save

      await fetch(getApiUrl("/api/neuroaesthetic/history"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalImage: originalImg,
          generatedImage: generatedImg,
          analysis: analysisData,
          preferencesSnapshot: preferences,
        }),
      });
    } catch (error) {
      console.error("Failed to save to history:", error);
      // Don't alert user - this is a background operation
    }
  };

  const handleVisualize = async () => {
    if (!analysis || base64Images.length === 0) return;
    setAppState(AppState.GENERATING);

    try {
      const generatedBase64 = await generateNeuroaestheticImage(
        base64Images[0],
        analysis,
        preferences,
      );
      setImprovedImageBase64(generatedBase64);
      // Add to history
      setHistory([...history.slice(0, historyIndex + 1), generatedBase64]);
      setHistoryIndex(historyIndex + 1);

      // Auto-save to backend
      await saveToHistory(imageSrcs[0], generatedBase64, analysis);

      setAppState(AppState.COMPARISON);
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Image generation failed. Please try again.");
      setAppState(AppState.RESULTS);
    }
  };

  const handleReset = () => {
    setAppState(AppState.UPLOAD);
    setImageSrcs([]);
    setBase64Images([]);
    setAnalysis(null);
    setImprovedImageBase64(null);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setImprovedImageBase64(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setImprovedImageBase64(history[historyIndex + 1]);
    }
  };

  const handleRegenerate = async () => {
    if (!analysis || base64Images.length === 0) return;
    setAppState(AppState.GENERATING);

    try {
      const generatedBase64 = await generateNeuroaestheticImage(
        base64Images[0],
        analysis,
        preferences,
      );
      setImprovedImageBase64(generatedBase64);
      // Replace current history item
      const newHistory = [
        ...history.slice(0, historyIndex + 1),
        generatedBase64,
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Auto-save to backend
      await saveToHistory(imageSrcs[0], generatedBase64, analysis);

      setAppState(AppState.COMPARISON);
    } catch (error) {
      console.error("Regeneration failed:", error);
      alert("Regeneration failed. Please try again.");
      setAppState(AppState.COMPARISON);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLoadHistoryItem = (item: {
    originalImage?: string;
    generatedImage?: string;
    analysis?: unknown;
  }) => {
    // Check if we have both original and generated images
    if (!item.originalImage || !item.generatedImage) {
      alert("This history item is incomplete.");
      return;
    }

    // Restore state
    setImageSrcs([item.originalImage]);
    setBase64Images([item.originalImage.split(",")[1] || ""]); // Basic heuristic
    setAnalysis(item.analysis);
    setImprovedImageBase64(item.generatedImage);
    setHistory([item.generatedImage]);
    setHistoryIndex(0);

    // Jump to comparison
    setAppState(AppState.COMPARISON);
  };

  return (
    <div className="min-h-screen bg-aura-bg relative">
      <PageMetadata
        title="Neuroaesthetic Lens"
        description="Reimagine environments using neuroaesthetic principles."
      />

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white hover:bg-aura-surface text-aura-text-secondary hover:text-aura-text-primary rounded-full shadow-aura-sm hover:shadow-aura-md aura-transition"
        >
          <ClockIcon className="w-5 h-5" />
          <span className="font-medium">History</span>
        </button>
      </div>

      <DesignGallery
        title="Design History"
        fetchEndpoint="/api/neuroaesthetic/history"
        deleteEndpoint="/api/neuroaesthetic/history"
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoad={handleLoadHistoryItem}
        sortOptions={
          [
            {
              label: "Newest First",
              value: "date-desc",
              compareFn: (a: unknown, b: unknown) => {
                const aDate = new Date(
                  (a as { timestamp?: string }).timestamp || 0,
                ).getTime();
                const bDate = new Date(
                  (b as { timestamp?: string }).timestamp || 0,
                ).getTime();
                return bDate - aDate;
              },
            },
            {
              label: "Oldest First",
              value: "date-asc",
              compareFn: (a: unknown, b: unknown) => {
                const aDate = new Date(
                  (a as { timestamp?: string }).timestamp || 0,
                ).getTime();
                const bDate = new Date(
                  (b as { timestamp?: string }).timestamp || 0,
                ).getTime();
                return aDate - bDate;
              },
            },
            {
              label: "Highest Biophilia",
              value: "biophilia-desc",
              compareFn: (a: unknown, b: unknown) => {
                const aScore =
                  (a as { analysis?: { scores?: { biophilia?: number } } })
                    .analysis?.scores?.biophilia || 0;
                const bScore =
                  (b as { analysis?: { scores?: { biophilia?: number } } })
                    .analysis?.scores?.biophilia || 0;
                return bScore - aScore;
              },
            },
            {
              label: "Highest Fractal Fluency",
              value: "fractal-desc",
              compareFn: (a: unknown, b: unknown) => {
                const aScore =
                  (a as { analysis?: { scores?: { fractalFluency?: number } } })
                    .analysis?.scores?.fractalFluency || 0;
                const bScore =
                  (b as { analysis?: { scores?: { fractalFluency?: number } } })
                    .analysis?.scores?.fractalFluency || 0;
                return bScore - aScore;
              },
            },
          ] as SortOption[]
        }
        renderPreview={(item: {
          originalImage?: string;
          generatedImage?: string;
          analysis?: {
            scores?: {
              biophilia?: number;
              fractalFluency?: number;
            };
            summary?: string;
          };
          timestamp?: string;
        }) => (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-400">
                  Original
                </span>
                <div className="aspect-video relative bg-black/40 rounded-lg overflow-hidden">
                  <img
                    src={item.originalImage}
                    alt="Original Room"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-emerald-400">
                  Generated
                </span>
                <div className="aspect-video relative bg-black/40 rounded-lg overflow-hidden">
                  <img
                    src={item.generatedImage}
                    alt="Neuroaesthetic Improvement"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h4 className="text-lg font-medium text-white mb-4">
                Analysis Summary
              </h4>
              <div className="flex gap-4 mb-4">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex-1">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Biophilia Score
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {item.analysis?.scores?.biophilia || "N/A"}
                  </div>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex-1">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Fractal Fluency
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {item.analysis?.scores?.fractalFluency || "N/A"}
                  </div>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed text-sm">
                {item.analysis?.summary}
              </p>
            </div>
          </div>
        )}
        renderItem={(item: {
          originalImage?: string;
          generatedImage?: string;
          analysis?: {
            biophilia_score?: number;
            fractal_fluency_score?: number;
          };
          timestamp?: string;
        }) => (
          <div className="flex flex-col h-full">
            <div className="aspect-video relative bg-black/40">
              <img
                src={item.generatedImage}
                alt="Generated Design"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
            </div>
            <div className="p-4 flex-1">
              <h4 className="font-medium text-white mb-2 line-clamp-1">
                Neuroaesthetic Analysis
              </h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {item.analysis?.scores?.biophilia > 70 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    High Biophilia
                  </span>
                )}
                {item.analysis?.scores?.fractalFluency > 70 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    High Fractal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-3">
                {item.analysis?.summary || "No summary available."}
              </p>
            </div>
          </div>
        )}
      />

      {appState === AppState.UPLOAD && (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif text-aura-text-primary mb-4">
              Neuroaesthetic Lens
            </h1>
            <p className="text-aura-text-secondary text-lg max-w-2xl mx-auto mb-2">
              Analyze and transform spaces based on how the brain perceives
              beauty and environment.
            </p>
            <p className="text-aura-text-secondary/70 text-sm max-w-xl mx-auto">
              Upload 1-3 images of a room for comprehensive analysis using
              principles of biophilia, prospect-refuge, and fractal fluency.
            </p>
          </div>

          <div
            className="border-2 border-dashed border-aura-border rounded-2xl p-16 text-center hover:border-aura-accent hover:bg-white/50 transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload room photos"
          >
            <svg
              className="w-16 h-16 text-aura-text-secondary mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-aura-text-primary font-medium mb-2">
              Click to upload room photos
            </p>
            <p className="text-aura-text-secondary text-sm">
              Supports JPEG, PNG • Up to 3 images
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {appState === AppState.ANALYZING && (
        <Loader text="Analyzing neuroaesthetic properties..." />
      )}

      {appState === AppState.RESULTS && analysis && (
        <AnalysisDisplay
          imageSrcs={imageSrcs}
          analysis={analysis}
          onVisualize={handleVisualize}
        />
      )}

      {appState === AppState.GENERATING && (
        <Loader text="Generating neuroaesthetic improvements..." />
      )}

      {appState === AppState.COMPARISON &&
        improvedImageBase64 &&
        imageSrcs[0] && (
          <ComparisonView
            originalImage={imageSrcs[0]}
            improvedImage={improvedImageBase64}
            onReset={handleReset}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onRegenerate={handleRegenerate}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
        )}
    </div>
  );
};

export default NeuroaestheticPage;
