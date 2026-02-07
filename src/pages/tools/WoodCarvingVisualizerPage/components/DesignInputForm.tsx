import React from "react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";
import { Wand2 } from "lucide-react";

interface DesignInputFormProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  exampleDescriptions: string[];
  onOpenGallery?: () => void;
}

const DesignInputForm: React.FC<DesignInputFormProps> = ({
  description,
  onDescriptionChange,
  onSubmit,
  isLoading,
  exampleDescriptions,
  onOpenGallery,
}) => {
  return (
    <AuraCard variant="glass" padding="lg" className="max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-serif font-light text-aura-text-primary mb-2">
            What would you like to carve?
          </h2>
          <p className="text-aura-text-secondary">
            Describe your vision and we'll generate style variations
          </p>
        </div>

        {/* Textarea */}
        <div>
          <label
            htmlFor="prompt-input"
            className="block text-sm font-medium text-aura-accent mb-2 uppercase tracking-wider"
          >
            Project Description
          </label>
          <AuraInput
            id="prompt-input"
            type="textarea"
            rows={4}
            placeholder="Describe your idea (e.g., 'An owl perched on a driftwood branch, realistic style')..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (description.trim()) onSubmit();
              }
            }}
            className="text-lg bg-black/40 border-white/10 text-white placeholder:text-zinc-500"
          />
        </div>

        {/* Example Prompts */}
        <div>
          <p className="text-sm text-aura-text-secondary mb-3">
            Or try an example:
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleDescriptions.map((desc, i) => (
              <AuraButton
                key={i}
                variant="secondary"
                size="sm"
                onClick={() => onDescriptionChange(desc)}
                className="text-xs"
              >
                {desc}
              </AuraButton>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          {onOpenGallery && (
            <AuraButton
              variant="ghost"
              size="sm"
              onClick={onOpenGallery}
              className="text-aura-text-secondary"
            >
              View Past Projects
            </AuraButton>
          )}
          <AuraButton
            onClick={onSubmit}
            disabled={!description.trim() || isLoading}
            variant="accent"
            size="lg"
            isLoading={isLoading}
            icon={<Wand2 className="w-5 h-5" />}
            className="ml-auto"
          >
            Generate Styles
          </AuraButton>
        </div>
      </div>
    </AuraCard>
  );
};

export default DesignInputForm;
