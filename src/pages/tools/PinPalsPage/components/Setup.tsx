/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Minus, Settings, Loader2 } from "lucide-react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";

interface SetupProps {
  petImage: string | null;
  petType: string;
  petCount: number;
  isDetecting: boolean;
  onImageUpload: (file: File) => void;
  onTypeChange: (val: string) => void;
  onCountChange: (count: number) => void;
  onGenerate: () => void;
}

export const Setup: React.FC<SetupProps> = ({
  petImage,
  petType,
  petCount,
  isDetecting,
  onImageUpload,
  onTypeChange,
  onCountChange,
  onGenerate,
}) => {
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  const isDog = petType === "DOG" || petType === "DOGS";
  const isCat = petType === "CAT" || petType === "CATS";
  const isCustom = !isDog && !isCat;

  return (
    <div className="animate-in-up">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Upload Area */}
        <div className="flex-1">
          <label
            htmlFor="pet-image-upload"
            className="text-sm font-medium text-aura-text-secondary block mb-2"
          >
            Source Image
          </label>
          <div
            className={`
            relative h-72 rounded-xl border-2 border-dashed transition-all duration-300
            flex flex-col items-center justify-center p-6 cursor-pointer group overflow-hidden
            ${
              petImage
                ? "border-aura-border bg-aura-surface-elevated"
                : "border-aura-border bg-aura-bg/30 hover:bg-aura-bg hover:border-aura-accent"
            }
          `}
          >
            <input
              id="pet-image-upload"
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) =>
                e.target.files?.[0] && onImageUpload(e.target.files[0])
              }
            />

            {petImage ? (
              <>
                <img
                  src={`data:image/jpeg;base64,${petImage}`}
                  alt="Pet Preview"
                  className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-40 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <span className="bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    Change Photo
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-aura-text-tertiary space-y-3 pointer-events-none">
                <div className="w-12 h-12 bg-aura-border-light rounded-full flex items-center justify-center mx-auto text-aura-text-secondary group-hover:text-aura-primary transition-colors">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                </div>
                <div>
                  <span className="block text-sm font-medium text-aura-text-primary">
                    Upload Photo
                  </span>
                  <span className="block text-xs mt-1 text-aura-text-tertiary">
                    JPG, PNG up to 5MB
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex-1 flex flex-col">
          <div className="flex-grow">
            <span className="text-sm font-medium text-aura-text-secondary block mb-2">
              Subject Analysis
            </span>

            {isDetecting ? (
              <AuraCard
                padding="sm"
                variant="bordered"
                className="flex items-center gap-3 h-[52px]"
              >
                <Loader2 className="w-4 h-4 text-aura-accent animate-spin" />
                <span className="text-sm text-aura-text-secondary">
                  Identifying species...
                </span>
              </AuraCard>
            ) : (
              <AuraCard
                padding="sm"
                variant="bordered"
                className="flex items-center justify-between h-[52px]"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="text-emerald-500"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-sm font-medium text-aura-text-primary uppercase tracking-wide">
                    {petCount > 1 ? `${petCount} ` : ""}
                    {petType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <AuraButton
                    variant="ghost"
                    size="sm"
                    icon={<Settings size={16} />}
                    onClick={() => setIsOverrideOpen(!isOverrideOpen)}
                    aria-label="Toggle settings override"
                  />
                </div>
              </AuraCard>
            )}

            {isOverrideOpen && (
              <AuraCard
                variant="glass"
                padding="md"
                className="mt-4 space-y-4 animate-scale-in"
              >
                {/* Species Toggle */}
                <div>
                  <span className="text-xs text-aura-text-secondary font-medium mb-2 block">
                    Species
                  </span>
                  <div className="flex gap-2">
                    <AuraButton
                      onClick={() =>
                        onTypeChange(petCount > 1 ? "DOGS" : "DOG")
                      }
                      variant={isDog ? "primary" : "secondary"}
                      size="sm"
                      className="flex-1 justify-center"
                    >
                      Dog
                    </AuraButton>
                    <AuraButton
                      onClick={() =>
                        onTypeChange(petCount > 1 ? "CATS" : "CAT")
                      }
                      variant={isCat ? "primary" : "secondary"}
                      size="sm"
                      className="flex-1 justify-center"
                    >
                      Cat
                    </AuraButton>
                    <AuraButton
                      onClick={() => {
                        if (!isCustom) onTypeChange("");
                      }}
                      variant={isCustom ? "primary" : "secondary"}
                      size="sm"
                      className="flex-1 justify-center"
                    >
                      Custom
                    </AuraButton>
                  </div>

                  {isCustom && (
                    <div className="mt-2">
                      <AuraInput
                        value={petType}
                        onChange={(e) =>
                          onTypeChange(e.target.value.toUpperCase())
                        }
                        placeholder="Enter species..."
                        aria-label="Custom species"
                      />
                    </div>
                  )}
                </div>

                {/* Count Stepper */}
                <div>
                  <span className="text-xs text-aura-text-secondary font-medium mb-2 block">
                    Quantity
                  </span>
                  <div className="flex items-center gap-3">
                    <AuraButton
                      onClick={() => onCountChange(Math.max(1, petCount - 1))}
                      variant="secondary"
                      size="icon"
                      icon={<Minus size={16} />}
                      aria-label="Decrease quantity"
                    />

                    <span className="w-8 text-center font-medium text-aura-text-primary">
                      {petCount}
                    </span>

                    <AuraButton
                      onClick={() => onCountChange(petCount + 1)}
                      variant="secondary"
                      size="icon"
                      icon={<Plus size={16} />}
                      aria-label="Increase quantity"
                    />
                  </div>
                </div>
              </AuraCard>
            )}
          </div>

          <AuraButton
            onClick={onGenerate}
            disabled={!petImage || isDetecting}
            variant="primary"
            className="w-full mt-8"
            size="lg"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
            Generate Pin
          </AuraButton>
        </div>
      </div>
    </div>
  );
};
