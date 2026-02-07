import React, { useState } from "react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";
import { ConceptSketch, SelectedConcept } from "../hooks/useProjectState";

interface ConceptExplorerProps {
  concepts: ConceptSketch[];
  selectedConcept: SelectedConcept | undefined;
  onSelectConcept: (sketch: ConceptSketch) => void;
  onAddRefinement: (refinement: string) => void;
  onRegenerateConcepts: () => void;
  onContinue: () => void;
  isLoading: boolean;
  isRegenerating: boolean;
}

const ConceptExplorer: React.FC<ConceptExplorerProps> = ({
  concepts,
  selectedConcept,
  onSelectConcept,
  onAddRefinement,
  onRegenerateConcepts,
  onContinue,
  isLoading,
  isRegenerating,
}) => {
  const [refinementInput, setRefinementInput] = useState("");

  const handleAddRefinement = () => {
    if (refinementInput.trim()) {
      onAddRefinement(refinementInput.trim());
      setRefinementInput("");
    }
  };

  if (isLoading && concepts.length === 0) {
    return (
      <AuraCard variant="glass" padding="lg" className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aura-accent mx-auto" />
          <p className="mt-6 text-xl text-aura-text-primary">
            Generating concept sketches...
          </p>
          <p className="text-aura-text-secondary mt-2">
            Creating visual variations based on your design brief
          </p>
        </div>
      </AuraCard>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-aura-text-primary mb-2">
          Choose Your Design Direction
        </h2>
        <p className="text-aura-text-secondary">
          Select a concept that matches your vision, then refine it
        </p>
      </div>

      {/* Concept Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {concepts.map((concept) => {
          const isSelected = selectedConcept?.sketch.id === concept.id;
          return (
            <button
              key={concept.id}
              type="button"
              onClick={() => onSelectConcept(concept)}
              className={`group relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                isSelected
                  ? "border-aura-accent ring-2 ring-aura-accent/30 scale-[1.02]"
                  : "border-aura-border hover:border-aura-accent/50"
              }`}
            >
              {/* Image */}
              <div className="aspect-square bg-aura-surface overflow-hidden">
                <img
                  src={concept.imageUrl}
                  alt={concept.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Selection Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-aura-accent flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div className="p-4 bg-aura-surface-elevated">
                <h3
                  className={`font-semibold ${
                    isSelected ? "text-aura-accent" : "text-aura-text-primary"
                  }`}
                >
                  {concept.name}
                </h3>
                <p className="text-sm text-aura-text-secondary mt-1 line-clamp-2">
                  {concept.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Regenerate Button */}
      <div className="flex justify-center">
        <AuraButton
          variant="secondary"
          size="sm"
          onClick={onRegenerateConcepts}
          isLoading={isRegenerating}
          disabled={isRegenerating}
        >
          ↻ Generate New Variations
        </AuraButton>
      </div>

      {/* Refinement Section */}
      {selectedConcept && (
        <AuraCard variant="elevated" padding="lg" className="mt-8">
          <h3 className="text-xl font-semibold text-aura-text-primary mb-4">
            Refine Your Selection
          </h3>

          {/* Current Refinements */}
          {selectedConcept.refinements.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-aura-text-secondary mb-2">
                Your refinements:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedConcept.refinements.map((ref, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-aura-accent/20 text-aura-accent rounded-full text-sm"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add Refinement */}
          <div className="flex gap-3">
            <div className="flex-1">
              <AuraInput
                id="refinement"
                type="text"
                placeholder="Add internal mesh pocket, change to olive green..."
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRefinement();
                  }
                }}
              />
            </div>
            <AuraButton
              variant="secondary"
              onClick={handleAddRefinement}
              disabled={!refinementInput.trim()}
            >
              Add
            </AuraButton>
          </div>

          <p className="text-sm text-aura-text-secondary mt-3">
            Describe any changes you'd like: color, pockets, straps, etc.
          </p>
        </AuraCard>
      )}

      {/* Continue Button */}
      {selectedConcept && (
        <div className="flex justify-end">
          <AuraButton
            variant="accent"
            size="lg"
            onClick={onContinue}
            disabled={isLoading}
          >
            Continue to Materials →
          </AuraButton>
        </div>
      )}
    </div>
  );
};

export default ConceptExplorer;
