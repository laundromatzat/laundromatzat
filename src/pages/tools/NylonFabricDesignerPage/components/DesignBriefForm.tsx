import React from "react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";
import { ProjectBrief, ClosureType } from "../hooks/useProjectState";

interface DesignBriefFormProps {
  brief: ProjectBrief;
  onUpdateBrief: (updates: Partial<ProjectBrief>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

const CLOSURE_OPTIONS: { value: ClosureType; label: string; icon: string }[] = [
  { value: "drawstring", label: "Drawstring", icon: "🪢" },
  { value: "zipper", label: "Zipper", icon: "🔗" },
  { value: "flap", label: "Flap/Buckle", icon: "🎒" },
  { value: "open", label: "Open Top", icon: "🛍️" },
];

const FEATURE_OPTIONS = [
  { id: "waterproof", label: "Water Resistant" },
  { id: "pockets", label: "Internal Pockets" },
  { id: "reinforced", label: "Reinforced Corners" },
  { id: "padded", label: "Padded/Quilted" },
  { id: "adjustable", label: "Adjustable Straps" },
  { id: "modular", label: "Modular/Attachable" },
];

const EXAMPLE_PROJECTS = [
  {
    key: "stuffsack",
    label: "Stuff Sack",
    brief: {
      description: "Lightweight stuff sack for camping sleeping bag",
      size: { height: 12, width: 8, depth: 8, unit: "in" as const },
      closure: "drawstring" as ClosureType,
      features: ["waterproof"],
    },
  },
  {
    key: "tote",
    label: "Tote Bag",
    brief: {
      description: "Medium tote bag for groceries and daily use",
      size: { height: 14, width: 15, depth: 6, unit: "in" as const },
      closure: "open" as ClosureType,
      features: ["pockets", "reinforced"],
    },
  },
  {
    key: "pouch",
    label: "Zipper Pouch",
    brief: {
      description: "Rectangular toiletry pouch with waterproof lining",
      size: { height: 6, width: 10, depth: 3, unit: "in" as const },
      closure: "zipper" as ClosureType,
      features: ["waterproof"],
    },
  },
  {
    key: "apron",
    label: "Tool Apron",
    brief: {
      description: "Work apron with multiple tool pockets for workshop",
      size: { height: 24, width: 20, unit: "in" as const },
      closure: "buckle" as ClosureType,
      features: ["pockets", "reinforced", "adjustable"],
    },
  },
];

const DesignBriefForm: React.FC<DesignBriefFormProps> = ({
  brief,
  onUpdateBrief,
  onSubmit,
  isLoading,
  error,
}) => {
  const toggleFeature = (featureId: string) => {
    const current = brief.features;
    const updated = current.includes(featureId)
      ? current.filter((f) => f !== featureId)
      : [...current, featureId];
    onUpdateBrief({ features: updated });
  };

  const loadExample = (example: (typeof EXAMPLE_PROJECTS)[0]) => {
    onUpdateBrief(example.brief);
  };

  const isValid =
    brief.description.trim().length > 10 &&
    brief.size.height > 0 &&
    brief.size.width > 0;

  return (
    <AuraCard variant="glass" padding="lg" className="max-w-3xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-aura-text-primary mb-2">
            Design Your Project
          </h2>
          <p className="text-aura-text-secondary">
            Tell us about what you want to make. The more detail, the better!
          </p>
        </div>

        {/* Quick Examples */}
        <div>
          <p className="text-sm text-aura-text-secondary mb-3">
            Or start with an example:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROJECTS.map((ex) => (
              <AuraButton
                key={ex.key}
                variant="secondary"
                size="sm"
                onClick={() => loadExample(ex)}
                className="rounded-full"
              >
                {ex.label}
              </AuraButton>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-aura-text-primary mb-2">
            Project Description <span className="text-aura-error">*</span>
          </label>
          <AuraInput
            id="description"
            type="textarea"
            placeholder="Describe what you want to make, its purpose, and any special requirements..."
            value={brief.description}
            onChange={(e) => onUpdateBrief({ description: e.target.value })}
            className="min-h-[120px]"
          />
        </div>

        {/* Size Inputs */}
        <div>
          <label className="block text-sm font-medium text-aura-text-primary mb-3">
            Approximate Dimensions <span className="text-aura-error">*</span>
          </label>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-aura-text-secondary">Height</label>
              <AuraInput
                id="height"
                type="number"
                min={0}
                value={brief.size.height || ""}
                onChange={(e) =>
                  onUpdateBrief({
                    size: { ...brief.size, height: Number(e.target.value) },
                  })
                }
                placeholder="12"
              />
            </div>
            <div>
              <label className="text-xs text-aura-text-secondary">Width</label>
              <AuraInput
                id="width"
                type="number"
                min={0}
                value={brief.size.width || ""}
                onChange={(e) =>
                  onUpdateBrief({
                    size: { ...brief.size, width: Number(e.target.value) },
                  })
                }
                placeholder="8"
              />
            </div>
            <div>
              <label className="text-xs text-aura-text-secondary">
                Depth <span className="text-aura-text-secondary">(opt)</span>
              </label>
              <AuraInput
                id="depth"
                type="number"
                min={0}
                value={brief.size.depth || ""}
                onChange={(e) =>
                  onUpdateBrief({
                    size: {
                      ...brief.size,
                      depth: Number(e.target.value) || undefined,
                    },
                  })
                }
                placeholder="—"
              />
            </div>
            <div>
              <label className="text-xs text-aura-text-secondary">Unit</label>
              <div className="flex rounded-lg overflow-hidden border border-aura-border">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateBrief({ size: { ...brief.size, unit: "in" } })
                  }
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    brief.size.unit === "in"
                      ? "bg-aura-accent text-white"
                      : "bg-aura-surface text-aura-text-secondary hover:bg-aura-surface-elevated"
                  }`}
                >
                  in
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateBrief({ size: { ...brief.size, unit: "cm" } })
                  }
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    brief.size.unit === "cm"
                      ? "bg-aura-accent text-white"
                      : "bg-aura-surface text-aura-text-secondary hover:bg-aura-surface-elevated"
                  }`}
                >
                  cm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Closure Type */}
        <div>
          <label className="block text-sm font-medium text-aura-text-primary mb-3">
            Closure Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CLOSURE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateBrief({ closure: opt.value })}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  brief.closure === opt.value
                    ? "border-aura-accent bg-aura-accent/10"
                    : "border-aura-border bg-aura-surface hover:border-aura-accent/50"
                }`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div
                  className={`text-sm font-medium ${
                    brief.closure === opt.value
                      ? "text-aura-accent"
                      : "text-aura-text-primary"
                  }`}
                >
                  {opt.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-aura-text-primary mb-3">
            Features (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {FEATURE_OPTIONS.map((feat) => (
              <button
                key={feat.id}
                type="button"
                onClick={() => toggleFeature(feat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  brief.features.includes(feat.id)
                    ? "border-aura-accent bg-aura-accent text-white"
                    : "border-aura-border bg-aura-surface text-aura-text-secondary hover:border-aura-accent/50"
                }`}
              >
                {brief.features.includes(feat.id) && "✓ "}
                {feat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-aura-error/10 border border-aura-error rounded-lg text-aura-error">
            {error}
          </div>
        )}

        {/* Submit */}
        <AuraButton
          fullWidth
          variant="accent"
          size="lg"
          onClick={onSubmit}
          isLoading={isLoading}
          disabled={isLoading || !isValid}
        >
          Generate Concept Sketches →
        </AuraButton>

        {!isValid && (
          <p className="text-center text-sm text-aura-text-secondary">
            Please add a description and dimensions to continue
          </p>
        )}
      </div>
    </AuraCard>
  );
};

export default DesignBriefForm;
