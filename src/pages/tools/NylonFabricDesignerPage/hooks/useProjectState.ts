import { useState, useCallback } from "react";

// ============================================
// Types for Nylon Fabric Project
// ============================================

export type ClosureType = "drawstring" | "zipper" | "flap" | "open" | "buckle";

export interface ProjectBrief {
  description: string;
  size: {
    height: number;
    width: number;
    depth?: number;
    unit: "in" | "cm";
  };
  closure: ClosureType;
  features: string[];
}

export interface ConceptSketch {
  id: string;
  name: string;
  style: string;
  imageUrl: string;
  description: string;
}

export interface SelectedConcept {
  sketch: ConceptSketch;
  refinements: string[];
  finalImageUrl?: string;
}

export interface MaterialItem {
  name: string;
  quantity: string;
  notes?: string;
  alternatives?: string[];
}

export interface AssemblyStep {
  number: number;
  title: string;
  instructions: string;
  tips: string[];
  imageUrl?: string;
  isCompleted: boolean;
}

export interface MaterialPlan {
  materials: MaterialItem[];
  tools: MaterialItem[];
  cutDiagramUrl?: string;
  estimatedTime: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface NylonProject {
  id?: number;
  brief: ProjectBrief;
  concepts: ConceptSketch[];
  selectedConcept?: SelectedConcept;
  materialPlan?: MaterialPlan;
  steps: AssemblyStep[];
  progress: {
    currentPhase: 1 | 2 | 3 | 4;
    currentStep: number;
    completedSteps: number[];
  };
  createdAt?: string;
}

// ============================================
// Default State
// ============================================

const defaultBrief: ProjectBrief = {
  description: "",
  size: { height: 0, width: 0, unit: "in" },
  closure: "drawstring",
  features: [],
};

const defaultProject: NylonProject = {
  brief: defaultBrief,
  concepts: [],
  steps: [],
  progress: {
    currentPhase: 1,
    currentStep: 0,
    completedSteps: [],
  },
};

// ============================================
// Hook
// ============================================

export function useProjectState(initialProject?: Partial<NylonProject>) {
  const [project, setProject] = useState<NylonProject>({
    ...defaultProject,
    ...initialProject,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase navigation
  const goToPhase = useCallback((phase: 1 | 2 | 3 | 4) => {
    setProject((prev) => ({
      ...prev,
      progress: { ...prev.progress, currentPhase: phase },
    }));
  }, []);

  // Update brief
  const updateBrief = useCallback((updates: Partial<ProjectBrief>) => {
    setProject((prev) => ({
      ...prev,
      brief: { ...prev.brief, ...updates },
    }));
  }, []);

  // Set concepts from AI
  const setConcepts = useCallback((concepts: ConceptSketch[]) => {
    setProject((prev) => ({
      ...prev,
      concepts,
    }));
  }, []);

  // Select a concept
  const selectConcept = useCallback((sketch: ConceptSketch) => {
    setProject((prev) => ({
      ...prev,
      selectedConcept: { sketch, refinements: [] },
    }));
  }, []);

  // Add refinement to selected concept
  const addRefinement = useCallback((refinement: string) => {
    setProject((prev) => {
      if (!prev.selectedConcept) return prev;
      return {
        ...prev,
        selectedConcept: {
          ...prev.selectedConcept,
          refinements: [...prev.selectedConcept.refinements, refinement],
        },
      };
    });
  }, []);

  // Set material plan
  const setMaterialPlan = useCallback((plan: MaterialPlan) => {
    setProject((prev) => ({
      ...prev,
      materialPlan: plan,
    }));
  }, []);

  // Set assembly steps
  const setSteps = useCallback((steps: AssemblyStep[]) => {
    setProject((prev) => ({
      ...prev,
      steps,
    }));
  }, []);

  // Mark step complete
  const completeStep = useCallback((stepNumber: number) => {
    setProject((prev) => {
      const newCompleted = prev.progress.completedSteps.includes(stepNumber)
        ? prev.progress.completedSteps
        : [...prev.progress.completedSteps, stepNumber];

      return {
        ...prev,
        steps: prev.steps.map((s) =>
          s.number === stepNumber ? { ...s, isCompleted: true } : s,
        ),
        progress: {
          ...prev.progress,
          completedSteps: newCompleted,
          currentStep: Math.max(prev.progress.currentStep, stepNumber + 1),
        },
      };
    });
  }, []);

  // Go to specific step
  const goToStep = useCallback((stepNumber: number) => {
    setProject((prev) => ({
      ...prev,
      progress: { ...prev.progress, currentStep: stepNumber },
    }));
  }, []);

  // Reset project
  const resetProject = useCallback(() => {
    setProject(defaultProject);
    setError(null);
  }, []);

  return {
    project,
    setProject,
    isLoading,
    setIsLoading,
    error,
    setError,

    // Phase navigation
    goToPhase,
    currentPhase: project.progress.currentPhase,

    // Brief
    updateBrief,

    // Concepts
    setConcepts,
    selectConcept,
    addRefinement,

    // Materials
    setMaterialPlan,

    // Steps
    setSteps,
    completeStep,
    goToStep,
    currentStep: project.progress.currentStep,

    // Utility
    resetProject,
  };
}

export type ProjectStateHook = ReturnType<typeof useProjectState>;
