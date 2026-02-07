import React from "react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";
import { Check, Ruler } from "lucide-react";
import type { CarvingVariation } from "@/services/woodCarvingService";

interface StyleSelectorProps {
  variations: CarvingVariation[];
  selectedVariation: CarvingVariation | null;
  onSelectVariation: (variation: CarvingVariation) => void;
  userNotes: string;
  onUserNotesChange: (notes: string) => void;
  onGenerateBlueprint: () => void;
  isLoading: boolean;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({
  variations,
  selectedVariation,
  onSelectVariation,
  userNotes,
  onUserNotesChange,
  onGenerateBlueprint,
  isLoading,
}) => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light text-aura-text-primary">
          Select Your Style
        </h2>
        <div className="text-sm text-aura-text-secondary">
          Click a card to select it
        </div>
      </div>

      {/* Variation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {variations.map((variation, index) => {
          const isSelected = selectedVariation === variation;
          return (
            <AuraCard
              key={index}
              variant="interactive"
              padding="none"
              onClick={() => onSelectVariation(variation)}
              className={`
                overflow-hidden transition-all duration-300 cursor-pointer
                ${
                  isSelected
                    ? "border-aura-accent ring-2 ring-aura-accent scale-[1.02]"
                    : "hover:scale-[1.02]"
                }
              `}
            >
              {/* Image */}
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

              {/* Info */}
              <div className="p-4 bg-zinc-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{variation.name}</h3>
                  {isSelected && (
                    <div className="bg-aura-accent rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-400 line-clamp-3">
                  {variation.description}
                </p>
              </div>
            </AuraCard>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      {selectedVariation && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur border-t border-white/10 p-6 z-50 animate-slide-up">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
            {/* Notes Input */}
            <div className="flex-1 w-full">
              <label
                htmlFor="notes-input"
                className="text-xs font-semibold uppercase text-aura-accent tracking-wider mb-1 block"
              >
                Refining Notes (Optional)
              </label>
              <AuraInput
                id="notes-input"
                type="text"
                placeholder="E.g., Make the beak sharper, remove the background..."
                value={userNotes}
                onChange={(e) => onUserNotesChange(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Generate Button */}
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
                onClick={onGenerateBlueprint}
                variant="accent"
                size="lg"
                isLoading={isLoading}
                icon={<Ruler className="w-5 h-5" />}
              >
                Generate Blueprint
              </AuraButton>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed footer */}
      {selectedVariation && <div className="h-24" />}
    </div>
  );
};

export default StyleSelector;
