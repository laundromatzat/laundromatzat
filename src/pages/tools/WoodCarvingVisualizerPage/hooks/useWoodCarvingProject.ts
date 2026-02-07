import { useState, useCallback } from "react";
import type {
  CarvingVariation,
  GeneratedDesign,
  Unit,
} from "@/services/woodCarvingService";

// ============================================
// Types
// ============================================

export interface CarvingStep {
  number: number;
  title: string;
  technique: string;
  toolsNeeded: string[];
  tips: string[];
  isCompleted: boolean;
}

export interface WoodCarvingProjectState {
  // Input
  description: string;
  userNotes: string;

  // Variations
  variations: CarvingVariation[];
  selectedVariation: CarvingVariation | null;

  // Design output
  designData: GeneratedDesign | null;
  carvingSteps: CarvingStep[];

  // Settings
  unit: Unit;

  // UI state
  phase: 0 | 1 | 2 | 3 | 4;
  activeTab: "concept" | "blueprint" | "strategy";
  isRefining: boolean;
  refinementNote: string;

  // Progress
  currentStep: number;
  completedSteps: number[];

  // Backend
  projectId: number | null;
}

// ============================================
// Default State
// ============================================

const defaultState: WoodCarvingProjectState = {
  description: "",
  userNotes: "",
  variations: [],
  selectedVariation: null,
  designData: null,
  carvingSteps: [],
  unit: "inches" as Unit,
  phase: 0,
  activeTab: "concept",
  isRefining: false,
  refinementNote: "",
  currentStep: 1,
  completedSteps: [],
  projectId: null,
};

// ============================================
// Hook
// ============================================

export function useWoodCarvingProject(
  initial?: Partial<WoodCarvingProjectState>,
) {
  const [state, setState] = useState<WoodCarvingProjectState>({
    ...defaultState,
    ...initial,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase navigation
  const setPhase = useCallback((phase: 0 | 1 | 2 | 3 | 4) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  // Input updates
  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setUserNotes = useCallback((userNotes: string) => {
    setState((prev) => ({ ...prev, userNotes }));
  }, []);

  // Variation handling
  const setVariations = useCallback((variations: CarvingVariation[]) => {
    setState((prev) => ({ ...prev, variations }));
  }, []);

  const selectVariation = useCallback((variation: CarvingVariation) => {
    setState((prev) => ({ ...prev, selectedVariation: variation }));
  }, []);

  // Design data
  const setDesignData = useCallback((designData: GeneratedDesign) => {
    setState((prev) => ({ ...prev, designData }));
  }, []);

  const setCarvingSteps = useCallback((steps: CarvingStep[]) => {
    setState((prev) => ({ ...prev, carvingSteps: steps }));
  }, []);

  // Tab navigation
  const setActiveTab = useCallback(
    (tab: "concept" | "blueprint" | "strategy") => {
      setState((prev) => ({ ...prev, activeTab: tab }));
    },
    [],
  );

  // Unit toggle
  const toggleUnit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      unit: prev.unit === "inches" ? ("mm" as Unit) : ("inches" as Unit),
    }));
  }, []);

  // Refinement mode
  const setIsRefining = useCallback((isRefining: boolean) => {
    setState((prev) => ({ ...prev, isRefining }));
  }, []);

  const setRefinementNote = useCallback((refinementNote: string) => {
    setState((prev) => ({ ...prev, refinementNote }));
  }, []);

  // Step progress
  const completeStep = useCallback((stepNumber: number) => {
    setState((prev) => {
      const newCompleted = prev.completedSteps.includes(stepNumber)
        ? prev.completedSteps
        : [...prev.completedSteps, stepNumber];

      return {
        ...prev,
        carvingSteps: prev.carvingSteps.map((s) =>
          s.number === stepNumber ? { ...s, isCompleted: true } : s,
        ),
        completedSteps: newCompleted,
        currentStep: Math.min(stepNumber + 1, prev.carvingSteps.length),
      };
    });
  }, []);

  const goToStep = useCallback((stepNumber: number) => {
    setState((prev) => ({ ...prev, currentStep: stepNumber }));
  }, []);

  // Project ID
  const setProjectId = useCallback((projectId: number) => {
    setState((prev) => ({ ...prev, projectId }));
  }, []);

  // Reset
  const resetProject = useCallback(() => {
    setState(defaultState);
    setError(null);
  }, []);

  return {
    ...state,
    isLoading,
    setIsLoading,
    error,
    setError,

    // Phase
    setPhase,

    // Input
    setDescription,
    setUserNotes,

    // Variations
    setVariations,
    selectVariation,

    // Design
    setDesignData,
    setCarvingSteps,

    // Tabs
    setActiveTab,

    // Settings
    toggleUnit,

    // Refinement
    setIsRefining,
    setRefinementNote,

    // Progress
    completeStep,
    goToStep,

    // Project
    setProjectId,
    resetProject,
  };
}

export type WoodCarvingProjectHook = ReturnType<typeof useWoodCarvingProject>;
