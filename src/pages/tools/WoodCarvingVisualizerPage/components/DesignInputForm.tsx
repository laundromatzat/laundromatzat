import React, { useCallback } from "react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";
import { Wand2, Plus, X, Image as ImageIcon } from "lucide-react";

interface DesignInputFormProps {
  description: string;
  referenceImages: string[];
  onDescriptionChange: (value: string) => void;
  onImagesChange: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  onSubmit: () => void;
  isLoading: boolean;
  exampleDescriptions: string[];
  onOpenGallery?: () => void;
}

const DesignInputForm: React.FC<DesignInputFormProps> = ({
  description,
  referenceImages,
  onDescriptionChange,
  onImagesChange,
  onRemoveImage,
  onSubmit,
  isLoading,
  exampleDescriptions,
  onOpenGallery,
}) => {
  const handleFileDrop = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        onImagesChange(Array.from(e.target.files));
      }
      e.target.value = "";
    },
    [onImagesChange],
  );

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

        {/* Reference Photos */}
        <div>
          <label className="block text-sm font-medium text-aura-accent mb-2 uppercase tracking-wider">
            Reference Photos{" "}
            <span className="text-aura-text-tertiary font-normal normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <p className="text-xs text-aura-text-tertiary mb-3">
            Upload photos for style inspiration, subject reference, or to show
            the starting wood block.
          </p>

          <div className="flex flex-wrap gap-2">
            {referenceImages.map((img, idx) => (
              <div
                key={idx}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 group"
              >
                <img
                  src={`data:image/jpeg;base64,${img}`}
                  alt={`Ref ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onRemoveImage(idx)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label={`Remove reference ${idx + 1}`}
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {referenceImages.length < 6 && (
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-white/10 hover:border-aura-accent flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10">
                <ImageIcon size={16} className="text-aura-text-tertiary mb-1" />
                <span className="text-[10px] text-aura-text-tertiary">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileDrop}
                />
              </label>
            )}
          </div>
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
