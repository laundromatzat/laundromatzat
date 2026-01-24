import React, { useState, useEffect } from "react";
import {
  CarvingVariation,
  Unit,
  generateCarvingPlan,
  generateCarvingVariations,
  GeneratedDesign,
} from "@/services/woodCarvingService";
import {
  saveProject,
  updateProject,
  loadProjects,
  deleteProject,
  type WoodCarvingProject,
} from "@/services/woodCarvingApi";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";
import { DesignGallery, SortOption } from "@/components/DesignGallery";
import { ClockIcon } from "@heroicons/react/24/outline";

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

  // Project tracking for backend
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // No longer needed - removed useEffect for loading from IndexedDB

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
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate variations. Please try again.",
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
        selectedVariation.imageUrl,
      );
      setDesignData(plan);
      setPhase(4);

      // Save or update project in backend
      try {
        if (currentProjectId) {
          // Update existing project
          await updateProject(currentProjectId, {
            description,
            variations,
            selectedVariation,
            blueprint: plan,
          });
        } else {
          // Create new project
          const savedProject = await saveProject({
            description,
            variations,
            selectedVariation,
            blueprint: plan,
          });
          setCurrentProjectId(savedProject.id);
        }
      } catch (err) {
        console.error("Failed to save project:", err);
        // Don't show error to user - background operation
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate blueprint. Please try again.",
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
    setCurrentProjectId(null); // Clear project ID on reset
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
        annotatedImageBase64,
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

  const sortOptions: SortOption[] = [
    {
      label: "Newest First",
      value: "date-desc",
      compareFn: (a: unknown, b: unknown) => {
        const aDate = new Date((a as WoodCarvingProject).createdAt).getTime();
        const bDate = new Date((b as WoodCarvingProject).createdAt).getTime();
        return bDate - aDate;
      },
    },
    {
      label: "Oldest First",
      value: "date-asc",
      compareFn: (a: unknown, b: unknown) => {
        const aDate = new Date((a as WoodCarvingProject).createdAt).getTime();
        const bDate = new Date((b as WoodCarvingProject).createdAt).getTime();
        return aDate - bDate;
      },
    },
  ];

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-full border border-slate-200 transition-colors shadow-sm"
              >
                <ClockIcon className="w-4 h-4" />
                <span>History</span>
              </button>
              <AuraButton
                variant="secondary"
                size="sm"
                onClick={handleReset}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Start New Project
              </AuraButton>
            </div>
          )}
          {phase === 0 && (
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-full border border-slate-200 transition-colors shadow-sm"
            >
              <ClockIcon className="w-4 h-4" />
              <span>History</span>
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
          <AuraCard variant="glass" padding="lg" className="max-w-3xl mx-auto">
            <label
              htmlFor="prompt-input"
              className="block text-sm font-medium text-brand-accent mb-2 uppercase tracking-wider"
            >
              What would you like to carve?
            </label>
            <AuraInput
              id="prompt-input"
              type="textarea"
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
              className="text-lg mb-6 bg-black/40 border-white/10"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_DESCRIPTIONS.map((desc, i) => (
                  <AuraButton
                    key={i}
                    variant="secondary"
                    size="sm"
                    onClick={() => setDescription(desc)}
                    className="text-xs"
                  >
                    {desc}
                  </AuraButton>
                ))}
              </div>

              <AuraButton
                onClick={handleGenerateVariations}
                disabled={!description.trim()}
                variant="accent"
                size="lg"
                icon={<Wand2 className="w-5 h-5" />}
              >
                Generate Styles
              </AuraButton>
            </div>
          </AuraCard>
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
                <AuraCard
                  key={index}
                  variant="interactive"
                  padding="none"
                  onClick={() => handleSelectVariation(variation)}
                  className={`
                    overflow-hidden transition-all duration-300
                    ${
                      selectedVariation === variation
                        ? "border-brand-accent ring-2 ring-brand-accent scale-[1.02]"
                        : "hover:scale-[1.02]"
                    }
                  `}
                >
                  <div className="aspect-square bg-zinc-900 overflow-hidden relative">
                    <img
                      src={variation.imageUrl}
                      alt={variation.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
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
                </AuraCard>
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
                    <AuraInput
                      id="notes-input"
                      type="text"
                      placeholder="E.g., Make the beak sharper, remove the background..."
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="bg-black/40 border-white/10"
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
                    <AuraButton
                      onClick={handleGenerateBlueprint}
                      variant="accent"
                      size="lg"
                      icon={<Ruler className="w-5 h-5" />}
                    >
                      Generate Blueprint
                    </AuraButton>
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
                <AuraButton
                  variant="secondary"
                  size="sm"
                  onClick={toggleUnit}
                  className="text-xs"
                >
                  {unit === Unit.INCHES ? "Inches (in)" : "Millimeters (mm)"}
                </AuraButton>
                <AuraButton
                  variant="ghost"
                  size="sm"
                  onClick={() => window.print()}
                  icon={<Camera className="w-5 h-5" />}
                  title="Print Blueprint"
                />
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
                    <AuraButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsRefining(true)}
                      icon={<Edit className="w-4 h-4" />}
                    >
                      Refine
                    </AuraButton>
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

      {/* Design Gallery */}
      <DesignGallery
        title="Carving Project History"
        fetchEndpoint="/api/wood-carving/projects"
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoad={(item: WoodCarvingProject) => {
          setDescription(item.description);
          setVariations(item.variations || []);
          setSelectedVariation(item.selectedVariation || null);
          setDesignData(item.blueprint || null);
          setCurrentProjectId(item.id);
          if (item.blueprint) setPhase(4);
          else if (item.selectedVariation) setPhase(2);
          else if (item.variations && item.variations.length > 0) setPhase(2);
          else setPhase(0);
          setIsGalleryOpen(false);
        }}
        deleteEndpoint="/api/wood-carving/projects"
        emptyMessage="No projects found. Start a new project to begin."
        sortOptions={sortOptions}
        renderPreview={(item: WoodCarvingProject) => (
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Project Description
              </h3>
              <p className="text-slate-300">{item.description}</p>
            </div>
            {item.selectedVariation && (
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Selected: {item.selectedVariation.name}
                </h3>
                <img
                  src={item.selectedVariation.imageUrl}
                  alt={item.selectedVariation.name}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
            {item.blueprint && (
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Blueprint
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <img
                    src={item.blueprint.conceptUrl}
                    alt="Concept"
                    className="w-full h-auto rounded-lg"
                  />
                  <img
                    src={item.blueprint.schematicUrl}
                    alt="Schematic"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        renderItem={(item: WoodCarvingProject) => (
          <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors cursor-pointer group">
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                {item.description}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1 p-4">
              {item.selectedVariation ? (
                <div>
                  <img
                    src={item.selectedVariation.imageUrl}
                    alt={item.selectedVariation.name}
                    className="w-full h-32 object-cover rounded border border-slate-200"
                  />
                  <p className="text-xs text-slate-600 mt-2 font-medium">
                    {item.selectedVariation.name}
                  </p>
                  {item.blueprint && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Blueprint ready
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-slate-100 rounded border border-slate-200">
                  <p className="text-xs text-slate-500">
                    No variation selected
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default WoodCarvingVisualizerPage;
