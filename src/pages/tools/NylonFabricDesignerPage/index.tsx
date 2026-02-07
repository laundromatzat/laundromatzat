import React from "react";
import { useLoading } from "@/context/LoadingContext";
import { useAuth } from "@/context/AuthContext";

// Components
import DesignBriefForm from "./components/DesignBriefForm";
import ConceptExplorer from "./components/ConceptExplorer";
import MaterialPlanner from "./components/MaterialPlanner";
import StepByStepGuide from "./components/StepByStepGuide";

// Hooks & Services
import { useProjectState } from "./hooks/useProjectState";
import {
  generateConceptSketches,
  generateMaterialPlan,
  generateAssemblySteps,
} from "@/services/nylonFabricWizardService";
import { saveDesign } from "@/services/nylonFabricApi";

const NylonFabricDesignerPage: React.FC = () => {
  const { setIsLoading: setGlobalLoading } = useLoading();
  const { token } = useAuth();

  const {
    project,
    isLoading,
    setIsLoading,
    error,
    setError,
    currentPhase,
    goToPhase,
    updateBrief,
    setConcepts,
    selectConcept,
    addRefinement,
    setMaterialPlan,
    setSteps,
    completeStep,
    goToStep,
    currentStep,
    resetProject,
  } = useProjectState();

  const [isRegenerating, setIsRegenerating] = React.useState(false);

  // Phase 1 → Phase 2: Generate concepts
  const handleSubmitBrief = async () => {
    if (!token) {
      setError("Please log in to use this tool");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGlobalLoading(true);

    try {
      const concepts = await generateConceptSketches(project.brief);
      setConcepts(concepts);
      goToPhase(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate concepts",
      );
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  // Regenerate concepts
  const handleRegenerateConcepts = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      const concepts = await generateConceptSketches(project.brief);
      setConcepts(concepts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to regenerate concepts",
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  // Phase 2 → Phase 3: Generate material plan
  const handleContinueToMaterials = async () => {
    if (!project.selectedConcept) {
      setError("Please select a concept first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGlobalLoading(true);

    try {
      const plan = await generateMaterialPlan(
        project.brief,
        project.selectedConcept.refinements,
      );
      setMaterialPlan(plan);
      goToPhase(3);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate material plan",
      );
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  // Phase 3 → Phase 4: Generate assembly steps
  const handleStartAssembly = async () => {
    setIsLoading(true);
    setError(null);
    setGlobalLoading(true);

    try {
      const steps = await generateAssemblySteps(
        project.brief,
        project.selectedConcept?.refinements || [],
      );
      setSteps(steps);
      goToPhase(4);

      // Auto-save the project
      if (token) {
        try {
          await saveDesign(
            {
              designName: project.brief.description.slice(0, 100),
              instructionImageUrl: project.selectedConcept?.sketch.imageUrl,
              nylonImageUrl: project.materialPlan?.cutDiagramUrl,
              prompts: {
                brief: project.brief,
                refinements: project.selectedConcept?.refinements,
                stepsCount: steps.length,
              },
            },
            token,
          );
        } catch (saveErr) {
          console.error("Failed to auto-save:", saveErr);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate assembly steps",
      );
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  // Finish and start new
  const handleFinish = () => {
    resetProject();
    goToPhase(1);
  };

  return (
    <div className="min-h-screen bg-aura-bg font-sans text-aura-text-primary">
      {/* Header */}
      <header className="bg-aura-surface/50 border-b border-aura-border backdrop-blur-md p-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-aura-accent to-purple-400">
              Nylon Fabric Designer
            </h1>
            <p className="text-sm text-aura-text-secondary mt-1">
              {currentPhase === 1 && "Step 1: Describe your project"}
              {currentPhase === 2 && "Step 2: Choose your design"}
              {currentPhase === 3 && "Step 3: Review materials"}
              {currentPhase === 4 && "Step 4: Build your project"}
            </p>
          </div>

          {/* Phase Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((phase) => (
              <div key={phase} className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    phase < currentPhase && goToPhase(phase as 1 | 2 | 3 | 4)
                  }
                  disabled={phase > currentPhase}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    phase === currentPhase
                      ? "bg-aura-accent text-white"
                      : phase < currentPhase
                        ? "bg-aura-accent/30 text-aura-accent cursor-pointer hover:bg-aura-accent/50"
                        : "bg-aura-surface text-aura-text-secondary"
                  }`}
                >
                  {phase < currentPhase ? "✓" : phase}
                </button>
                {phase < 4 && (
                  <div
                    className={`w-8 h-0.5 ${
                      phase < currentPhase ? "bg-aura-accent" : "bg-aura-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Reset Button */}
          {currentPhase > 1 && (
            <button
              type="button"
              onClick={handleFinish}
              className="text-sm text-aura-text-secondary hover:text-aura-error transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        {/* Phase 1: Design Brief */}
        {currentPhase === 1 && (
          <DesignBriefForm
            brief={project.brief}
            onUpdateBrief={updateBrief}
            onSubmit={handleSubmitBrief}
            isLoading={isLoading}
            error={error}
          />
        )}

        {/* Phase 2: Concept Explorer */}
        {currentPhase === 2 && (
          <ConceptExplorer
            concepts={project.concepts}
            selectedConcept={project.selectedConcept}
            onSelectConcept={selectConcept}
            onAddRefinement={addRefinement}
            onRegenerateConcepts={handleRegenerateConcepts}
            onContinue={handleContinueToMaterials}
            isLoading={isLoading}
            isRegenerating={isRegenerating}
          />
        )}

        {/* Phase 3: Material Planner */}
        {currentPhase === 3 && (
          <MaterialPlanner
            materialPlan={project.materialPlan}
            selectedConcept={project.selectedConcept}
            onContinue={handleStartAssembly}
            onBack={() => goToPhase(2)}
            isLoading={isLoading}
          />
        )}

        {/* Phase 4: Step-by-Step Guide */}
        {currentPhase === 4 && (
          <StepByStepGuide
            steps={project.steps}
            currentStep={currentStep}
            completedSteps={project.progress.completedSteps}
            onCompleteStep={completeStep}
            onGoToStep={goToStep}
            onBack={() => goToPhase(3)}
            onFinish={handleFinish}
          />
        )}

        {/* Global Error Display */}
        {error && currentPhase !== 1 && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="p-4 bg-aura-error/10 border border-aura-error rounded-lg text-aura-error">
              {error}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NylonFabricDesignerPage;
