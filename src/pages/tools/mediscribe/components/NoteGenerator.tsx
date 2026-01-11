import React, { useState } from "react";
import { useLoading } from "@/context/LoadingContext";
import {
  generateClinicalNote,
  analyzeStyleDiff,
  parseClinicalNote,
} from "../services/llmService";
import { TrainingExample, UserSettings } from "../types";
import { Button } from "./Button";
import {
  Wand2,
  Save,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Edit3,
  LayoutTemplate,
} from "lucide-react";

interface NoteGeneratorProps {
  settings: UserSettings;
  examples: TrainingExample[];
  onLearn: (example: TrainingExample) => void;
}

export const NoteGenerator: React.FC<NoteGeneratorProps> = ({
  settings,
  examples,
  onLearn,
}) => {
  const { setIsLoading: setGlobalLoading } = useLoading();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [originalOutput, setOriginalOutput] = useState(""); // Store initial generation to compare for edits
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [learningInsight, setLearningInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // View mode: 'smart' (formatted) or 'raw' (edit)
  const [viewMode, setViewMode] = useState<"smart" | "raw">("smart");

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setGlobalLoading(true);
    setError(null);
    setLearningInsight(null);

    try {
      const result = await generateClinicalNote({
        shorthand: input,
        examples: examples,
        settings: settings,
      });
      setOutput(result);
      setOriginalOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsGenerating(false);
      setGlobalLoading(false);
    }
  };

  const handleSaveAsExample = async () => {
    if (!input.trim() || !output.trim()) return;

    // Check if user made edits
    const hasEdits = output.trim() !== originalOutput.trim();
    let insight = null;

    if (hasEdits && settings.provider === "GEMINI") {
      setIsLearning(true);
      try {
        // Use Gemini Flash Lite to analyze the diff
        setGlobalLoading(true);
        insight = await analyzeStyleDiff(originalOutput, output);
        setLearningInsight(insight);
      } catch (e) {
        console.error("Analysis failed", e);
      } finally {
        setIsLearning(false);
        setGlobalLoading(false);
      }
    }

    onLearn({
      id: crypto.randomUUID(),
      shorthand: input,
      fullNote: output, // Saves the EDITED version
      timestamp: Date.now(),
    });

    if (!insight) {
      alert(
        "Saved! The model will use this note to improve future generations."
      );
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSmartView = () => {
    const sections = parseClinicalNote(output);

    if (sections.length === 0 && !output) {
      return (
        <div className="h-full flex items-center justify-center text-slate-400 italic">
          Generated note will appear here.
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto space-y-4 pr-2">
        {sections.map((section, idx) => {
          let borderColor = "border-slate-200";
          let bgColor = "bg-white";
          let titleColor = "text-slate-500";

          switch (section.type) {
            case "subjective":
              borderColor = "border-blue-200";
              bgColor = "bg-blue-50/30";
              titleColor = "text-blue-700";
              break;
            case "objective":
              borderColor = "border-green-200";
              bgColor = "bg-green-50/30";
              titleColor = "text-green-700";
              break;
            case "assessment":
            case "plan":
              borderColor = "border-purple-200";
              bgColor = "bg-purple-50/30";
              titleColor = "text-purple-700";
              break;
          }

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${borderColor} ${bgColor} relative group transition-all hover:shadow-sm`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-wider mb-2 ${titleColor} flex items-center justify-between`}
              >
                {section.title || section.type}
              </div>
              <div className="text-sm text-slate-800 whitespace-pre-wrap font-serif leading-relaxed">
                {section.content}
              </div>
            </div>
          );
        })}
        <div className="text-center pt-4">
          <button
            onClick={() => setViewMode("raw")}
            className="text-xs text-slate-400 hover:text-blue-600 underline"
          >
            Switch to Raw Text to Edit
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Input Section */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        <div className="mb-4 flex justify-between items-center">
          <label
            htmlFor="shorthand-input"
            className="text-sm font-bold text-slate-700 uppercase tracking-wider"
          >
            Clinical Shorthand / Dictation
          </label>
          <span className="text-xs text-slate-400">{input.length} chars</span>
        </div>
        <textarea
          id="shorthand-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed shadow-sm"
          placeholder="Enter patient details here (e.g., 'Pt 34m pres w/ severe HA x2d...')"
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 italic">
            {settings.provider === "GEMINI"
              ? settings.useThinkingMode
                ? "Using Gemini 3.0 Pro (Thinking)"
                : "Using Gemini 2.5 Flash Lite"
              : "Using Local Model"}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!input.trim()}
            isLoading={isGenerating}
            className="w-full md:w-auto"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Note
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-800 text-sm rounded-lg border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="font-semibold text-red-900">
                  Generation Failed
                </div>
                <p className="text-red-700">{error}</p>

                <div className="bg-white/60 p-3 rounded border border-red-100 mt-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-red-500 block mb-1">
                    Troubleshooting Tip
                  </span>
                  <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                    {settings.provider === "LOCAL" ? (
                      <>
                        <li>
                          Ensure your local model server (e.g., Ollama) is
                          running.
                        </li>
                        <li>
                          Check if CORS is configured (e.g.,
                          OLLAMA_ORIGINS=&quot;*&quot;).
                        </li>
                        <li>
                          Verify the model name in settings matches exactly.
                        </li>
                      </>
                    ) : (
                      <>
                        <li>Check your internet connection.</li>
                        <li>
                          If &apos;Thinking Mode&apos; is on, try disabling it
                          for faster processing.
                        </li>
                        <li>The API might be experiencing high traffic.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output Section */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Generated Clinical Note
          </span>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            {/* View Toggle */}
            <button
              onClick={() => setViewMode("smart")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === "smart" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              title="Smart View (Detected Sections)"
            >
              <LayoutTemplate className="w-4 h-4 inline mr-1" />
              Smart
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === "raw" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              title="Raw Text (Edit Mode)"
            >
              <Edit3 className="w-4 h-4 inline mr-1" />
              Edit
            </button>
          </div>

          <div className="flex gap-1 ml-4 border-l pl-4 border-slate-200">
            {output && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !input.trim()}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1 disabled:opacity-50"
                title="Regenerate Response"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isGenerating ? "animate-spin text-blue-600" : ""}`}
                />
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              title="Copy to Clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                setOutput("");
                setLearningInsight(null);
                setOriginalOutput("");
                setError(null);
              }}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Clear"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative group bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
          {viewMode === "smart" ? (
            <div className="w-full h-full p-4 bg-slate-50/50">
              {renderSmartView()}
            </div>
          ) : (
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full h-full p-6 bg-transparent focus:bg-white focus:ring-0 focus:outline-none transition-all resize-none text-sm leading-7 text-slate-800 font-serif"
              placeholder="Generated note will appear here. You can edit this text directly."
            />
          )}

          {output && (
            <div className="absolute bottom-4 right-4 opacity-100 transition-opacity flex flex-col items-end gap-2 z-10">
              {learningInsight && (
                <div className="mb-2 p-4 bg-purple-50 border border-purple-200 rounded-lg shadow-lg max-w-sm animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-2 text-purple-700 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    Learned from your edits
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {learningInsight}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSaveAsExample}
                variant="secondary"
                isLoading={isLearning}
                className="shadow-lg border border-slate-200 bg-white/90 backdrop-blur hover:bg-white"
                title="Save this input/output pair to train the model on your style"
              >
                {isLearning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 text-green-600" />
                    Save & Learn Style
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400 text-center">
          {viewMode === "smart"
            ? 'Switch to "Edit" mode to make changes.'
            : 'Edit the output above if needed, then click "Save & Learn Style".'}
        </p>
      </div>
    </div>
  );
};
