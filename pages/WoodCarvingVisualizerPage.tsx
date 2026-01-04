import React, { useState } from "react";
import { useLoading } from "../context/LoadingContext";
import {
  generateCarvingVariations,
  generateDetailedImages,
  type CarvingVariation,
  type DetailedImage,
} from "../services/woodCarvingService";

const WoodCarvingVisualizerPage: React.FC = () => {
  const { setIsLoading: setGlobalLoading } = useLoading();
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variations, setVariations] = useState<CarvingVariation[] | null>(null);
  const [selectedVariation, setSelectedVariation] =
    useState<CarvingVariation | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [detailedImages, setDetailedImages] = useState<DetailedImage[] | null>(
    null
  );
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);

  const examples = {
    eagle:
      "A majestic bald eagle in flight with wings spread wide, detailed feathers, soaring over mountains",
    floral:
      "An intricate floral design with roses, leaves, and vines in an ornate Victorian style",
    celtic:
      "A traditional Celtic knot pattern with interwoven bands forming a circular medallion",
    wildlife:
      "A detailed forest scene with deer, trees, and a flowing stream carved in relief",
  };

  const handleGenerateVariations = async () => {
    if (!projectDescription) {
      setError("Please enter a carving design description");
      return;
    }

    setIsLoading(true);
    setError(null);
    setVariations(null);
    setSelectedVariation(null);
    setDetailedImages(null);
    setUserNotes("");
    setGlobalLoading(true);

    try {
      const generatedVariations = await generateCarvingVariations(
        projectDescription
      );
      setVariations(generatedVariations);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while generating design variations.";
      setError(message);
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleSelectVariation = (variation: CarvingVariation) => {
    setSelectedVariation(variation);
    setDetailedImages(null);
    setUserNotes("");
    setError(null);
  };

  const handleGenerateDetails = async () => {
    if (!selectedVariation) {
      return;
    }

    setIsGeneratingDetails(true);
    setError(null);
    setGlobalLoading(true);

    try {
      const images = await generateDetailedImages(
        projectDescription,
        selectedVariation,
        userNotes || undefined
      );
      setDetailedImages(images);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while generating detailed images.";
      setError(message);
    } finally {
      setIsGeneratingDetails(false);
      setGlobalLoading(false);
    }
  };

  const startNewProject = () => {
    setProjectDescription("");
    setVariations(null);
    setSelectedVariation(null);
    setDetailedImages(null);
    setUserNotes("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-brand-primary font-sans text-brand-text">
      <header className="bg-brand-secondary border-b border-brand-surface-highlight shadow-layer-1 p-8 text-center">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-accent-strong">
          Wood Carving Visualizer
        </h1>
        <p className="text-lg text-aura-text-secondary mt-2">
          Generate multiple design variations, select your favorite, and create
          detailed renderings
        </p>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Step 1: Initial Description Input */}
        {!variations && (
          <div className="bg-brand-secondary border border-brand-surface-highlight rounded-lg shadow-layer-1 p-8">
            <h2 className="text-2xl font-semibold text-aura-text-primary mb-4">
              Describe Your Wood Carving Design
            </h2>
            <p className="text-aura-text-secondary mb-6">
              Tell us what you want to carve. Be detailed about the subject,
              style, and any specific elements you&apos;d like to include.
            </p>
            <textarea
              id="projectDescription"
              className="w-full min-h-[150px] p-4 border-2 border-brand-surface-highlight bg-brand-primary text-aura-text-primary placeholder:text-aura-text-secondary rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
              placeholder="Example: A majestic bald eagle in flight with wings spread wide..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <div className="flex gap-4 mt-4 flex-wrap">
              {Object.entries(examples).map(([key, value]) => (
                <button
                  key={key}
                  className="bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-full hover:bg-brand-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition text-sm"
                  onClick={() => setProjectDescription(value)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="mt-6 w-full bg-gradient-to-r from-brand-accent to-brand-accent-strong text-brand-on-accent font-bold py-3 px-6 rounded-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition disabled:opacity-50"
              onClick={handleGenerateVariations}
              disabled={isLoading}
            >
              {isLoading ? "Generating Variations..." : "Generate Design Variations"}
            </button>
            {error && <p className="text-status-error-text mt-4">{error}</p>}
          </div>
        )}

        {isLoading && !variations && (
          <div className="text-center p-12 bg-brand-secondary border border-brand-surface-highlight rounded-lg shadow-layer-1">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent mx-auto"></div>
            <p className="mt-4 text-xl text-aura-text-primary">
              Creating design variations...
            </p>
            <p className="text-aura-text-secondary">
              Generating 4 unique artistic interpretations
            </p>
          </div>
        )}

        {/* Step 2: Display Variations and Selection */}
        {variations && !detailedImages && (
          <div className="bg-brand-secondary border border-brand-surface-highlight rounded-lg shadow-layer-1 p-8">
            <div className="flex justify-between items-center border-b border-brand-surface-highlight pb-4 mb-6">
              <h2 className="text-3xl font-bold text-aura-text-primary">
                {selectedVariation
                  ? "Selected Variation"
                  : "Choose Your Favorite Design"}
              </h2>
              <button
                className="bg-brand-accent text-brand-on-accent font-bold py-2 px-4 rounded-lg hover:bg-brand-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition"
                onClick={startNewProject}
              >
                New Project
              </button>
            </div>

            {!selectedVariation && (
              <p className="text-aura-text-secondary mb-6">
                Click on a variation to select it and proceed with detailed
                renderings
              </p>
            )}

            {error && <p className="text-status-error-text mb-4">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {variations.map((variation, index) => (
                <button
                  key={index}
                  type="button"
                  className={`border-2 rounded-lg shadow-layer-1 overflow-hidden bg-brand-primary cursor-pointer transition-all text-left ${
                    selectedVariation === variation
                      ? "border-brand-accent ring-4 ring-brand-accent/30"
                      : "border-brand-surface-highlight hover:border-brand-accent/50"
                  }`}
                  onClick={() => handleSelectVariation(variation)}
                  aria-pressed={selectedVariation === variation}
                  aria-label={`Select ${variation.name}: ${variation.description}`}
                >
                  <div
                    className="bg-brand-secondary p-4 flex items-center justify-center min-h-[400px]"
                    dangerouslySetInnerHTML={{ __html: variation.svg }}
                  />
                  <div className="p-4 bg-brand-primary">
                    <p className="font-bold text-lg text-brand-accent mb-2">
                      {variation.name}
                    </p>
                    <p className="text-aura-text-secondary text-sm">
                      {variation.description}
                    </p>
                  </div>
                  {selectedVariation === variation && (
                    <div className="bg-brand-accent text-brand-on-accent text-center py-2 font-semibold">
                      ✓ Selected
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Step 3: Optional Notes and Generate Details */}
            {selectedVariation && (
              <div className="border-t border-brand-surface-highlight pt-6">
                <h3 className="text-xl font-semibold text-aura-text-primary mb-4">
                  Refine Your Design (Optional)
                </h3>
                <p className="text-aura-text-secondary mb-4">
                  Add any notes or requested changes for the detailed renderings:
                </p>
                <textarea
                  className="w-full min-h-[100px] p-4 border-2 border-brand-surface-highlight bg-brand-primary text-aura-text-primary placeholder:text-aura-text-secondary rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
                  placeholder="Example: Make the feathers more detailed, add more texture to the wood grain, emphasize the depth..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                />
                <button
                  className="mt-4 w-full bg-gradient-to-r from-brand-accent to-brand-accent-strong text-brand-on-accent font-bold py-3 px-6 rounded-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition disabled:opacity-50"
                  onClick={handleGenerateDetails}
                  disabled={isGeneratingDetails}
                >
                  {isGeneratingDetails
                    ? "Generating Detailed Images..."
                    : "Generate Detailed Views"}
                </button>
              </div>
            )}

            {isGeneratingDetails && (
              <div className="text-center p-12 bg-brand-primary border border-brand-surface-highlight rounded-lg shadow-layer-1 mt-6">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent mx-auto"></div>
                <p className="mt-4 text-xl text-aura-text-primary">
                  Creating detailed renderings...
                </p>
                <p className="text-aura-text-secondary">
                  Generating high-quality views with enhanced details
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Display Detailed Images */}
        {detailedImages && selectedVariation && (
          <div className="bg-brand-secondary border border-brand-surface-highlight rounded-lg shadow-layer-1 p-8">
            <div className="flex justify-between items-center border-b border-brand-surface-highlight pb-4 mb-6">
              <h2 className="text-3xl font-bold text-aura-text-primary">
                Detailed Renderings: {selectedVariation.name}
              </h2>
              <div className="flex gap-2">
                <button
                  className="bg-brand-accent/20 text-brand-accent font-bold py-2 px-4 rounded-lg hover:bg-brand-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition"
                  onClick={() => {
                    setDetailedImages(null);
                    setUserNotes("");
                  }}
                >
                  Back to Variations
                </button>
                <button
                  className="bg-brand-accent text-brand-on-accent font-bold py-2 px-4 rounded-lg hover:bg-brand-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition"
                  onClick={startNewProject}
                >
                  New Project
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-aura-text-primary">
                <strong>Original Design:</strong> {projectDescription}
              </p>
              {userNotes && (
                <p className="text-aura-text-secondary mt-2">
                  <strong>Requested Changes:</strong> {userNotes}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {detailedImages.map((image, index) => (
                <div
                  key={index}
                  className="border border-brand-surface-highlight rounded-lg shadow-layer-1 overflow-hidden bg-brand-primary"
                >
                  <div
                    className="bg-brand-secondary p-4 flex items-center justify-center min-h-[500px]"
                    dangerouslySetInnerHTML={{ __html: image.svg }}
                  />
                  <div className="p-4 bg-brand-primary">
                    <p className="font-bold text-center text-brand-accent">
                      {image.view}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-brand-surface-highlight pt-6">
              <button
                className="w-full bg-gradient-to-r from-brand-accent to-brand-accent-strong text-brand-on-accent font-bold py-3 px-6 rounded-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition"
                onClick={() => {
                  setDetailedImages(null);
                  setUserNotes("");
                }}
              >
                Try Different Notes / Regenerate
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WoodCarvingVisualizerPage;
