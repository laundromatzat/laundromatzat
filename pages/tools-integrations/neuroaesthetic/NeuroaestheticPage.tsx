import React, { useState, useRef } from "react";
import PageMetadata from "../../../components/PageMetadata";
import { AppState, AnalysisResult, UserPreferences } from "./types";
import { AnalysisDisplay } from "./components/AnalysisDisplay";
import { ComparisonView } from "./components/ComparisonView";
import { Loader } from "./components/Loader";
import {
  analyzeRoom,
  generateNeuroaestheticImage,
} from "./services/geminiService";

const NeuroaestheticPage: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);
  const [base64Images, setBase64Images] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [improvedImageBase64, setImprovedImageBase64] = useState<string | null>(
    null
  );
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [preferences] = useState<UserPreferences>({
    sensitivities: "",
    colorPreferences: "",
    designGoals: "General Well-being",
  });
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

  const handleVisualize = async () => {
    if (!analysis || base64Images.length === 0) return;
    setAppState(AppState.GENERATING);

    try {
      const generatedBase64 = await generateNeuroaestheticImage(
        base64Images[0],
        analysis,
        preferences
      );
      setImprovedImageBase64(generatedBase64);
      // Add to history
      setHistory([...history.slice(0, historyIndex + 1), generatedBase64]);
      setHistoryIndex(historyIndex + 1);
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
        preferences
      );
      setImprovedImageBase64(generatedBase64);
      // Replace current history item
      const newHistory = [
        ...history.slice(0, historyIndex + 1),
        generatedBase64,
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
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

  return (
    <div className="min-h-screen bg-slate-900">
      <PageMetadata
        title="Neuroaesthetic Lens"
        description="Reimagine environments using neuroaesthetic principles."
      />

      {appState === AppState.UPLOAD && (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif text-white mb-4">
              Neuroaesthetic Lens
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-2">
              Analyze and transform spaces based on how the brain perceives
              beauty and environment.
            </p>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Upload 1-3 images of a room for comprehensive analysis using
              principles of biophilia, prospect-refuge, and fractal fluency.
            </p>
          </div>

          <div
            className="border-2 border-dashed border-slate-700 rounded-2xl p-16 text-center hover:border-emerald-500/50 hover:bg-slate-800/30 transition-all cursor-pointer"
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
              className="w-16 h-16 text-slate-600 mx-auto mb-4"
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
            <p className="text-slate-300 font-medium mb-2">
              Click to upload room photos
            </p>
            <p className="text-slate-500 text-sm">
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
