import React, { useState } from "react";
import { AuraButton, AuraCard } from "@/components/aura";
import {
  ArrowLeft,
  Download,
  Edit,
  Check,
  Palette,
  Ruler,
  BookOpen,
} from "lucide-react";
import type { GeneratedDesign, Unit } from "@/services/woodCarvingService";
import type { CarvingStep } from "../hooks/useWoodCarvingProject";
import { ImageAnnotator } from "./ImageAnnotator";
import CutCalculator from "./CutCalculator";
import clsx from "clsx";

interface BlueprintViewerProps {
  designData: GeneratedDesign;
  carvingSteps: CarvingStep[];
  currentStep: number;
  completedSteps: number[];
  unit: Unit;
  description: string;
  variationName: string;
  activeTab: "concept" | "blueprint" | "strategy";
  isRefining: boolean;
  refinementNote: string;
  onTabChange: (tab: "concept" | "blueprint" | "strategy") => void;
  onToggleUnit: () => void;
  onExitBlueprint: () => void;
  onDownloadResults: () => void;
  onStartRefining: () => void;
  onCancelRefining: () => void;
  onRefinementNoteChange: (note: string) => void;
  onRegenerateDesign: (annotatedImageBase64: string) => void;
  onCompleteStep: (stepNumber: number) => void;
  onGoToStep: (stepNumber: number) => void;
}

const TABS = [
  { id: "concept" as const, label: "Concept", icon: Palette },
  { id: "blueprint" as const, label: "Blueprint", icon: Ruler },
  { id: "strategy" as const, label: "Strategy", icon: BookOpen },
];

