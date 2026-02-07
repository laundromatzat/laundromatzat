import React from "react";
import { AuraButton, AuraCard } from "@/components/aura";
import { MaterialPlan, SelectedConcept } from "../hooks/useProjectState";

interface MaterialPlannerProps {
  materialPlan: MaterialPlan | undefined;
  selectedConcept: SelectedConcept | undefined;
  onContinue: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const DifficultyStars: React.FC<{ level: 1 | 2 | 3 | 4 | 5 }> = ({ level }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= level ? "text-aura-accent" : "text-aura-border"}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const MaterialPlanner: React.FC<MaterialPlannerProps> = ({
  materialPlan,
  selectedConcept,
  onContinue,
  onBack,
  isLoading,
}) => {
  if (isLoading || !materialPlan) {
    return (
      <AuraCard variant="glass" padding="lg" className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aura-accent mx-auto" />
          <p className="mt-6 text-xl text-aura-text-primary">
            Planning materials and layout...
          </p>
          <p className="text-aura-text-secondary mt-2">
            Calculating fabric requirements and preparing cut diagram
          </p>
        </div>
      </AuraCard>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-aura-text-primary mb-2">
          Materials & Cut Planning
        </h2>
        <p className="text-aura-text-secondary">
          Gather these materials before starting your project
        </p>
      </div>

      {/* Summary Card */}
      <AuraCard variant="elevated" padding="md">
        <div className="flex flex-wrap gap-6 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-aura-text-secondary">Estimated Time</p>
            <p className="text-xl font-semibold text-aura-text-primary">
              {materialPlan.estimatedTime}
            </p>
          </div>
          <div className="w-px h-10 bg-aura-border" />
          <div className="text-center">
            <p className="text-sm text-aura-text-secondary">Difficulty</p>
            <DifficultyStars level={materialPlan.difficulty} />
          </div>
          <div className="w-px h-10 bg-aura-border" />
          <div className="text-center">
            <p className="text-sm text-aura-text-secondary">Items Needed</p>
            <p className="text-xl font-semibold text-aura-text-primary">
              {materialPlan.materials.length + materialPlan.tools.length}
            </p>
          </div>
        </div>
      </AuraCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Materials & Tools */}
        <div className="space-y-6">
          {/* Materials List */}
          <AuraCard variant="glass" padding="lg">
            <h3 className="text-xl font-semibold text-aura-text-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">🧵</span> Materials
            </h3>
            <ul className="space-y-4">
              {materialPlan.materials.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 p-3 bg-aura-surface rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-aura-accent/20 text-aura-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-aura-text-primary">
                        {item.name}
                      </span>
                      <span className="text-aura-accent font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-aura-text-secondary mt-1">
                        {item.notes}
                      </p>
                    )}
                    {item.alternatives && item.alternatives.length > 0 && (
                      <p className="text-xs text-aura-text-secondary mt-1">
                        Alternatives: {item.alternatives.join(", ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </AuraCard>

          {/* Tools List */}
          <AuraCard variant="glass" padding="lg">
            <h3 className="text-xl font-semibold text-aura-text-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">🛠️</span> Tools
            </h3>
            <ul className="space-y-3">
              {materialPlan.tools.map((tool, i) => (
                <li key={i} className="flex items-start gap-3 p-2">
                  <span className="text-aura-accent">•</span>
                  <div>
                    <span className="text-aura-text-primary">{tool.name}</span>
                    {tool.notes && (
                      <span className="text-aura-text-secondary text-sm ml-2">
                        — {tool.notes}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </AuraCard>
        </div>

        {/* Right: Cut Diagram & Concept */}
        <div className="space-y-6">
          {/* Cut Diagram */}
          {materialPlan.cutDiagramUrl && (
            <AuraCard variant="elevated" padding="md">
              <h3 className="text-xl font-semibold text-aura-text-primary mb-4 flex items-center gap-2">
                <span className="text-2xl">✂️</span> Cut Layout
              </h3>
              <div className="bg-aura-surface rounded-lg overflow-hidden">
                <img
                  src={materialPlan.cutDiagramUrl}
                  alt="Cut layout diagram"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-aura-text-secondary mt-3 text-center">
                Print this diagram or use as reference when cutting
              </p>
            </AuraCard>
          )}

          {/* Selected Concept Preview */}
          {selectedConcept && (
            <AuraCard variant="glass" padding="md">
              <h3 className="text-lg font-semibold text-aura-text-primary mb-3">
                Your Design
              </h3>
              <div className="rounded-lg overflow-hidden">
                <img
                  src={
                    selectedConcept.finalImageUrl ||
                    selectedConcept.sketch.imageUrl
                  }
                  alt={selectedConcept.sketch.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              {selectedConcept.refinements.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-aura-text-secondary mb-1">
                    Refinements applied:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedConcept.refinements.map((ref, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-aura-accent/10 text-aura-accent rounded text-xs"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </AuraCard>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <AuraButton variant="secondary" onClick={onBack}>
          ← Back to Design
        </AuraButton>
        <AuraButton variant="accent" size="lg" onClick={onContinue}>
          Start Assembly →
        </AuraButton>
      </div>
    </div>
  );
};

export default MaterialPlanner;
