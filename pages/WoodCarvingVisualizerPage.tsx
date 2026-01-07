import React, { useState } from "react";
import {
  CarvingVariation,
  Unit,
  generateCarvingPlan,
  generateCarvingVariations,
  GeneratedDesign,
} from "../services/woodCarvingService";
import { Camera, Check, Ruler, Wand2, Edit, RefreshCw } from "lucide-react";
import CutCalculator from "../components/wood-carving/CutCalculator";
import { ImageAnnotator } from "../components/wood-carving/ImageAnnotator";

const EXAMPLE_DESCRIPTIONS = [
  "A majestic eagle landing on a branch, realistic style",
  "Geometric low-poly bear head",
  "Celtic knot pattern on a walking stick handle",
  "Art Nouveau floral relief panel",
];

const WoodCarvingVisualizerPage: React.FC = () => {
  // Application Phase State
  // 0: Input, 1: Generating Variations, 2: Select Variation, 3: Generating Blueprint, 4: Blueprint Ready
  const [phase, setPhase] = useState<number>(0);

  // Inputs
  const [description, setDescription] = useState("");
  const [userNotes, setUserNotes] = useState("");

  // Data State
  const [variations, setVariations] = useState<CarvingVariation[]>([]);
  const [selectedVariation, setSelectedVariation] =
    useState<CarvingVariation | null>(null);
  const [designData, setDesignData] = useState<GeneratedDesign | null>(null);

  // Settings
  const [unit, setUnit] = useState<Unit>(Unit.INCHES);

  // Error Handling
  const [error, setError] = useState<string | null>(null);

  const handleGenerateVariations = async () => {
    if (!description.trim()) return;

    setPhase(1);
    setError(null);
    setVariations([]);
    setSelectedVariation(null);

    try {
      const results = await generateCarvingVariations(description);
      setVariations(results);
      setPhase(2);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate variations. Please try again."
      );
      setPhase(0);
    }
  };

  const handleSelectVariation = (variation: CarvingVariation) => {
    setSelectedVariation(variation);
  };

  const handleGenerateBlueprint = async () => {
    if (!selectedVariation) return;

    setPhase(3);
    setError(null);

    try {
      // Create prompt combining original + notes
      const finalPrompt = userNotes
        ? `${description}. Notes: ${userNotes}`
        : description;

      // Pass full Data URL so service can extract correct MimeType
      const plan = await generateCarvingPlan(
        finalPrompt,
        selectedVariation.imageUrl
      );
      setDesignData(plan);
      setPhase(4);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate blueprint. Please try again."
      );
      setPhase(2); // Go back to selection
    }
  };

  const handleReset = () => {
    setPhase(0);
    setDescription("");
    setUserNotes("");
    setVariations([]);
    setSelectedVariation(null);
    setDesignData(null);
    setIsRefining(false);
  };

  // Refinement Logic
  const [isRefining, setIsRefining] = useState(false);
  const [refinementNote, setRefinementNote] = useState("");

  const handleRegenerateDesign = async (annotatedImageBase64: string) => {
    // Create a composite prompt for refinement
    const refinePrompt = refinementNote
      ? `Refine this design based on the visual markups (red/green/blue lines) and these notes: ${refinementNote}. Original subject: ${description}`
      : `Refine this design based on the visual markups. Original subject: ${description}`;

    setPhase(3); // Show loading state
    setIsRefining(false);
    setDesignData(null);

    try {
      // Send annotated image as the reference
      const newPlan = await generateCarvingPlan(
        refinePrompt,
        annotatedImageBase64
      );
      setDesignData(newPlan);
      setPhase(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to refine design");
      setPhase(4);
    }
  };

  const toggleUnit = () => {
    setUnit((prev) => (prev === Unit.INCHES ? Unit.MM : Unit.INCHES));
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans selection:bg-brand-accent selection:text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-light text-white mb-2">
              Wood Carving <span className="text-brand-accent">Visualizer</span>
            </h1>
            <p className="text-zinc-400 text-lg font-light max-w-2xl">
              From concept to cut list. Generate styles, select your favorite,
              and get a technical blueprint.
            </p>
          </div>

          {phase > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-full transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Start New Project
            </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-start gap-3">
            <div className="mt-1">
              <Wand2 className="w-5 h-5 text-red-400" />
            </div>
            <p>{error}</p>
          </div>
        )}

        {/* PHASE 0: INPUT */}
        {phase === 0 && (
          <div className="max-w-3xl mx-auto bg-zinc-800/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl shadow-2xl">
            <label
              htmlFor="prompt-input"
              className="block text-sm font-medium text-brand-accent mb-2 uppercase tracking-wider"
            >
              What would you like to carve?
            </label>
            <textarea
              id="prompt-input"
              className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-4 text-white placeholder-zinc-500 focus:border-brand-accent focus:ring-0 transition-all text-lg mb-6"
              rows={4}
              placeholder="Describe your idea (e.g., 'An owl perched on a drift wood branch, geometric style')..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateVariations();
                }
              }}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_DESCRIPTIONS.map((desc, i) => (
                  <button
                    key={i}
                    onClick={() => setDescription(desc)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors border border-white/5"
                  >
                    {desc}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateVariations}
                disabled={!description.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-brand-accent hover:bg-brand-accent-light text-white rounded-xl font-medium shadow-lg hover:shadow-brand-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Wand2 className="w-5 h-5" />
                Generate Styles
              </button>
            </div>
          </div>
        )}

        {/* PHASE 1: GENERATING VARIATIONS */}
        {phase === 1 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-brand-accent rounded-full border-t-transparent animate-spin"></div>
              <Wand2 className="absolute inset-0 m-auto w-8 h-8 text-brand-accent animate-pulse" />
            </div>
            <h3 className="text-2xl font-light text-white mb-2">
              Imagining Possibilities...
            </h3>
            <p className="text-zinc-500">
              Our AI is sketching 4 distinct variations of &quot;{description}
              &quot;
            </p>
          </div>
        )}

        {/* PHASE 2: SELECT VARIATION */}
        {phase === 2 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light text-white">
                Select Your Style
              </h2>
              <div className="text-sm text-zinc-400">
                Click a card to select it
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectVariation(variation)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectVariation(variation);
                    }
                  }}
                  className={`
                    relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300
                    ${
                      selectedVariation === variation
                        ? "border-brand-accent ring-4 ring-brand-accent/20 scale-[1.02]"
                        : "border-white/10 hover:border-white/30 hover:-translate-y-1"
                    }
                  `}
                >
                  <div className="aspect-square bg-zinc-900 rounded-lg overflow-hidden relative">
                    <img
                      src={variation.imageUrl}
                      alt={variation.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-sm font-medium">
                        {variation.name}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-800">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">
                        {variation.name}
                      </h3>
                      {selectedVariation === variation && (
                        <div className="bg-brand-accent rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-3">
                      {variation.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {selectedVariation && (
              <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur border-t border-white/10 p-6 z-50 animate-slide-up">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 w-full">
                    <label
                      htmlFor="notes-input"
                      className="text-xs font-semibold uppercase text-brand-accent tracking-wider mb-1 block"
                    >
                      Refining Notes (Optional)
                    </label>
                    <input
                      id="notes-input"
                      type="text"
                      placeholder="E.g., Make the beak sharper, remove the background..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-accent outline-none"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="text-right hidden md:block">
                      <div className="text-sm font-medium text-white">
                        Ready to Engineer?
                      </div>
                      <div className="text-xs text-zinc-400">
                        Generates blueprint & cutting guide
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateBlueprint}
                      className="flex-1 md:flex-none px-8 py-3 bg-brand-accent hover:bg-brand-accent-light text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <Ruler className="w-5 h-5" />
                      Generate Blueprint
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Space for fixed footer */}
            <div className="h-24"></div>
          </div>
        )}

        {/* PHASE 3: GENERATING BLUEPRINT */}
        {phase === 3 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 border-4 border-zinc-700/30 rounded-full animate-ping"></div>
              <div className="absolute inset-4 border-2 border-brand-accent rounded-full opacity-50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Ruler className="w-12 h-12 text-brand-accent animate-bounce" />
              </div>
            </div>
            <h3 className="text-3xl font-light text-white mb-2">
              Analyzing Geometry...
            </h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              We are converting the <b>{selectedVariation?.name}</b> concept
              into a technical orthographic projection and cutting strategy.
            </p>
          </div>
        )}

        {/* PHASE 4: BLUEPRINT & CARVECRAFT UI */}
        {phase === 4 && designData && (
          <div className="animate-fade-in space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Carving Blueprint
                </h2>
                <p className="text-zinc-400">
                  Technical documentation for your project
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <span className="text-sm text-zinc-500">Unit:</span>
                <button
                  onClick={toggleUnit}
                  className="px-4 py-1 bg-zinc-800 text-brand-accent border border-brand-accent/20 rounded-full text-sm font-medium hover:bg-brand-accent/10 transition-colors"
                >
                  {unit === Unit.INCHES ? "Inches (in)" : "Millimeters (mm)"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                  title="Print Blueprint"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card 1: Concept Visualization */}
              {/* Card 1: Concept Visualization & Refinement */}
              <div className="bg-zinc-800/50 backdrop-blur border border-white/10 rounded-2xl overflow-hidden p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {isRefining ? "Refine Design" : "Final Design Reference"}
                  </h3>
                  {!isRefining && (
                    <button
                      onClick={() => setIsRefining(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
                    >
                      <Edit className="w-4 h-4" /> Refine
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-black/40 rounded-xl overflow-hidden shadow-inner min-h-[300px]">
                  {isRefining ? (
                    <div className="p-2 h-full flex flex-col gap-4">
                      {/* Note Input Area - placed above or alongside? Putting it above actions in drawing tool would be ideal, but here works too */}
                      <div className="bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                        <label
                          htmlFor="refinement-notes"
                          className="text-xs font-semibold uppercase text-brand-accent tracking-wider block mb-1"
                        >
                          Refinement Instructions
                        </label>
                        <input
                          id="refinement-notes"
                          type="text"
                          value={refinementNote}
                          onChange={(e) => setRefinementNote(e.target.value)}
                          placeholder="Describe changes (e.g. 'Make the texture rougher', 'Fix the beak')..."
                          className="w-full bg-black/40 border-b border-white/20 px-2 py-1 text-white focus:border-brand-accent outline-none text-sm placeholder-zinc-500"
                        />
                      </div>

                      <ImageAnnotator
                        imageUrl={designData.conceptUrl}
                        onSave={handleRegenerateDesign}
                        onCancel={() => setIsRefining(false)}
                        className="flex-1 min-h-[400px]"
                      />
                    </div>
                  ) : (
                    <img
                      src={designData.conceptUrl}
                      alt="Concept Art"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Card 2: Strategy Guide */}
              <div className="bg-zinc-800/50 backdrop-blur border border-white/10 rounded-2xl overflow-hidden p-6 h-[400px] overflow-y-auto custom-scrollbar">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Carving Strategy
                </h3>
                <div className="prose prose-invert prose-zinc max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">
                    {designData.guideText}
                  </pre>
                </div>
              </div>

              {/* Card 3: Cut Calculator (Full Width) */}
              <div className="lg:col-span-2 bg-zinc-100 rounded-3xl p-6 md:p-8 text-slate-800 shadow-xl border border-white/20">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Workbench & Cut Calculator
                  </h3>
                  <p className="text-slate-600">
                    Interactive orthographic schematic. Click &apos;Launch Cut
                    Calculator&apos; to measure distances relative to your block
                    size.
                  </p>
                </div>
                {/* The CutCalculator component, adapted to our theme slightly or kept as is */}
                <CutCalculator imageUrl={designData.schematicUrl} unit={unit} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 8px; }
         .custom-scrollbar::-webkit-scrollbar-track { bg: rgba(0,0,0,0.2); }
         .custom-scrollbar::-webkit-scrollbar-thumb { bg: rgba(255,255,255,0.1); border-radius: 4px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { bg: rgba(255,255,255,0.2); }
         
         .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
         @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
         
         .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
         @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default WoodCarvingVisualizerPage;