const BlueprintViewer: React.FC<BlueprintViewerProps> = ({
  designData,
  carvingSteps,
  currentStep,
  completedSteps,
  unit,
  description,
  variationName,
  activeTab,
  isRefining,
  refinementNote,
  onTabChange,
  onToggleUnit,
  onExitBlueprint,
  onDownloadResults,
  onStartRefining,
  onCancelRefining,
  onRefinementNoteChange,
  onRegenerateDesign,
  onCompleteStep,
  onGoToStep,
}) => {
  const progressPercent =
    carvingSteps.length > 0
      ? Math.round((completedSteps.length / carvingSteps.length) * 100)
      : 0;

  const activeStepData = carvingSteps.find((s) => s.number === currentStep);
  const allComplete =
    completedSteps.length === carvingSteps.length && carvingSteps.length > 0;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-6">
        <div className="flex items-center gap-4">
          <AuraButton
            variant="ghost"
            size="sm"
            onClick={onExitBlueprint}
            icon={<ArrowLeft className="w-5 h-5" />}
            className="rounded-full w-10 h-10 p-0"
            title="Back to Styles"
          />
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              Carving Blueprint
            </h2>
            <p className="text-zinc-400">
              {description} —{" "}
              <span className="text-aura-accent">{variationName}</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Unit Toggle */}
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-2">
              Unit
            </span>
            <button
              onClick={onToggleUnit}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                unit === "inches"
                  ? "bg-aura-accent text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              IN
            </button>
            <button
              onClick={onToggleUnit}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                unit === "mm"
                  ? "bg-aura-accent text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              MM
            </button>
          </div>

          <AuraButton
            variant="secondary"
            size="sm"
            onClick={onDownloadResults}
            icon={<Download className="w-4 h-4" />}
          >
            Download All
          </AuraButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-aura-accent text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* CONCEPT TAB */}
        {activeTab === "concept" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Concept Art */}
            <AuraCard variant="elevated" padding="md">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-aura-accent" />
                Concept Art
              </h3>
              {isRefining ? (
                <ImageAnnotator
                  imageUrl={designData.conceptUrl}
                  onConfirm={onRegenerateDesign}
                  onCancel={onCancelRefining}
                  refinementNote={refinementNote}
                  onRefinementNoteChange={onRefinementNoteChange}
                />
              ) : (
                <>
                  <div className="rounded-xl overflow-hidden bg-zinc-900">
                    <img
                      src={designData.conceptUrl}
                      alt="Concept art"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <AuraButton
                      variant="secondary"
                      size="sm"
                      onClick={onStartRefining}
                      icon={<Edit className="w-4 h-4" />}
                    >
                      Annotate & Refine
                    </AuraButton>
                  </div>
                </>
              )}
            </AuraCard>

            {/* Schematic Preview */}
            <AuraCard variant="elevated" padding="md">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-aura-accent" />
                Technical Schematic
              </h3>
              <div className="rounded-xl overflow-hidden bg-zinc-900">
                <img
                  src={designData.schematicUrl}
                  alt="Technical schematic"
                  className="w-full h-auto"
                />
              </div>
              <p className="mt-4 text-sm text-zinc-400">
                Switch to the Blueprint tab for interactive measurements
              </p>
            </AuraCard>
          </div>
        )}

        {/* BLUEPRINT TAB */}
        {activeTab === "blueprint" && (
          <div className="space-y-8">
            <AuraCard variant="elevated" padding="lg">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Ruler className="w-6 h-6 text-aura-accent" />
                Interactive Schematic
              </h3>
              <CutCalculator imageUrl={designData.schematicUrl} unit={unit} />
            </AuraCard>
          </div>
        )}

        {/* STRATEGY TAB */}
        {activeTab === "strategy" && (
          <div className="space-y-8">
            {/* Progress */}
            {carvingSteps.length > 0 && (
              <div className="bg-zinc-900/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-400">
                    Step {currentStep} of {carvingSteps.length}
                  </span>
                  <span className="text-sm font-semibold text-aura-accent">
                    {progressPercent}% Complete
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-aura-accent to-purple-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Guide Text (original) */}
            <AuraCard variant="elevated" padding="lg">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-aura-accent" />
                Carving Strategy
              </h3>
              <div
                className="prose prose-invert prose-zinc max-w-none"
                dangerouslySetInnerHTML={{
                  __html: designData.guideText
                    .replace(/\n/g, "<br/>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/#{1,3}\s(.*?)(?=<br\/>|$)/g, "<h4>$1</h4>"),
                }}
              />
            </AuraCard>

            {/* Step Cards (if structured steps available) */}
            {carvingSteps.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Step-by-Step Breakdown
                </h3>
                <div className="grid gap-4">
                  {carvingSteps.map((step) => {
                    const isComplete = completedSteps.includes(step.number);
                    const isCurrent = step.number === currentStep;
                    return (
                      <AuraCard
                        key={step.number}
                        variant={isCurrent ? "elevated" : "glass"}
                        padding="md"
                        className={clsx(
                          "transition-all",
                          isCurrent && "ring-2 ring-aura-accent",
                          isComplete && "opacity-70",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              isComplete ? null : onCompleteStep(step.number)
                            }
                            className={clsx(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0",
                              isComplete
                                ? "bg-aura-accent text-white"
                                : "bg-zinc-800 text-zinc-400 hover:bg-aura-accent/30",
                            )}
                          >
                            {isComplete ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              step.number
                            )}
                          </button>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">
                              {step.title}
                            </h4>
                            <p className="text-sm text-zinc-400 mt-1">
                              {step.technique}
                            </p>
                            {step.toolsNeeded.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {step.toolsNeeded.map((tool, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs"
                                  >
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            )}
                            {step.tips.length > 0 && (
                              <div className="mt-3 p-3 bg-aura-accent/10 rounded-lg">
                                <p className="text-xs font-semibold text-aura-accent mb-1">
                                  💡 Tips
                                </p>
                                <ul className="text-xs text-zinc-400 space-y-1">
                                  {step.tips.map((tip, i) => (
                                    <li key={i}>• {tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </AuraCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completion */}
            {allComplete && (
              <AuraCard variant="elevated" padding="lg" className="text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  All Steps Complete!
                </h3>
                <p className="text-zinc-400">
                  Time to put chisel to wood. Best of luck with your carving!
                </p>
              </AuraCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlueprintViewer;
