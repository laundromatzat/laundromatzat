import React, { useState, useRef } from "react";
import PageMetadata from "../../../components/PageMetadata";
import { AppState, AnalysisResult, UserPreferences } from "./types";
import { AnalysisDisplay } from "./components/AnalysisDisplay";
import { ComparisonView } from "./components/ComparisonView";
import { Loader } from "./components/Loader";
import { analyzeRoom, generateNeuroaestheticImage } from "./services/geminiService";

const NeuroaestheticPage: React.FC = () =&gt; {
  const [appState, setAppState] = useState&lt;AppState&gt;(AppState.UPLOAD);
  const [selectedImages, setSelectedImages] = useState&lt;File[]&gt;([]);
  const [imageSrcs, setImageSrcs] = useState&lt;string[]&gt;([]);
  const [base64Images, setBase64Images] = useState&lt;string[]&gt;([]);
  const [analysis, setAnalysis] = useState&lt;AnalysisResult | null&gt;(null);
  const [improvedImageBase64, setImprovedImageBase64] = useState&lt;string | null&gt;(null);
  const [history, setHistory] = useState&lt;string[]&gt;([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [preferences] = useState&lt;UserPreferences&gt;({
    sensitivities: "",
    colorPreferences: "",
    designGoals: "General Well-being",
  });
  const fileInputRef = useRef&lt;HTMLInputElement&gt;(null);

  const handleFileSelect = async (e: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt; {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedImages(files);
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

  const handleVisualize = async () =&gt; {
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

  const handleReset = () =&gt; {
    setAppState(AppState.UPLOAD);
    setSelectedImages([]);
    setImageSrcs([]);
    setBase64Images([]);
    setAnalysis(null);
    setImprovedImageBase64(null);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleUndo = () =&gt; {
    if (historyIndex &gt; 0) {
      setHistoryIndex(historyIndex - 1);
      setImprovedImageBase64(history[historyIndex - 1]);
    }
  };

  const handleRedo = () =&gt; {
    if (historyIndex &lt; history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setImprovedImageBase64(history[historyIndex + 1]);
    }
  };

  const handleRegenerate = async () =&gt; {
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
      const newHistory = [...history.slice(0, historyIndex + 1), generatedBase64];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setAppState(AppState.COMPARISON);
    } catch (error) {
      console.error("Regeneration failed:", error);
      alert("Regeneration failed. Please try again.");
      setAppState(AppState.COMPARISON);
    }
  };

  const fileToDataUrl = (file: File): Promise&lt;string&gt; =&gt; {
    return new Promise((resolve, reject) =&gt; {
      const reader = new FileReader();
      reader.onload = () =&gt; resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    &lt;div className="min-h-screen bg-slate-900"&gt;
      &lt;PageMetadata
        title="Neuroaesthetic Lens"
        description="Reimagine environments using neuroaesthetic principles."
      /&gt;

      {appState === AppState.UPLOAD &amp;&amp; (
        &lt;div className="container mx-auto px-4 py-16 max-w-4xl"&gt;
          &lt;div className="text-center mb-12"&gt;
            &lt;h1 className="text-5xl font-serif text-white mb-4"&gt;
              Neuroaesthetic Lens
            &lt;/h1&gt;
            &lt;p className="text-slate-300 text-lg max-w-2xl mx-auto mb-2"&gt;
              Analyze and transform spaces based on how the brain perceives beauty and environment.
            &lt;/p&gt;
            &lt;p className="text-slate-500 text-sm max-w-xl mx-auto"&gt;
              Upload 1-3 images of a room for comprehensive analysis using principles of biophilia, prospect-refuge, and fractal fluency.
            &lt;/p&gt;
          &lt;/div&gt;

          &lt;div
            className="border-2 border-dashed border-slate-700 rounded-2xl p-16 text-center hover:border-emerald-500/50 hover:bg-slate-800/30 transition-all cursor-pointer"
            onClick={() =&gt; fileInputRef.current?.click()}
          &gt;
            &lt;svg
              className="w-16 h-16 text-slate-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            &gt;
              &lt;path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              /&gt;
            &lt;/svg&gt;
            &lt;p className="text-slate-300 font-medium mb-2"&gt;
              Click to upload room photos
            &lt;/p&gt;
            &lt;p className="text-slate-500 text-sm"&gt;
              Supports JPEG, PNG • Up to 3 images
            &lt;/p&gt;
            &lt;input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            /&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      {appState === AppState.ANALYZING &amp;&amp; (
        &lt;Loader text="Analyzing neuroaesthetic properties..." /&gt;
      )}

      {appState === AppState.RESULTS &amp;&amp; analysis &amp;&amp; (
        &lt;AnalysisDisplay
          imageSrcs={imageSrcs}
          analysis={analysis}
          onVisualize={handleVisualize}
        /&gt;
      )}

      {appState === AppState.GENERATING &amp;&amp; (
        &lt;Loader text="Generating neuroaesthetic improvements..." /&gt;
      )}

      {appState === AppState.COMPARISON &amp;&amp; improvedImageBase64 &amp;&amp; imageSrcs[0] &amp;&amp; (
        &lt;ComparisonView
          originalImage={imageSrcs[0]}
          improvedImage={improvedImageBase64}
          onReset={handleReset}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onRegenerate={handleRegenerate}
          canUndo={historyIndex &gt; 0}
          canRedo={historyIndex &lt; history.length - 1}
        /&gt;
      )}
    &lt;/div&gt;
  );
};

export default NeuroaestheticPage;
